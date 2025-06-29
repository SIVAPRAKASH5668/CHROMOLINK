const { v4: uuidv4 } = require('uuid');
const recordingService = require('../services/recordingService');
const meetings = new Map();

const startRecording = async (req, res) => {
  try {
    const { title, zoomMeetingId } = req.body;
    const id = uuidv4();
    meetings.set(id, { id, title, zoomMeetingId, status: 'recording', createdAt: new Date().toISOString() });

    await recordingService.startRecording(id);
    res.json({ success: true, meetingId: id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const stopRecording = async (req, res) => {
  try {
    const { meetingId } = req.body;
    if (!meetings.has(meetingId)) return res.status(404).json({ success: false, error: 'Meeting not found.' });

    const recordingPath = await recordingService.stopRecording(meetingId);
    const m = meetings.get(meetingId);
    m.status = 'completed';
    m.recordingPath = recordingPath;
    m.endedAt = new Date().toISOString();
    meetings.set(meetingId, m);

    res.json({ success: true, recordingPath });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getMeetings = (_, res) => res.json(Array.from(meetings.values()));
const getMeeting = (req, res) => {
  const m = meetings.get(req.params.id);
  if (!m) return res.status(404).json({ success: false, error: 'Not found' });
  res.json(m);
};

module.exports = { startRecording, stopRecording, getMeetings, getMeeting };
