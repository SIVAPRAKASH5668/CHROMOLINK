import subprocess
import json
import time
import os
import sys
import requests
from pathlib import Path

class WorkflowOrchestrator:
    def __init__(self, backend_url="http://localhost:5000"):
        self.backend_url = backend_url
        self.python_nlp_path = Path(__file__).parent.parent / "python-nlp"

    def execute_full_workflow(self, meeting_id: str, zoom_meeting_id: str,
                              meeting_title: str, password: str = None):
        """Execute the complete transcription workflow"""
        print(f"Starting workflow for meeting: {meeting_title}")
        
        try:
            # Step 1: Join Zoom meeting and start recording
            print("Step 1: Joining Zoom meeting...")
            self._join_zoom_meeting(zoom_meeting_id, password)
            
            # Step 2: Start backend recording
            print("Step 2: Starting backend recording...")
            self._start_backend_recording(meeting_id, meeting_title, zoom_meeting_id)
            
            # Step 3: Wait for meeting to complete (manual intervention or time-based)
            print("Step 3: Recording in progress...")
            print("Press Enter when meeting is complete...")
            input()
            
            # Step 4: Stop recording
            print("Step 4: Stopping recording...")
            recording_path = self._stop_backend_recording(meeting_id)
            
            # Step 5: Extract audio from video
            print("Step 5: Extracting audio...")
            audio_path = self._extract_audio(recording_path)
            
            # Step 6: Transcribe with Groq
            print("Step 6: Transcribing audio...")
            transcript = self._transcribe_audio(audio_path)
            
            # Step 7: Save transcript
            print("Step 7: Saving transcript...")
            transcript_path = self._save_transcript(meeting_id, transcript)
            
            # Step 8: Process with NLP
            print("Step 8: Processing with NLP...")
            analysis = self._process_with_nlp(transcript_path)
            
            # Step 9: Update backend with results
            print("Step 9: Updating backend...")
            self._update_backend_results(meeting_id, analysis)
            
            print("✅ Workflow completed successfully!")
            return True

        except Exception as e:
            print(f"❌ Workflow error: {e}")
            return False

    def _join_zoom_meeting(self, zoom_meeting_id: str, password: str = None):
        """Join Zoom meeting using automation script"""
        cmd = ["python", "zoom_automation.py", zoom_meeting_id]
        if password:
            cmd.append(password)
        
        # Run in background
        subprocess.Popen(cmd, cwd=Path(__file__).parent)
        time.sleep(10)  # Wait for Zoom to load

    def _start_backend_recording(self, meeting_id: str, title: str, zoom_id: str):
        """Start recording via backend API"""
        response = requests.post(
            f"{self.backend_url}/api/meetings/start-recording",
            json={"title": title, "zoomMeetingId": zoom_id}
        )

        if not response.ok:
            raise Exception("Failed to start backend recording")
        
        return response.json()

    def _stop_backend_recording(self, meeting_id: str):
        """Stop recording via backend API"""
        response = requests.post(
            f"{self.backend_url}/api/meetings/stop-recording",
            json={"meetingId": meeting_id}
        )

        if not response.ok:
            raise Exception("Failed to stop backend recording")
        
        return response.json().get("recordingPath")

    def _extract_audio(self, video_path: str):
        """Extract audio from video file"""
        audio_path = video_path.replace('.mp4', '.mp3')
        
        cmd = [
            "ffmpeg", "-i", video_path, 
            "-vn", "-acodec", "libmp3lame", 
            "-ab", "192k", "-ar", "44100", 
            audio_path, "-y"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"Audio extraction failed: {result.stderr}")
        
        return audio_path

    def _transcribe_audio(self, audio_path: str):
        """Transcribe audio using Groq API"""
        with open(audio_path, 'rb') as audio_file:
            response = requests.post(
                f"{self.backend_url}/api/transcriptions/groq-transcribe",
                files={'audio': audio_file}
            )

        if not response.ok:
            raise Exception("Transcription failed")
        
        return response.json().get("transcript")

    def _save_transcript(self, meeting_id: str, transcript: str):
        """Save transcript to file"""
        transcript_dir = Path(__file__).parent.parent / "backend" / "transcripts"
        transcript_dir.mkdir(parents=True, exist_ok=True)

        transcript_path = transcript_dir / f"{meeting_id}.txt"

        with open(transcript_path, 'w', encoding='utf-8') as f:
            f.write(transcript)
        
        return str(transcript_path)

    def _process_with_nlp(self, transcript_path: str):
        """Process transcript with Python NLP agent"""
        cmd = ["python", "eliza_agent.py", transcript_path]

        result = subprocess.run(
            cmd, cwd=self.python_nlp_path, capture_output=True, text=True
        )

        if result.returncode != 0:
            raise Exception(f"NLP processing failed: {result.stderr}")

        return json.loads(result.stdout)

    def _update_backend_results(self, meeting_id: str, analysis: dict):
        """Update backend with NLP analysis results"""
        response = requests.post(
            f"{self.backend_url}/api/transcriptions/{meeting_id}/update-analysis",
            json=analysis
        )

        if not response.ok:
            raise Exception("Failed to update backend results")

# ----------- ENTRY POINT -----------
def main():
    if len(sys.argv) < 4:
        print("Usage: python workflow_orchestrator.py <meeting_id> <zoom_meeting_id> <meeting_title> [password]")
        sys.exit(1)

    meeting_id = sys.argv[1]
    zoom_meeting_id = sys.argv[2]
    meeting_title = sys.argv[3]
    password = sys.argv[4] if len(sys.argv) > 4 else None

    orchestrator = WorkflowOrchestrator()
    success = orchestrator.execute_full_workflow(meeting_id, zoom_meeting_id, meeting_title, password)

    if success:
        print("✅ Workflow completed successfully!")
    else:
        print("❌ Workflow failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
