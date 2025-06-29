import React, { useState } from 'react';
import useWallet from '../../hooks/useWallet';

import { verifyBookingKey } from '../../services/api';
import { getSlotInfo } from '../../services/blockchain';
import { isValidBookingKey, sanitizeInput } from '../../utils/validators';

const ViewBooking = () => {
  const { account, isConnected } = useWallet();
  
  // Form state
  const [bookingKey, setBookingKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Booking data state
  const [bookingData, setBookingData] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  // Reset form and state
  const resetForm = () => {
    setBookingKey('');
    setBookingData(null);
    setError(null);
    setIsOwner(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    const sanitizedKey = sanitizeInput(bookingKey);
    
    // Validate booking key format
    if (!sanitizedKey) {
      setError('Please enter a booking key');
      return;
    }

    if (!isValidBookingKey(sanitizedKey)) {
      setError('Invalid booking key format');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔍 Verifying booking key: ${sanitizedKey}`);
      
      // First try the API verification
      let data;
      try {
        data = await verifyBookingKey(sanitizedKey);
        console.log('✅ API verification successful:', data);
      } catch (apiError) {
        console.log('⚠️ API verification failed, trying blockchain fallback:', apiError.message);
        
        // Fallback to blockchain service
        try {
          const blockchainData = await getSlotInfo(sanitizedKey);
          if (blockchainData && blockchainData.isBooked) {
            data = {
              success: true,
              joinUrl: blockchainData.joinUrl,
              startTime: `${blockchainData.date}T${blockchainData.time}:00.000Z`,
              topic: blockchainData.topic || 'Meeting',
              meetingId: blockchainData.meetingId,
              date: blockchainData.date,
              time: blockchainData.time,
              slotInfo: blockchainData
            };
            console.log('✅ Blockchain fallback successful:', data);
          } else {
            throw new Error('Booking not found or not confirmed');
          }
        } catch (blockchainError) {
          throw new Error(`Booking verification failed: ${apiError.message}`);
        }
      }

      if (!data || !data.success) {
        throw new Error('Invalid booking key or booking not found');
      }

      // Set booking data
      setBookingData(data);

      // Check ownership if wallet is connected
      if (isConnected && account && data.slotInfo?.bookedBy) {
        const ownershipMatch = data.slotInfo.bookedBy.toLowerCase() === account.toLowerCase();
        setIsOwner(ownershipMatch);
        
        if (!ownershipMatch) {
          console.log('ℹ️ Connected account does not match booking owner');
        }
      }

    } catch (err) {
      console.error('❌ Booking verification error:', err);
      setError(err.message || 'Failed to verify booking key');
      setBookingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Format time for display
  const formatTime = (timeStr) => {
    try {
      if (timeStr.includes('T')) {
        return new Date(timeStr).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        });
      }
      return timeStr;
    } catch {
      return timeStr;
    }
  };

  // Check if meeting is upcoming
  const isMeetingUpcoming = () => {
    if (!bookingData?.startTime) return false;
    try {
      const meetingTime = new Date(bookingData.startTime);
      return meetingTime > new Date();
    } catch {
      return false;
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        color: '#333',
        marginBottom: '30px'
      }}>
        View Booking Details
      </h2>

      {/* Booking Key Input Form */}
      {!bookingData && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#555'
            }}>
              Booking Key:
            </label>
            <input
              type="text"
              value={bookingKey}
              onChange={(e) => setBookingKey(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && bookingKey.trim() && !isLoading) {
                  handleSubmit(e);
                }
              }}
              placeholder="Enter your booking key..."
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                backgroundColor: isLoading ? '#f5f5f5' : 'white'
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !bookingKey.trim()}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isLoading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            {isLoading ? 'Verifying...' : 'View Booking'}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#ffe6e6',
          border: '1px solid #ff9999',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          color: '#cc0000'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Booking Details Display */}
      {bookingData && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '2px solid #28a745',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '20px'
        }}>
          {/* Success Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '25px',
            padding: '15px',
            backgroundColor: '#d4edda',
            borderRadius: '8px',
            border: '1px solid #c3e6cb'
          }}>
            <h3 style={{ 
              margin: '0',
              color: '#155724',
              fontSize: '20px'
            }}>
              ✅ Booking Confirmed
            </h3>
            {isConnected && isOwner && (
              <p style={{ 
                margin: '5px 0 0 0', 
                color: '#155724',
                fontSize: '14px'
              }}>
                ✓ Verified as your booking
              </p>
            )}
          </div>

          {/* Meeting Details */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ 
              color: '#333', 
              marginBottom: '15px',
              borderBottom: '2px solid #007bff',
              paddingBottom: '8px'
            }}>
              Meeting Details
            </h4>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <strong>Topic:</strong> {bookingData.topic || 'Meeting'}
              </div>
              <div>
                <strong>Date:</strong> {formatDate(bookingData.date || bookingData.startTime)}
              </div>
              <div>
                <strong>Time:</strong> {formatTime(bookingData.time || bookingData.startTime)}
              </div>
              {bookingData.meetingId && (
                <div>
                  <strong>Meeting ID:</strong> {bookingData.meetingId}
                </div>
              )}
              <div>
                <strong>Status:</strong> 
                <span style={{ 
                  color: isMeetingUpcoming() ? '#28a745' : '#6c757d',
                  marginLeft: '8px',
                  fontWeight: 'bold'
                }}>
                  {isMeetingUpcoming() ? 'Upcoming' : 'Past'}
                </span>
              </div>
            </div>
          </div>

          {/* Zoom Meeting Access */}
          {bookingData.joinUrl && (
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ 
                color: '#333', 
                marginBottom: '15px',
                borderBottom: '2px solid #007bff',
                paddingBottom: '8px'
              }}>
                Meeting Access
              </h4>
              
              <div style={{
                backgroundColor: '#e7f3ff',
                border: '1px solid #b3d9ff',
                borderRadius: '8px',
                padding: '15px'
              }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                  Zoom Meeting Link:
                </p>
                <a
                  href={bookingData.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    transition: 'background-color 0.3s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                >
                  Join Meeting
                </a>
                {!isMeetingUpcoming() && (
                  <p style={{ 
                    margin: '10px 0 0 0', 
                    color: '#6c757d',
                    fontSize: '14px'
                  }}>
                    Note: This meeting has already occurred
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Booking Metadata */}
          {bookingData.slotInfo && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                color: '#333', 
                marginBottom: '15px',
                borderBottom: '2px solid #007bff',
                paddingBottom: '8px'
              }}>
                Booking Information
              </h4>
              
              <div style={{ 
                display: 'grid', 
                gap: '10px',
                fontSize: '14px',
                color: '#666'
              }}>
                {bookingData.slotInfo.slotId && (
                  <div>
                    <strong>Slot ID:</strong> {bookingData.slotInfo.slotId}
                  </div>
                )}
                {bookingData.slotInfo.price && (
                  <div>
                    <strong>Price Paid:</strong> {bookingData.slotInfo.price} ETH
                  </div>
                )}
                {bookingData.slotInfo.bookedBy && (
                  <div>
                    <strong>Booked By:</strong> 
                    <span style={{ 
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      marginLeft: '8px'
                    }}>
                      {bookingData.slotInfo.bookedBy}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            justifyContent: 'center',
            marginTop: '25px'
          }}>
            <button
              onClick={resetForm}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              View Another Booking
            </button>
            
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Refresh Data
            </button>
          </div>
        </div>
      )}

      {/* Wallet Connection Status */}
      {!isConnected && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '15px',
          marginTop: '20px',
          textAlign: 'center',
          color: '#856404'
        }}>
          <p style={{ margin: '0' }}>
            💡 Connect your wallet to verify booking ownership
          </p>
        </div>
      )}
    </div>
  );
};

export default ViewBooking;