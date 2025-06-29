// services/zoomService.js
const axios = require("axios");
const qs = require("qs");

// Zoom API credentials from environment
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;

// Validate environment variables
if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
  throw new Error("Missing Zoom API credentials in environment variables");
}

// Cache for access tokens
let cachedToken = null;
let tokenExpiry = null;

/**
 * Get OAuth token for Zoom API using client credentials grant
 * @returns {string} Access token
 */
async function getZoomAccessToken() {
  // Return cached token if still valid
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const tokenUrl = "https://zoom.us/oauth/token";
  const auth = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");
  
  const params = qs.stringify({
    grant_type: "account_credentials",
    account_id: ZOOM_ACCOUNT_ID,
  });

  try {
    const response = await axios.post(`${tokenUrl}?${params}`, null, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 10000, // 10 second timeout
    });

    const { access_token, expires_in } = response.data;
    
    // Cache the token with a buffer (expire 5 minutes early)
    cachedToken = access_token;
    tokenExpiry = Date.now() + (expires_in - 300) * 1000;
    
    return access_token;

  } catch (error) {
    console.error("Zoom token error:", error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new Error("Invalid Zoom API credentials");
    } else if (error.code === 'ECONNABORTED') {
      throw new Error("Zoom API request timeout");
    } else if (error.response?.status >= 500) {
      throw new Error("Zoom API server error");
    }
    
    throw new Error("Failed to get Zoom access token");
  }
}

/**
 * Create Zoom meeting via API
 * @param {string} accessToken - Zoom access token
 * @param {string} topic - Meeting topic
 * @param {string} startTime - ISO 8601 start time
 * @param {number} duration - Duration in minutes
 * @returns {Object} Meeting data
 */
async function createZoomMeeting(accessToken, topic, startTime, duration) {
  const createUrl = "https://api.zoom.us/v2/users/me/meetings";
  
  // Validate inputs
  if (!topic || topic.length > 200) {
    throw new Error("Invalid topic: must be between 1-200 characters");
  }
  
  if (!startTime || isNaN(Date.parse(startTime))) {
    throw new Error("Invalid start time format");
  }
  
  if (!duration || duration < 1 || duration > 1440) {
    throw new Error("Invalid duration: must be between 1-1440 minutes");
  }

  const meetingData = {
    topic: topic.trim(),
    type: 2, // Scheduled meeting
    start_time: startTime,
    duration: parseInt(duration),
    timezone: "UTC",
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      mute_upon_entry: true,
      approval_type: 0, // Automatically approve
      registration_type: 1, // Attendees register once and can attend any of the occurrences
      audio: "both", // Both telephony and VoIP
      auto_recording: "none",
      waiting_room: false,
      allow_multiple_devices: true,
    },
  };

  try {
    const response = await axios.post(createUrl, meetingData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 15000, // 15 second timeout
    });

    const meetingInfo = response.data;
    
    // Validate response
    if (!meetingInfo.id || !meetingInfo.join_url) {
      throw new Error("Invalid meeting response from Zoom");
    }

    return {
      id: meetingInfo.id,
      topic: meetingInfo.topic,
      join_url: meetingInfo.join_url,
      start_url: meetingInfo.start_url,
      password: meetingInfo.password,
      start_time: meetingInfo.start_time,
      duration: meetingInfo.duration,
      timezone: meetingInfo.timezone,
      created_at: meetingInfo.created_at
    };

  } catch (error) {
    console.error("Zoom meeting creation error:", error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      // Token might be expired, clear cache
      cachedToken = null;
      tokenExpiry = null;
      throw new Error("Zoom authentication failed. Please try again.");
    } else if (error.response?.status === 400) {
      throw new Error("Invalid meeting parameters: " + (error.response.data?.message || "Bad request"));
    } else if (error.response?.status === 429) {
      throw new Error("Zoom API rate limit exceeded. Please try again later.");
    } else if (error.code === 'ECONNABORTED') {
      throw new Error("Zoom API request timeout");
    } else if (error.response?.status >= 500) {
      throw new Error("Zoom API server error");
    }
    
    throw new Error("Failed to create Zoom meeting");
  }
}

/**
 * Get meeting information
 * @param {string} accessToken - Zoom access token
 * @param {string} meetingId - Meeting ID
 * @returns {Object} Meeting information
 */
async function getMeetingInfo(accessToken, meetingId) {
  const meetingUrl = `https://api.zoom.us/v2/meetings/${meetingId}`;

  try {
    const response = await axios.get(meetingUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 10000,
    });

    return response.data;

  } catch (error) {
    console.error("Get meeting info error:", error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      throw new Error("Meeting not found");
    } else if (error.response?.status === 401) {
      throw new Error("Zoom authentication failed");
    }
    
    throw new Error("Failed to get meeting information");
  }
}

module.exports = { 
  getZoomAccessToken, 
  createZoomMeeting, 
  getMeetingInfo 
};