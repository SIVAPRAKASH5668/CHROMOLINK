const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const transcribeWithGroq = async (audioFilePath) => {
  try {
    console.log('Transcribing audio file:', audioFilePath);
    
    // Check if file exists before attempting to transcribe
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // Check file size
    const stats = fs.statSync(audioFilePath);
    console.log('Audio file size:', stats.size, 'bytes');
    
    if (stats.size === 0) {
      throw new Error('Audio file is empty');
    }

    // Check if GROQ_API_KEY is set
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'json');

    console.log('Sending request to Groq API...');
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          ...formData.getHeaders()
        },
        timeout: 60000 // 60 second timeout
      }
    );

    console.log('Groq API response status:', response.status);
    console.log('Groq API response data:', JSON.stringify(response.data, null, 2));

    // Check if the response contains text
    if (!response.data || !response.data.text) {
      console.error('No text in Groq response:', response.data);
      throw new Error('No transcription text returned from Groq API');
    }

    const transcriptionText = response.data.text.trim();
    
    if (!transcriptionText) {
      throw new Error('Transcription text is empty');
    }

    console.log('Transcription successful, text length:', transcriptionText.length);
    return transcriptionText;
    
  } catch (error) {
    console.error('Groq transcription error:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    }
    
    throw new Error(`Transcription failed: ${error.message}`);
  }
};

const extractAudioFromVideo = (videoPath, audioPath) => {
  return new Promise((resolve, reject) => {
    console.log('Video path:', videoPath);
    console.log('Audio path:', audioPath);

    // Check if input video file exists
    if (!fs.existsSync(videoPath)) {
      return reject(new Error(`Video file not found: ${videoPath}`));
    }

    // Ensure output directory exists
    const outputDir = path.dirname(audioPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if output file already exists and remove it
    if (fs.existsSync(audioPath)) {
      try {
        fs.unlinkSync(audioPath);
      } catch (err) {
        console.warn('Could not remove existing audio file:', err.message);
      }
    }

    ffmpeg(videoPath)
      .output(audioPath)
      .audioCodec('libmp3lame')
      .audioFrequency(44100)
      .audioBitrate('128k')
      .format('mp3')
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        console.log('Processing: ' + progress.percent + '% done');
      })
      .on('end', () => {
        console.log('Audio extraction completed successfully');
        resolve();
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(new Error(`Audio extraction failed: ${err.message}`));
      })
      .run();
  });
};

module.exports = {
  transcribeWithGroq,
  extractAudioFromVideo
};