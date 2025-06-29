const r = require('express').Router();
const ctl = require('../controllers/meetingController');
r.post('/start', ctl.startRecording);
r.post('/stop', ctl.stopRecording);
r.get('/', ctl.getMeetings);
r.get('/:id', ctl.getMeeting);
module.exports = r;
