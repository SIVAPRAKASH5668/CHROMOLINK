import React, { useState } from 'react';
import { Play, Square, Upload, Mic } from 'lucide-react';
import { api } from '../services/api';

const MeetingRecorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [zoomMeetingId, setZoomMeetingId] = useState('');
  const [status, setStatus] = useState('');

  const startRecording = async () => {
    try {
      setStatus('Starting recording...');
      const response = await api.startRecording({
        title: meetingTitle,
        zoomMeetingId: zoomMeetingId
      });
      
      setMeetingId(response.data.meetingId);
      setIsRecording(true);
      setStatus('Recording in progress...');
    } catch (error) {
      setStatus('Error starting recording: ' + error.message);
    }
  };

  const stopRecording = async () => {
    try {
      setStatus('Stopping recording...');
      await api.stopRecording(meetingId);
      setIsRecording(false);
      setStatus('Recording stopped. Processing...');
      onRecordingComplete && onRecordingComplete(meetingId);
    } catch (error) {
      setStatus('Error stopping recording: ' + error.message);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setStatus('Uploading recording...');
      const response = await api.uploadRecording(file, Date.now().toString());
      setStatus('Upload complete! Processing transcript...');
      onRecordingComplete && onRecordingComplete(response.data.meetingId);
    } catch (error) {
      setStatus('Upload error: ' + error.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <Mic className="mr-2" />
        Meeting Recorder
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Meeting Title</label>
          <input
            type="text"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter meeting title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Zoom Meeting ID</label>
          <input
            type="text"
            value={zoomMeetingId}
            onChange={(e) => setZoomMeetingId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter Zoom meeting ID"
          />
        </div>
        
        <div className="flex space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={!meetingTitle || !zoomMeetingId}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
            >
              <Play className="mr-2 w-4 h-4" />
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded"
            >
              <Square className="mr-2 w-4 h-4" />
              Stop Recording
            </button>
          )}
        </div>
        
        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-2">Or Upload Existing Recording</label>
          <div className="flex items-center">
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded cursor-pointer"
            >
              <Upload className="mr-2 w-4 h-4" />
              Upload Recording
            </label>
          </div>
        </div>
        
        {status && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingRecorder;