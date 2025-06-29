import React, { useState } from 'react';
import { getSlotInfo } from '../../services/blockchain';
import { verifyBookingKey } from '../../services/api';
import useWallet from '../../hooks/useWallet';

import { isValidBookingKey, isETHAddress, sanitizeInput } from '../../utils/validators';

const VerifySlot = () => {
  const { account, isConnected } = useWallet();
  
  // State management
  const [inputValue, setInputValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [inputType, setInputType] = useState(''); // 'slotId', 'bookingKey', 'address'

  // Detect input type dynamically
  const detectInputType = (value) => {
    const trimmed = sanitizeInput(value);
    if (!trimmed) return '';
    
    if (/^\d+$/.test(trimmed)) {
      return 'slotId';
    } else if (isETHAddress(trimmed)) {
      return 'address';
    } else if (isValidBookingKey(trimmed)) {
      return 'bookingKey';
    } else if (trimmed.length > 10) {
      return 'bookingKey'; // Assume long strings are booking keys
    }
    return 'unknown';
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Format date and time for display
  const formatDateTime = (date, time) => {
    if (!date || !time) return 'Not specified';
    try {
      const dateTimeStr = `${date}T${time}:00`;
      const dateObj = new Date(dateTimeStr);
      return dateObj.toLocaleString();
    } catch (e) {
      return `${date} ${time}`;
    }
  };

  // Handle input change with type detection
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setInputType(detectInputType(value));
    setError('');
    setVerificationResult(null);
  };

  // Main verification logic
  const handleVerify = async () => {
    const trimmedInput = sanitizeInput(inputValue);
    
    if (!trimmedInput) {
      setError('Please enter a Slot ID or Booking Key');
      return;
    }

    const detectedType = detectInputType(trimmedInput);
    if (detectedType === 'unknown') {
      setError('Invalid format. Please enter a valid Slot ID (number) or Booking Key');
      return;
    }

    if (detectedType === 'address') {
      setError('Ethereum addresses are not supported for slot verification');
      return;
    }

    setIsVerifying(true);
    setError('');
    setVerificationResult(null);

    try {
      console.log(`🔍 Verifying ${detectedType}: ${trimmedInput}`);
      
      let slotData = null;
      let verificationMethod = '';

      // Try blockchain lookup first
      try {
        console.log('Trying blockchain lookup...');
        slotData = await getSlotInfo(trimmedInput);
        verificationMethod = 'blockchain';
        console.log('✅ Blockchain lookup successful:', slotData);
      } catch (blockchainError) {
        console.log('❌ Blockchain lookup failed:', blockchainError.message);
        
        // If blockchain fails and input looks like a booking key, try API
        if (detectedType === 'bookingKey') {
          try {
            console.log('Trying API verification...');
            const apiResult = await verifyBookingKey(trimmedInput);
            if (apiResult && apiResult.success) {
              // Convert API response to slot format
              slotData = {
                slotId: apiResult.slotId || 'N/A',
                date: apiResult.date || '',
                time: apiResult.time || '',
                price: apiResult.priceETH || '0',
                owner: apiResult.owner || '',
                bookedBy: apiResult.bookedBy || '',
                isBooked: true, // API only returns booked slots
                meetingId: apiResult.meetingId || '',
                joinUrl: apiResult.joinUrl || '',
                topic: apiResult.topic || ''
              };
              verificationMethod = 'api';
              console.log('✅ API verification successful:', slotData);
            }
          } catch (apiError) {
            console.log('❌ API verification also failed:', apiError.message);
          }
        }
      }

      if (!slotData) {
        setError('Slot not found. Please check your Slot ID or Booking Key and try again.');
        return;
      }

      // Check ownership if wallet is connected
      const isOwner = isConnected && account && 
                     (slotData.owner === account || slotData.bookedBy === account);

      // Prepare result data
      const result = {
        ...slotData,
        inputType: detectedType,
        inputValue: trimmedInput,
        verificationMethod,
        isOwner,
        connectedAccount: account
      };

      setVerificationResult(result);
      console.log('✅ Verification complete:', result);

    } catch (error) {
      console.error('❌ Verification error:', error);
      setError(error.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isVerifying) {
      handleVerify();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Slot</h2>
        <p className="text-gray-600">
          Enter a Slot ID (number) or Booking Key to verify slot details and ownership
        </p>
      </div>

      {/* Input Panel */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="mb-4">
          <label htmlFor="slotInput" className="block text-sm font-medium text-gray-700 mb-2">
            Slot ID or Booking Key
          </label>
          <input
            id="slotInput"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter Slot ID (e.g., 123) or Booking Key"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isVerifying}
          />
          {inputType && (
            <p className="text-xs text-gray-500 mt-1">
              Detected format: {inputType === 'slotId' ? 'Slot ID' : 'Booking Key'}
            </p>
          )}
        </div>

        <button
          onClick={handleVerify}
          disabled={isVerifying || !inputValue.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isVerifying ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </span>
          ) : (
            'Verify Slot'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Result Panel */}
      {verificationResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="ml-2 text-lg font-medium text-green-800">Slot Verified Successfully</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Slot ID:</span>
                <p className="text-sm text-gray-900">{verificationResult.slotId || 'N/A'}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">Price:</span>
                <p className="text-sm text-gray-900">{verificationResult.price} ETH</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  verificationResult.isBooked 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {verificationResult.isBooked ? 'Booked' : 'Available'}
                </span>
              </div>

              {verificationResult.date && verificationResult.time && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Scheduled Time:</span>
                  <p className="text-sm text-gray-900">
                    {formatDateTime(verificationResult.date, verificationResult.time)}
                  </p>
                </div>
              )}
            </div>

            {/* Ownership & Addresses */}
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Owner:</span>
                <p className="text-sm text-gray-900 font-mono">
                  {formatAddress(verificationResult.owner)}
                </p>
              </div>

              {verificationResult.bookedBy && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Booked By:</span>
                  <p className="text-sm text-gray-900 font-mono">
                    {formatAddress(verificationResult.bookedBy)}
                  </p>
                </div>
              )}

              {/* Ownership Confirmation */}
              {isConnected && verificationResult.isOwner && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm font-medium text-blue-800">
                    ✅ You own this slot
                  </p>
                  <p className="text-xs text-blue-600">
                    Connected: {formatAddress(account)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Meeting Details */}
          {(verificationResult.topic || verificationResult.meetingId || verificationResult.joinUrl) && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Meeting Details</h4>
              <div className="space-y-2">
                {verificationResult.topic && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Topic:</span>
                    <p className="text-sm text-gray-900">{verificationResult.topic}</p>
                  </div>
                )}
                
                {verificationResult.meetingId && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Meeting ID:</span>
                    <p className="text-sm text-gray-900 font-mono">{verificationResult.meetingId}</p>
                  </div>
                )}
                
                {verificationResult.joinUrl && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Join URL:</span>
                    <a 
                      href={verificationResult.joinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {verificationResult.joinUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verification Method */}
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Verified via: {verificationResult.verificationMethod === 'blockchain' ? 'Blockchain' : 'API'}</span>
              <span>Input type: {verificationResult.inputType === 'slotId' ? 'Slot ID' : 'Booking Key'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Connection Status */}
      {!isConnected && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            💡 Connect your wallet to verify slot ownership
          </p>
        </div>
      )}
    </div>
  );
};

export default VerifySlot;