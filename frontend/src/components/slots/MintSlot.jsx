// src/components/slots/MintSlot.jsx
// React component for minting time slots as NFTs with Zoom integration

import React, { useState, useEffect, useContext } from 'react';
import WalletContext from '../../context/WalletContext';
import WalletConnection from '../shared/WalletConnection';
import { postMintSlot } from '../../services/api';
import { mintSlotOnBlockchain } from '../../services/blockchain';
import { 
  validateMintSlotData, 
  sanitizeInput, 
  formatETHAmount,
  getFieldError
} from '../../utils/validators';

const MintSlot = () => {
  const { account, isConnected } = useContext(WalletContext);

  // Form state
  const [formData, setFormData] = useState({
    topic: '',
    date: '',
    time: '',
    duration: 60,
    priceETH: '0.01'
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [step, setStep] = useState('form'); // 'form', 'success', 'error'

  // Reset form when wallet changes
  useEffect(() => {
    if (!isConnected) {
      setResult(null);
      setStep('form');
    }
  }, [isConnected]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Sanitize text inputs
    if (name === 'topic') {
      processedValue = sanitizeInput(value);
    }

    // Format ETH amount
    if (name === 'priceETH' && value) {
      processedValue = value;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate individual field
  const validateField = (name, value) => {
    switch (name) {
      case 'topic':
        if (!value || !value.trim()) return 'Topic is required';
        if (value.length > 200) return 'Topic must be less than 200 characters';
        return null;
      case 'date':
        return getFieldError('Date', value, 'date');
      case 'time':
        return getFieldError('Time', value, 'time');
      case 'duration':
        return getFieldError('Duration', value, 'duration');
      case 'priceETH':
        return getFieldError('Price', value, 'eth');
      default:
        return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected || !account) {
      setErrors({ general: 'Please connect your wallet first' });
      return;
    }

    // Validate form data
    const dataToValidate = {
      ...formData,
      account
    };
    
    const validation = validateMintSlotData(dataToValidate);
    
    if (!validation.isValid) {
      const fieldErrors = {};
      validation.errors.forEach(error => {
        if (error.includes('Topic')) fieldErrors.topic = error;
        else if (error.includes('Date')) fieldErrors.date = error;
        else if (error.includes('Time')) fieldErrors.time = error;
        else if (error.includes('Duration')) fieldErrors.duration = error;
        else if (error.includes('Price')) fieldErrors.priceETH = error;
        else if (error.includes('address')) fieldErrors.general = error;
        else fieldErrors.general = error;
      });
      
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      // Step 1: Call API to create Zoom meeting and prepare blockchain data
      const apiResponse = await postMintSlot(dataToValidate);
      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Failed to create meeting');
      }

      // Step 2: Mint NFT on blockchain
      const blockchainData = {
        date: formData.date,
        time: formData.time,
        priceETH: formData.priceETH,
        account: account,
        meetingId: apiResponse.meetingId?.toString(),
        joinUrl: apiResponse.zoomJoinUrl
      };
      
      const blockchainResponse = await mintSlotOnBlockchain(blockchainData);
      
      // Success!
      setResult({
        txHash: blockchainResponse.txHash,
        slotId: blockchainResponse.slotId,
        meetingId: apiResponse.meetingId,
        startUrl: apiResponse.startUrl,
        joinUrl: apiResponse.joinUrl,
        topic: formData.topic,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        priceETH: formData.priceETH
      });
      
      setStep('success');
      
    } catch (error) {
      setErrors({ 
        general: error.message || 'Failed to mint slot. Please try again.' 
      });
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to form view
  const resetForm = () => {
    setStep('form');
    setResult(null);
    setErrors({});
    setFormData({
      topic: '',
      date: '',
      time: '',
      duration: 60,
      priceETH: '0.01'
    });
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Render wallet connection if not connected
  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">🎯 Mint New Time Slot</h2>
        <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg text-center">
          <p className="mb-4 text-gray-600">Connect your wallet to mint time slots as NFTs</p>
          <WalletConnection />
        </div>
      </div>
    );
  }

  // Render success state
  if (step === 'success' && result) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4 text-green-700">✅ Slot Minted Successfully!</h2>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="mb-2"><strong>Topic:</strong> {result.topic}</div>
            <div className="mb-2"><strong>Date & Time:</strong> {result.date} at {result.time} ({result.duration} min)</div>
            <div className="mb-2"><strong>Price:</strong> {formatETHAmount(result.priceETH)} ETH</div>
            <div className="mb-2"><strong>Slot ID:</strong> #{result.slotId}</div>
            <div className="mb-2"><strong>Meeting ID:</strong> {result.meetingId}</div>
            {result.txHash ? (
              <div className="mb-2">
                <strong>Transaction:</strong>{' '}
                <a 
                  href={`https://etherscan.io/tx/${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {result.txHash.slice(0, 10)}...{result.txHash.slice(-8)}
                </a>
              </div>
            ) : (
              <div className="mb-2 text-gray-500">
                <strong>Transaction:</strong> Not available
              </div>
            )}
          </div>
          <div className="flex gap-4 justify-center mt-4">
            <a
              href={result.startUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              🎥 Host Meeting
            </a>
            <a
              href={result.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
            >
              👥 Join Meeting
            </a>
          </div>
          <button
            onClick={resetForm}
            className="mt-4 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
          >
            Mint Another Slot
          </button>
        </div>
      </div>
    );
  }

  // Render main form
  return (
    <div className="max-w-lg mx-auto p-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">🎯 Mint New Time Slot</h2>
      <div className="p-4 bg-white border border-gray-300 rounded-lg">
        <form onSubmit={handleSubmit}>
          {/* Topic Input */}
          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-700">Meeting Topic *</label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              placeholder="Enter meeting topic"
              className={`w-full p-2 border rounded-lg ${errors.topic ? 'border-red-500' : 'border-gray-300'}`}
              maxLength={200}
              required
            />
            {errors.topic && (
              <div className="text-red-500 text-sm mt-1">{errors.topic}</div>
            )}
          </div>

          {/* Date and Time Row */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block mb-2 font-semibold text-gray-700">Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                min={getMinDate()}
                className={`w-full p-2 border rounded-lg ${errors.date ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.date && (
                <div className="text-red-500 text-sm mt-1">{errors.date}</div>
              )}
            </div>

            <div className="flex-1">
              <label className="block mb-2 font-semibold text-gray-700">Time *</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg ${errors.time ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.time && (
                <div className="text-red-500 text-sm mt-1">{errors.time}</div>
              )}
            </div>
          </div>

          {/* Duration and Price Row */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block mb-2 font-semibold text-gray-700">Duration (minutes) *</label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg ${errors.duration ? 'border-red-500' : 'border-gray-300'}`}
                required
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
              {errors.duration && (
                <div className="text-red-500 text-sm mt-1">{errors.duration}</div>
              )}
            </div>

            <div className="flex-1">
              <label className="block mb-2 font-semibold text-gray-700">Price (ETH) *</label>
              <input
                type="number"
                name="priceETH"
                value={formData.priceETH}
                onChange={handleInputChange}
                placeholder="0.01"
                min="0.001"
                step="0.001"
                className={`w-full p-2 border rounded-lg ${errors.priceETH ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.priceETH && (
                <div className="text-red-500 text-sm mt-1">{errors.priceETH}</div>
              )}
            </div>
          </div>

          {/* Connected Wallet Info */}
          {account && (
            <div className="p-2 bg-green-100 border border-green-300 rounded-lg mb-4">
              <strong>Connected:</strong> {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="p-2 bg-red-100 border border-red-300 rounded-lg mb-4 text-red-600">
              ⚠️ {errors.general}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLoading ? (
              <span>
                <span className="animate-spin inline-block mr-2">⏳</span>
                Minting Slot...
              </span>
            ) : (
              '🚀 Mint Time Slot NFT'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MintSlot;
