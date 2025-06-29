const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;

// Store active recordings
const activeRecordings = new Map();

const startRecording = async (meetingId, zoomMeetingId) => {
  try {
    // Ensure recordings directory exists
    const recordingDir = process.env.RECORDING_PATH || './recordings';
    await fs.mkdir(recordingDir, { recursive: true });
    
    const recordingPath = path.join(recordingDir, `${meetingId}.mp4`);
    
    return new Promise((resolve, reject) => {
      // For demo purposes, we'll simulate screen recording
      // In production, you'd integrate with Zoom SDK or screen capture
      const command = ffmpeg()
        .input(':0.0') // Screen capture on Linux/Mac
        .inputOptions([
          '-f x11grab', 
          '-r 30',
          '-s 1920x1080' // Set resolution
        ])
        .output(recordingPath)
        .videoCodec('libx264')
        .outputOptions([
          '-preset fast',
          '-crf 23'
        ])
        .on('start', (commandLine) => {
          console.log('Recording started:', commandLine);
          activeRecordings.set(meetingId, { command, path: recordingPath });
          resolve(recordingPath);
        })
        .on('error', (err) => {
          console.error('Recording error:', err);
          activeRecordings.delete(meetingId);
          reject(err);
        })
        .on('end', () => {
          console.log('Recording ended for:', meetingId);
        });
        
      command.run();
    });
  } catch (error) {
    console.error('Start recording error:', error);
    throw error;
  }
};

const stopRecording = async (meetingId) => {
  const recording = activeRecordings.get(meetingId);
  if (!recording) {
    throw new Error('No active recording found for this meeting');
  }
  
  return new Promise((resolve, reject) => {
    const { command, path: recordingPath } = recording;
    
    command.on('end', () => {
      console.log('Recording stopped successfully:', meetingId);
      activeRecordings.delete(meetingId);
      resolve(recordingPath);
    });
    
    command.on('error', (err) => {
      console.error('Stop recording error:', err);
      activeRecordings.delete(meetingId);
      reject(err);
    });
    
    // Send SIGTERM to gracefully stop the recording
    command.kill('SIGTERM');
    
    // Fallback: if SIGTERM doesn't work after 5 seconds, use SIGKILL
    setTimeout(() => {
      if (activeRecordings.has(meetingId)) {
        console.warn('Force killing recording process for:', meetingId);
        command.kill('SIGKILL');
      }
    }, 5000);
  });
};

const getActiveRecordings = () => {
  return Array.from(activeRecordings.keys());
};

const isRecording = (meetingId) => {
  return activeRecordings.has(meetingId);
};

module.exports = {
  startRecording,
  stopRecording,
  getActiveRecordings,
  isRecording
};