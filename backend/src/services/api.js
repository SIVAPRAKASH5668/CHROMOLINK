import axios from 'axios';

const API_BASE = '/api';

export const api = {
  // Meeting operations
  startRecording: (meetingData) => 
    axios.post(`${API_BASE}/meetings/start-recording`, meetingData),
  
  stopRecording: (meetingId) => 
    axios.post(`${API_BASE}/meetings/stop-recording`, { meetingId }),
  
  getMeetings: () => 
    axios.get(`${API_BASE}/meetings`),
  
  // Transcription operations
  uploadRecording: (file, meetingId) => {
    const formData = new FormData();
    formData.append('recording', file);
    formData.append('meetingId', meetingId);
    return axios.post(`${API_BASE}/transcriptions/upload`, formData);
  },
  
  getTranscript: (transcriptId) => 
    axios.get(`${API_BASE}/transcriptions/${transcriptId}`),
  
  getAllTranscripts: () => 
    axios.get(`${API_BASE}/transcriptions`),
  
  processTranscript: (transcriptId) => 
    axios.post(`${API_BASE}/transcriptions/${transcriptId}/process`)
};