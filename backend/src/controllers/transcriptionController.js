const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const transcriptionService = require('../services/transcriptionService');
const nlpService = require('../services/nlpService');

// In-memory storage for demo (use database in production)
const transcripts = new Map();

const uploadRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { meetingId } = req.body;
    const transcriptId = meetingId || uuidv4();
    
    const transcript = {
      id: transcriptId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      status: 'uploaded',
      createdAt: new Date().toISOString()
    };
    
    transcripts.set(transcriptId, transcript);
    
    // Start transcription process
    processTranscription(transcriptId);
    
    res.json({ 
      success: true, 
      meetingId: transcriptId,
      message: 'File uploaded successfully' 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

const transcribeWithGroq = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const transcript = await transcriptionService.transcribeWithGroq(req.file.path);
    
    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      console.warn('Could not delete uploaded file:', err.message);
    }
    
    res.json({ transcript });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getTranscript = (req, res) => {
  const { id } = req.params;
  const transcript = transcripts.get(id);
  
  if (!transcript) {
    return res.status(404).json({ error: 'Transcript not found' });
  }
  
  res.json(transcript);
};

const getAllTranscripts = (req, res) => {
  const transcriptList = Array.from(transcripts.values());
  res.json(transcriptList);
};

const processTranscript = async (req, res) => {
  try {
    const { id } = req.params;
    const transcript = transcripts.get(id);
    
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found' });
    }
    
    if (!transcript.text) {
      return res.status(400).json({ error: 'No transcript text available' });
    }
    
    // Process with NLP service
    const analysis = await nlpService.processTranscript(transcript.text);
    
    transcript.analysis = analysis;
    transcript.processedAt = new Date().toISOString();
    transcripts.set(id, transcript);
    
    res.json({ 
      success: true, 
      summary: analysis 
    });
  } catch (error) {
    console.error('Process transcript error:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateAnalysis = (req, res) => {
  try {
    const { id } = req.params;
    const analysis = req.body;
    
    const transcript = transcripts.get(id);
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found' });
    }
    
    transcript.analysis = analysis;
    transcript.processedAt = new Date().toISOString();
    transcripts.set(id, transcript);
    
    res.json({ success: true, message: 'Analysis updated successfully' });
  } catch (error) {
    console.error('Update analysis error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to process transcription
const processTranscription = async (transcriptId) => {
  let audioPath = null;
  let audioFileCreated = false;
  
  try {
    const transcript = transcripts.get(transcriptId);
    if (!transcript) {
      console.error('Transcript not found for processing:', transcriptId);
      return;
    }
    
    transcript.status = 'transcribing';
    transcripts.set(transcriptId, transcript);
    
    console.log('Starting transcription for:', transcriptId);
    console.log('File path:', transcript.path);
    
    // Check if the original file exists
    try {
      await fs.access(transcript.path);
      const stats = await fs.stat(transcript.path);
      console.log('Original file size:', stats.size, 'bytes');
    } catch (err) {
      throw new Error(`Original file not found: ${transcript.path}`);
    }
    
    // Extract audio if it's a video file
    audioPath = transcript.path;
    const fileExtension = path.extname(transcript.path).toLowerCase();
    
    if (['.mp4', '.avi', '.mov', '.mkv'].includes(fileExtension)) {
      // Create audio file path in the same directory as the video
      const audioDir = path.dirname(transcript.path);
      const baseName = path.basename(transcript.path, fileExtension);
      audioPath = path.join(audioDir, `${baseName}_audio.mp3`);
      audioFileCreated = true;
      
      console.log('Extracting audio from video...');
      console.log('Video file:', transcript.path);
      console.log('Audio output:', audioPath);
      
      await transcriptionService.extractAudioFromVideo(transcript.path, audioPath);
      console.log('Audio extraction completed');
      
      // Verify audio file was created and has content
      try {
        const audioStats = await fs.stat(audioPath);
        console.log('Extracted audio file size:', audioStats.size, 'bytes');
        
        if (audioStats.size === 0) {
          throw new Error('Extracted audio file is empty');
        }
      } catch (err) {
        throw new Error(`Audio file verification failed: ${err.message}`);
      }
    }
    
    // Verify audio file exists before transcription
    try {
      await fs.access(audioPath);
      console.log('Audio file verified, proceeding with transcription...');
    } catch (err) {
      throw new Error(`Audio file not accessible: ${audioPath}`);
    }
    
    // Transcribe with Groq
    console.log('Starting Groq transcription...');
    const transcriptText = await transcriptionService.transcribeWithGroq(audioPath);
    
    if (!transcriptText || transcriptText.trim() === '') {
      throw new Error('Transcription returned empty text');
    }
    
    console.log('Transcription text preview:', transcriptText.substring(0, 100) + '...');
    
    transcript.text = transcriptText;
    transcript.status = 'completed';
    transcript.transcribedAt = new Date().toISOString();
    
    transcripts.set(transcriptId, transcript);
    
    console.log('Transcription completed successfully for:', transcriptId);
    
  } catch (error) {
    console.error('Transcription processing error for:', transcriptId, error);
    const transcript = transcripts.get(transcriptId);
    if (transcript) {
      transcript.status = 'error';
      transcript.error = error.message;
      transcript.erroredAt = new Date().toISOString();
      transcripts.set(transcriptId, transcript);
    }
  
  }
    /*finally {
    // Clean up audio file if it was extracted (but keep the original video)
    if (audioFileCreated && audioPath && audioPath !== transcript?.path) {
      try {
        await fs.unlink(audioPath);
        console.log('Temporary audio file cleaned up:', audioPath);
      } catch (err) {
        console.warn('Could not delete temporary audio file:', err.message);
      }
    }
    
  } */
};

module.exports = {
  uploadRecording,
  transcribeWithGroq,
  getTranscript,
  getAllTranscripts,
  processTranscript,
  updateAnalysis
};