import time
import subprocess
import pyautogui
import cv2
import numpy as np
from typing import Optional
import os
import sys
import shutil
import webbrowser
class ZoomAutomation:
    def __init__(self):
        self.zoom_process = None
        self.meeting_window = None
        
    def join_meeting(self, meeting_id: str, password: Optional[str] = None, use_web_if_no_client=True) -> bool:
        """Automatically join a Zoom meeting"""
        try:
            # Check if zoom client is installed (in PATH)
            zoom_path = shutil.which("zoom")
            
            if zoom_path:
                # Zoom client available — join with client
                zoom_command = [
                    zoom_path,
                    f"--url=zoommtg://zoom.us/join?confno={meeting_id}"
                ]
                if password:
                    zoom_command.append(f"&pwd={password}")
                
                self.zoom_process = subprocess.Popen(zoom_command)
                time.sleep(5)
                self._handle_join_dialog()
                return True
            
            elif use_web_if_no_client:
                # Zoom client not found — join via browser web client
                print("Zoom client not found, joining via web browser...")
                
                # Construct web meeting URL
                # Password can be appended in the URL as `pwd` parameter
                url = f"https://zoom.us/wc/join/{meeting_id}"
                if password:
                    url += f"?pwd={password}"
                
                # Open default browser to this URL
                webbrowser.open(url)
                return True
            
            else:
                print("Zoom client not found and web join disabled.")
                return False
                
        except Exception as e:
            print(f"Error joining meeting: {e}")
            return False
    
    def _handle_join_dialog(self):
        """Handle the join meeting dialog"""
        # Wait for join dialog to appear
        time.sleep(3)
        
        # Look for "Join with Computer Audio" button
        try:
            join_audio_button = pyautogui.locateOnScreen('join_audio_button.png')
            if join_audio_button:
                pyautogui.click(join_audio_button)
        except pyautogui.ImageNotFoundException:
            # Fallback: press Alt+A to join with audio
            pyautogui.hotkey('alt', 'a')
        
        time.sleep(2)
    
    def start_local_recording(self, output_path: str) -> bool:
        """Start local recording using Zoom's built-in recording"""
        try:
            # Use Zoom's recording hotkey (Alt+R)
            pyautogui.hotkey('alt', 'r')
            time.sleep(1)
            
            # Confirm recording if dialog appears
            try:
                confirm_button = pyautogui.locateOnScreen('confirm_recording.png')
                if confirm_button:
                    pyautogui.click(confirm_button)
            except pyautogui.ImageNotFoundException:
                pass
            
            return True
            
        except Exception as e:
            print(f"Error starting recording: {e}")
            return False
    
    def stop_recording(self) -> bool:
        """Stop local recording"""
        try:
            # Use Zoom's stop recording hotkey (Alt+R again)
            pyautogui.hotkey('alt', 'r')
            time.sleep(1)
            return True
        except Exception as e:
            print(f"Error stopping recording: {e}")
            return False
    
    def leave_meeting(self):
        """Leave the Zoom meeting"""
        try:
            # Use Zoom's leave meeting hotkey (Alt+Q)
            pyautogui.hotkey('alt', 'q')
            time.sleep(1)
            
            # Confirm leaving
            try:
                leave_button = pyautogui.locateOnScreen('leave_meeting.png')
                if leave_button:
                    pyautogui.click(leave_button)
            except pyautogui.ImageNotFoundException:
                # Press Enter to confirm
                pyautogui.press('enter')
                
        except Exception as e:
            print(f"Error leaving meeting: {e}")
        
        # Clean up process
        if self.zoom_process:
            self.zoom_process.terminate()

def main():
    if len(sys.argv) < 2:
        print("Usage: python zoom_automation.py <meeting_id> [password]")
        sys.exit(1)
    
    meeting_id = sys.argv[1]
    password = sys.argv[2] if len(sys.argv) > 2 else None
    
    automation = ZoomAutomation()
    
    print(f"Joining meeting: {meeting_id}")
    if automation.join_meeting(meeting_id, password):
        print("Successfully joined meeting")
        
        # Keep the script running
        try:
            while True:
                time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            print("Leaving meeting...")
            automation.leave_meeting()
    else:
        print("Failed to join meeting")

if __name__ == "__main__":
    main()