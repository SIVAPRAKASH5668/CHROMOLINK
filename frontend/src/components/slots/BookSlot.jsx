import React, { useState, useEffect } from 'react';
import useWallet from '../../hooks/useWallet';

import WalletConnection from '../shared/WalletConnection';
import { getSlotInfo as getSlotInfoAPI, bookSlot as bookSlotAPI } from '../../services/api';
import { getSlotInfo as getSlotInfoBlockchain, bookSlotOnBlockchain } from '../../services/blockchain';
import { isValidETHAmount, isETHAddress } from '../../utils/validators';

const BookSlot = ({ slotId: propSlotId }) => {
  const { account, isConnected, isMetaMaskInstalled } = useWallet();
  
  // State management
  const [slotId, setSlotId] = useState(propSlotId || '');
  const [slotInfo, setSlotInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookingResult, setBookingResult] = useState(null);
  const [isBooking, setIsBooking] = useState(false);

  // Get slot ID from URL if not provided via props
  useEffect(() => {
    if (!propSlotId) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSlotId = urlParams.get('slotId');
      if (urlSlotId) {
        setSlotId(urlSlotId);
      }
    }
  }, [propSlotId]);

  // Load slot info when slotId changes
  useEffect(() => {
    if (slotId && slotId.trim()) {
      loadSlotInfo();
    }
  }, [slotId]);

  const loadSlotInfo = async () => {
    if (!slotId || !slotId.trim()) {
      setError('Please enter a valid slot ID');
      return;
    }

    setLoading(true);
    setError('');
    setSlotInfo(null);

    try {
      console.log('🔍 Loading slot info for ID:', slotId);
      
      // Try API first, then blockchain as fallback
      let slot = null;
      try {
        const apiResponse = await getSlotInfoAPI(slotId);
        if (apiResponse && apiResponse.success && apiResponse.slot) {
          slot = apiResponse.slot;
          console.log('✅ Slot info from API:', slot);
        }
      } catch (apiError) {
        console.warn('API call failed, trying blockchain:', apiError.message);
        // Try blockchain directly
        slot = await getSlotInfoBlockchain(slotId);
        console.log('✅ Slot info from blockchain:', slot);
      }

      if (!slot) {
        setError(`Slot ${slotId} not found`);
        return;
      }

      setSlotInfo(slot);
      setError('');
    } catch (err) {
      console.error('❌ Error loading slot info:', err);
      setError(`Failed to load slot information: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async () => {
    if (!slotInfo || !account) {
      setError('Slot information or wallet not available');
      return;
    }

    if (slotInfo.isBooked) {
      setError('This slot is already booked');
      return;
    }

    if (!isValidETHAmount(slotInfo.price)) {
      setError('Invalid slot price');
      return;
    }

    if (!isETHAddress(account)) {
      setError('Invalid wallet address');
      return;
    }

    setIsBooking(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔄 Starting booking process...');
      
      // Step 1: Book on blockchain first
      console.log('📦 Booking on blockchain...');
      const blockchainResult = await bookSlotOnBlockchain({
        slotId: parseInt(slotId),
        buyerAddress: account,
        priceETH: slotInfo.price
      });

      console.log('✅ Blockchain booking successful:', blockchainResult);

      // Step 2: Update backend
      console.log('🔄 Updating backend...');
      try {
        const backendResult = await bookSlotAPI(slotId, account, slotInfo.price);
        console.log('✅ Backend update successful:', backendResult);
      } catch (backendError) {
        console.warn('⚠️ Backend update failed:', backendError.message);
        // Continue anyway since blockchain transaction succeeded
      }

      // Success - show results
      setBookingResult({
        txHash: blockchainResult.txHash,
        bookingKey: blockchainResult.bookingKey,
        slotId: blockchainResult.slotId,
        priceETH: slotInfo.price,
        joinUrl: slotInfo.joinUrl,
        meetingId: slotInfo.meetingId
      });

      setSuccess('Slot booked successfully! Transaction confirmed on blockchain.');
      
      // Reload slot info to show updated status
      setTimeout(() => {
        loadSlotInfo();
      }, 2000);

    } catch (err) {
      console.error('❌ Booking failed:', err);
      setError(`Booking failed: ${err.message}`);
    } finally {
      setIsBooking(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not specified';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'Not specified';
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
        Book Time Slot
      </h1>

      {/* Slot ID Input */}
      {!propSlotId && (
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Slot ID:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
              placeholder="Enter slot ID to book"
              style={{
                flex: 1,
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <button
              onClick={loadSlotInfo}
              disabled={loading || !slotId.trim()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading || !slotId.trim() ? 0.6 : 1
              }}
            >
              {loading ? 'Loading...' : 'Load Slot'}
            </button>
          </div>
        </div>
      )}

      {/* Wallet Connection */}
      {!isMetaMaskInstalled && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, color: '#856404' }}>
            MetaMask is required to book slots. Please install MetaMask to continue.
          </p>
        </div>
      )}

      {isMetaMaskInstalled && !isConnected && (
        <div style={{ marginBottom: '30px' }}>
          <WalletConnection
            onConnected={(account) => {
              console.log('Wallet connected:', account);
            }}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, color: '#721c24' }}>{error}</p>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, color: '#155724' }}>{success}</p>
        </div>
      )}

      {/* Slot Information */}
      {slotInfo && (
        <div style={{
          backgroundColor: '#fff',
          border: '2px solid #ddd',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
            Slot Information
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div>
              <strong>Slot ID:</strong> {slotId}
            </div>
            <div>
              <strong>Date:</strong> {formatDate(slotInfo.date)}
            </div>
            <div>
              <strong>Time:</strong> {formatTime(slotInfo.time)}
            </div>
            <div>
              <strong>Price:</strong> {slotInfo.price} ETH
            </div>
            <div>
              <strong>Owner:</strong> {slotInfo.owner ? `${slotInfo.owner.substring(0, 6)}...${slotInfo.owner.substring(38)}` : 'Not specified'}
            </div>
            <div style={{ color: slotInfo.isBooked ? '#dc3545' : '#28a745' }}>
              <strong>Status:</strong> {slotInfo.isBooked ? 'Booked' : 'Available'}
            </div>
          </div>

          {slotInfo.isBooked && slotInfo.bookedBy && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <strong>Booked by:</strong> {slotInfo.bookedBy.substring(0, 6)}...{slotInfo.bookedBy.substring(38)}
            </div>
          )}

          {slotInfo.meetingId && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '6px' }}>
              <strong>Meeting ID:</strong> {slotInfo.meetingId}
            </div>
          )}
        </div>
      )}

      {/* Booking Section */}
      {slotInfo && isConnected && (
        <div style={{
          backgroundColor: '#fff',
          border: '2px solid #007bff',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#007bff' }}>
            Book This Slot
          </h3>

          {slotInfo.isBooked ? (
            <div style={{
              backgroundColor: '#f8d7da',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: '#721c24', fontWeight: 'bold' }}>
                This slot is already booked and cannot be purchased.
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <p><strong>Your Wallet:</strong> {account.substring(0, 6)}...{account.substring(38)}</p>
                <p><strong>Slot Price:</strong> {slotInfo.price} ETH</p>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  By clicking "Book Slot", you agree to pay {slotInfo.price} ETH to book this time slot. 
                  The transaction will be processed on the blockchain.
                </p>
              </div>

              <button
                onClick={handleBookSlot}
                disabled={isBooking}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: isBooking ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: isBooking ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.3s'
                }}
              >
                {isBooking ? 'Booking in Progress...' : `Book Slot for ${slotInfo.price} ETH`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Booking Result */}
      {bookingResult && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '2px solid #28a745',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#28a745' }}>
            🎉 Booking Successful!
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Transaction Hash:</strong>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '8px', 
              borderRadius: '4px', 
              fontSize: '14px',
              wordBreak: 'break-all',
              marginTop: '5px'
            }}>
              {bookingResult.txHash}
            </div>
          </div>

          {bookingResult.bookingKey && (
            <div style={{ marginBottom: '15px' }}>
              <strong>Booking Key:</strong>
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '8px', 
                borderRadius: '4px', 
                fontSize: '14px',
                wordBreak: 'break-all',
                marginTop: '5px'
              }}>
                {bookingResult.bookingKey}
              </div>
              <small style={{ color: '#666' }}>
                Save this booking key to access your meeting details.
              </small>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div><strong>Slot ID:</strong> {bookingResult.slotId}</div>
            <div><strong>Amount Paid:</strong> {bookingResult.priceETH} ETH</div>
          </div>

          {bookingResult.joinUrl && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
              <strong>Meeting Join URL:</strong>
              <div style={{ marginTop: '8px' }}>
                <a 
                  href={bookingResult.joinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#007bff', textDecoration: 'none' }}
                >
                  {bookingResult.joinUrl}
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        fontSize: '14px',
        color: '#666'
      }}>
        <h4 style={{ marginTop: 0, color: '#333' }}>How to Book a Slot:</h4>
        <ol style={{ paddingLeft: '20px' }}>
          <li>Connect your MetaMask wallet</li>
          <li>Enter or select a slot ID to view details</li>
          <li>Review the slot information and price</li>
          <li>Click "Book Slot" to initiate the blockchain transaction</li>
          <li>Confirm the transaction in MetaMask</li>
          <li>Wait for confirmation and save your booking key</li>
        </ol>
        <p style={{ margin: '10px 0 0 0' }}>
          <strong>Note:</strong> Booking requires payment in ETH and cannot be reversed once confirmed on the blockchain.
        </p>
      </div>
    </div>
  );
};

export default BookSlot;