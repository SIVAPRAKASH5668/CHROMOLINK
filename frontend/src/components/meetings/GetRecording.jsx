// src/components/meetings/GetRecording.jsx
import React, { useState } from 'react';
import { sanitizeInput } from '../../utils/validators.js';

/**
 * Validates Zoom Meeting ID format
 * @param {string} meetingId - Meeting ID to validate
 * @returns {boolean} True if valid format, false otherwise
 */
const isValidMeetingId = (meetingId) => {
  if (!meetingId || typeof meetingId !== 'string') {
    return false;
  }

  // Meeting ID should be 9-11 digits, may contain spaces or hyphens
  // Remove spaces and hyphens for validation
  const cleanId = meetingId.replace(/[\s-]/g, '');
  
  // Must be numeric and between 9-11 digits
  const meetingIdRegex = /^\d{9,11}$/;
  return meetingIdRegex.test(cleanId);
};

/**
 * Fetches Zoom recording data from backend API
 * @param {string} meetingId - Zoom Meeting ID
 * @returns {Promise} Recording data with downloadUrl, topic, duration, startTime
 */
const getZoomRecording = async (meetingId) => {
  try {
    const response = await fetch(`/api/zoom/recording/${meetingId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Recording not found or not yet available');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Zoom recording:', error);
    throw error;
  }
};

/**
 * Formats date string to readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date and time
 */
const formatDateTime = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return dateString;
  }
};

/**
 * Formats duration from seconds to readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "1h 30m" or "45m")
 */
const formatDuration = (seconds) => {
  if (!seconds || seconds < 60) {
    return `${seconds || 0}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  
  return `${minutes}m`;
};

const GetRecording = () => {
  const [meetingId, setMeetingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [recordingData, setRecordingData] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous state
    setError('');
    setRecordingData(null);
    
    // Sanitize and validate input
    const sanitizedId = sanitizeInput(meetingId);
    
    if (!sanitizedId) {
      setError('Please enter a Meeting ID');
      return;
    }
    
    if (!isValidMeetingId(sanitizedId)) {
      setError('Meeting ID must be 9-11 digits (spaces and hyphens are allowed)');
      return;
    }
    
    setLoading(true);
    
    try {
      const data = await getZoomRecording(sanitizedId.replace(/[\s-]/g, ''));
      setRecordingData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch recording. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMeetingId('');
    setRecordingData(null);
    setError('');
  };

  const handleDownload = () => {
    if (recordingData?.downloadUrl) {
      window.open(recordingData.downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Get Meeting Recording</h2>
        <p style={styles.subtitle}>Enter a Zoom Meeting ID to fetch its recording</p>
      </div>

      {!recordingData ? (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="meetingId" style={styles.label}>
              Meeting ID
            </label>
            <input
              id="meetingId"
              type="text"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              placeholder="e.g., 123-456-7890 or 1234567890"
              style={styles.input}
              disabled={loading}
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !meetingId.trim()}
            style={{
              ...styles.submitButton,
              ...(loading || !meetingId.trim() ? styles.submitButtonDisabled : {})
            }}
          >
            {loading ? (
              <>
                <span style={styles.spinner}>⟳</span>
                Fetching Recording...
              </>
            ) : (
              'Get Recording'
            )}
          </button>
        </form>
      ) : (
        <div style={styles.successCard}>
          <div style={styles.successHeader}>
            <span style={styles.successIcon}>✅</span>
            <h3 style={styles.successTitle}>Recording Found!</h3>
          </div>

          <div style={styles.recordingInfo}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Topic:</span>
              <span style={styles.infoValue}>{recordingData.topic || 'Untitled Meeting'}</span>
            </div>

            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Start Time:</span>
              <span style={styles.infoValue}>
                {formatDateTime(recordingData.startTime)}
              </span>
            </div>

            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Duration:</span>
              <span style={styles.infoValue}>
                {formatDuration(recordingData.duration)}
              </span>
            </div>
          </div>

          <div style={styles.actionButtons}>
            <button
              onClick={handleDownload}
              style={styles.downloadButton}
            >
              <span style={styles.downloadIcon}>⬇️</span>
              Download Recording
            </button>

            <button
              onClick={handleReset}
              style={styles.resetButton}
            >
              Get Another Recording
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const styles = {
  container: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },

  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },

  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 8px 0'
  },

  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '0'
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },

  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },

  input: {
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border-color 0.2s ease',
    outline: 'none'
  },

  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },

  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  },

  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
    fontSize: '18px'
  },

  errorBox: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  },

  errorIcon: {
    fontSize: '16px'
  },

  successCard: {
    border: '2px solid #d1fae5',
    borderRadius: '12px',
    padding: '24px',
    backgroundColor: '#f0fdf4'
  },

  successHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px'
  },

  successIcon: {
    fontSize: '24px'
  },

  successTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#065f46',
    margin: '0'
  },

  recordingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px'
  },

  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px'
  },

  infoLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    minWidth: '80px'
  },

  infoValue: {
    fontSize: '14px',
    color: '#1f2937',
    textAlign: 'right',
    flex: '1'
  },

  actionButtons: {
    display: 'flex',
    gap: '12px',
    flexDirection: 'column'
  },

  downloadButton: {
    padding: '12px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },

  downloadIcon: {
    fontSize: '18px'
  },

  resetButton: {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default GetRecording;