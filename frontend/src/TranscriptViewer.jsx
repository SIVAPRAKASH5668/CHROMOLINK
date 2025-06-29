import React, { useState, useEffect } from 'react';
import { FileText, Download, Brain } from 'lucide-react';
import { api } from '../services/api';

const TranscriptViewer = ({ meetingId }) => {
  const [transcript, setTranscript] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (meetingId) {
      fetchTranscript();
    }
  }, [meetingId]);

  const fetchTranscript = async () => {
    setLoading(true);
    try {
      const response = await api.getTranscript(meetingId);
      setTranscript(response.data);
    } catch (error) {
      console.error('Error fetching transcript:', error);
    }
    setLoading(false);
  };

  const processWithNLP = async () => {
    setProcessing(true);
    try {
      const response = await api.processTranscript(meetingId);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error processing transcript:', error);
    }
    setProcessing(false);
  };

  const downloadTranscript = () => {
    if (!transcript) return;
    
    const blob = new Blob([transcript.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${meetingId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center p-8">Loading transcript...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <FileText className="mr-2" />
        Transcript Viewer
      </h2>
      
      {transcript ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{transcript.title}</h3>
            <div className="space-x-2">
              <button
                onClick={downloadTranscript}
                className="flex items-center px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                <Download className="mr-1 w-4 h-4" />
                Download
              </button>
              <button
                onClick={processWithNLP}
                disabled={processing}
                className="flex items-center px-3 py-1 bg-purple-500 text-white rounded text-sm disabled:bg-gray-300"
              >
                <Brain className="mr-1 w-4 h-4" />
                {processing ? 'Processing...' : 'Analyze'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Transcript</h4>
              <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{transcript.text}</pre>
              </div>
            </div>
            
            {summary && (
              <div>
                <h4 className="font-semibold mb-2">AI Summary & Analysis</h4>
                <div className="bg-purple-50 p-4 rounded max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium">Key Topics:</h5>
                      <ul className="list-disc list-inside text-sm">
                        {summary.topics?.map((topic, idx) => (
                          <li key={idx}>{topic}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium">Summary:</h5>
                      <p className="text-sm">{summary.summary}</p>
                    </div>
                    <div>
                      <h5 className="font-medium">Action Items:</h5>
                      <ul className="list-disc list-inside text-sm">
                        {summary.actionItems?.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          No transcript available. Start a recording or upload a file.
        </div>
      )}
    </div>
  );
};

export default TranscriptViewer;