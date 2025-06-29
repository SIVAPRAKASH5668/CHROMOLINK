import React, { useState, useEffect } from 'react';
import { Calendar, Clock, FileText } from 'lucide-react';
import { api } from '../services/api';

const Dashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [transcripts, setTranscripts] = useState([]);

  useEffect(() => {
    fetchMeetings();
    fetchTranscripts();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await api.getMeetings();
      setMeetings(response.data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const fetchTranscripts = async () => {
    try {
      const response = await api.getAllTranscripts();
      setTranscripts(response.data);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{meetings.length}</p>
              <p className="text-gray-600">Total Meetings</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{transcripts.length}</p>
              <p className="text-gray-600">Transcripts</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {meetings.reduce((acc, m) => acc + (m.duration || 0), 0)}m
              </p>
              <p className="text-gray-600">Total Duration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4">Recent Meetings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="pb-2">Title</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Duration</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((meeting) => (
                <tr key={meeting.id} className="border-b">
                  <td className="py-2">{meeting.title}</td>
                  <td className="py-2">{new Date(meeting.createdAt).toLocaleDateString()}</td>
                  <td className="py-2">{meeting.duration || 'N/A'}m</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      meeting.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {meeting.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;