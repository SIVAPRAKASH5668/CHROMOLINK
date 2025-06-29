const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const transcriptionController = require('./src/controllers/transcriptionController');
const transcriptionRoutes = require('./routes/transcriptions');



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use('/recordings', express.static(path.join(__dirname, '../recordings')));
app.use('/transcripts', express.static(path.join(__dirname, '../transcripts')));

// Routes
//app.use('/api/meetings', meetingRoutes);
app.use('/api/transcriptions', transcriptionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});