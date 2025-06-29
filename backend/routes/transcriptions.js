const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const transcriptionController = require('../src/controllers/transcriptionController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.RECORDING_PATH || './recordings');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Routes
router.post('/upload', upload.single('recording'), transcriptionController.uploadRecording);
router.post('/groq-transcribe', upload.single('audio'), transcriptionController.transcribeWithGroq);
router.get('/:id', transcriptionController.getTranscript);
router.get('/', transcriptionController.getAllTranscripts);
router.post('/:id/process', transcriptionController.processTranscript);
router.post('/:id/update-analysis', transcriptionController.updateAnalysis);

module.exports = router;