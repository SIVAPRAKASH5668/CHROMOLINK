// src/components/meetings/CreateMeeting.jsx
// Component for scheduling Zoom meetings before minting slots

import React, { useState } from 'react';
import { isValidDate, isValidTime, isValidDuration, sanitizeInput } from '../../utils/validators.js';

// Duration options for dropdown (in minutes)
const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
  { value: 360, label: '6 hours' },
  { value: 480, label: '8 hours' }
];

// Create meeting API function (since it's not in the provided api.js)
const createMeeting = async (data) => {
  try {
    const response = await fetch('/api/zoom/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
};

const CreateMeeting = ({ onMeetingCreated }) => {
  // Form state
  const [formData, setFormData] = useState({
    topic: '',
    date: '',
    time: '',
    duration: 60
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [meetingResult, setMeetingResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Sanitize input for text fields
    const sanitizedValue = name === 'topic' ? sanitizeInput(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(sanitizedValue, 10) : sanitizedValue
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Validate topic
    if (!formData.topic || formData.topic.trim().length === 0) {
      newErrors.topic = 'Topic is required';
    } else if (formData.topic.length > 200) {
      newErrors.topic = 'Topic must be less than 200 characters';
    }

    // Validate date
    if (!isValidDate(formData.date)) {
      newErrors.date = 'Date must be in YYYY-MM-DD format and not in the past';
    }

    // Validate time
    if (!isValidTime(formData.time)) {
      newErrors.time = 'Time must be in HH:MM format (24-hour)';
    }

    // Validate date + time combination (must be in future)
    if (isValidDate(formData.date) && isValidTime(formData.time)) {
      const dateTime = new Date(`${formData.date}T${formData.time}:00`);
      if (dateTime <= new Date()) {
        newErrors.datetime = 'Meeting time must be in the future';
      }
    }

    // Validate duration
    if (!isValidDuration(formData.duration)) {
      newErrors.duration = 'Duration must be between 1-1440 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const result = await createMeeting(formData);
      
      setMeetingResult(result);
      
      // Notify parent component if callback provided
      if (onMeetingCreated) {
        onMeetingCreated(result);
      }
      
      console.log('✅ Meeting created successfully:', result);
    } catch (error) {
      console.error('❌ Failed to create meeting:', error);
      setApiError(error.message || 'Failed to create meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form to create another meeting
  const handleCreateAnother = () => {
    setFormData({
      topic: '',
      date: '',
      time: '',
      duration: 60
    });
    setErrors({});
    setMeetingResult(null);
    setApiError(null);
  };

  // Get today's date in YYYY-MM-DD format for min date
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // If meeting was created successfully, show result
  if (meetingResult) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#0c4a6e', marginTop: 0 }}>Meeting Created Successfully! 🎉</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Topic:</strong> {formData.topic}
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Meeting ID:</strong> 
            <code style={{ 
              backgroundColor: '#e0f2fe', 
              padding: '2px 6px', 
              borderRadius: '4px',
              marginLeft: '8px'
            }}>
              {meetingResult.meetingId}
            </code>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Join URL:</strong>
            <br />
            <a 
              href={meetingResult.joinUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#0ea5e9', 
                textDecoration: 'none',
                wordBreak: 'break-all'
              }}
            >
              {meetingResult.joinUrl}
            </a>
          </div>
          
          {meetingResult.startUrl && (
            <div style={{ marginBottom: '15px' }}>
              <strong>Start URL (Host):</strong>
              <br />
              <a 
                href={meetingResult.startUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#0ea5e9', 
                  textDecoration: 'none',
                  wordBreak: 'break-all'
                }}
              >
                {meetingResult.startUrl}
              </a>
            </div>
          )}
          
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={handleCreateAnother}
              style={{
                backgroundColor: '#0ea5e9',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Create Another Meeting
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Schedule Zoom Meeting</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Topic Input */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Meeting Topic *
          </label>
          <input
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleInputChange}
            placeholder="Enter meeting topic"
            maxLength={200}
            style={{
              width: '100%',
              padding: '10px',
              border: errors.topic ? '2px solid #ef4444' : '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          {errors.topic && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {errors.topic}
            </div>
          )}
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {formData.topic.length}/200 characters
          </div>
        </div>

        {/* Date Input */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Meeting Date *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            min={getTodayDate()}
            style={{
              width: '100%',
              padding: '10px',
              border: errors.date ? '2px solid #ef4444' : '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          {errors.date && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {errors.date}
            </div>
          )}
        </div>

        {/* Time Input */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Meeting Time *
          </label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '10px',
              border: errors.time ? '2px solid #ef4444' : '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          {errors.time && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {errors.time}
            </div>
          )}
        </div>

        {/* Duration Dropdown */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Duration *
          </label>
          <select
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '10px',
              border: errors.duration ? '2px solid #ef4444' : '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
              backgroundColor: 'white'
            }}
          >
            {DURATION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.duration && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {errors.duration}
            </div>
          )}
        </div>

        {/* Date/Time validation error */}
        {errors.datetime && (
          <div style={{ 
            color: '#ef4444', 
            fontSize: '14px', 
            padding: '10px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px'
          }}>
            {errors.datetime}
          </div>
        )}

        {/* API Error */}
        {apiError && (
          <div style={{ 
            color: '#ef4444', 
            fontSize: '14px', 
            padding: '10px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px'
          }}>
            {apiError}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: loading ? '#9ca3af' : '#0ea5e9',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '10px'
          }}
        >
          {loading ? 'Creating Meeting...' : 'Create Meeting'}
        </button>
      </form>
    </div>
  );
};

export default CreateMeeting;