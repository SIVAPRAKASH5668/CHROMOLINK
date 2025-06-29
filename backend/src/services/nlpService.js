const { spawn } = require('child_process');
const path = require('path');

const processTranscript = async (transcriptText) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../../../python-nlp/eliza_agent.py');
    
    // Create a temporary file for the transcript
    const tempFile = path.join(__dirname, '../../../python-nlp/temp_transcript.txt');
    const fs = require('fs');
    fs.writeFileSync(tempFile, transcriptText);
    
    const pythonProcess = spawn('python', [pythonScript, tempFile]);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        console.warn('Could not delete temp file:', e.message);
      }
      
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (parseError) {
          reject(new Error('Failed to parse NLP results: ' + parseError.message));
        }
      } else {
        reject(new Error('NLP processing failed: ' + errorOutput));
      }
    });
  });
};

module.exports = {
  processTranscript
};