const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;

// Store active recordings
const activeRecordings = new Map();

const startRecording = async (meetingId, zoomMeetingId) => {
  const recordingPath = path.join(process.env.RECORDING_PATH, `${meetingId}.mp4`);
  
  // Ensure recordings directory exists
  await fs.mkdir(process.env.RECORDING_PATH, { recursive: true });
  
  return new Promise((resolve, reject) => {
    // For demo purposes, we'll simulate screen recording
    // In production, you'd integrate with Zoom SDK or screen capture
    const command = ffmpeg()
      .input(':0.0') // Screen capture on Linux/Mac
      .inputOptions(['-f x11grab', '-r 30'])
      .output(recordingPath)
      .on('start', (commandLine) => {
        console.log('Recording started:', commandLine);
        activeRecordings.set(meetingId, command);
        resolve();
      })
      .on('error', (err) => {
        console.error('Recording error:', err);
        reject(err);
      });
    
    command.run();
  });
};

const stopRecording = async (meetingId) => {
  const command = activeRecordings.get(meetingId);
  
  if (!command) {
    throw new Error('No active recording found for this meeting');
  }
  
  return new Promise((resolve, reject) => {
    command.on('end', () => {
      activeRecordings.delete(meetingId);
      const recordingPath = path.join(process.env.RECORDING_PATH, `${meetingId}.mp4`);
      resolve(recordingPath);
    });
    
    command.on('error', (err) => {
      reject(err);
    });
    
    command.kill('SIGTERM');
  });
};

module.exports = {
  startRecording,
  stopRecording
};