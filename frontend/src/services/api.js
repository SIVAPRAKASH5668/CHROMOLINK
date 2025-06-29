// src/services/api.js
// Frontend API service that matches backend routes exactly

import { 
  API_BASE_URL, 
  MINT_SLOT_ENDPOINT, 
  GET_SLOT_ENDPOINT, 
  BOOK_SLOT_ENDPOINT, 
  VERIFY_BOOKING_ENDPOINT 
} from '../constants/routes.js';

/**
 * POST /api/slots/mint - Creates Zoom meeting and mints NFT slot
 * @param {Object} data - { topic, date, time, duration, priceETH, account }
 * @returns {Promise} Response with txHash, slotId, joinUrl, etc.
 */
export const postMintSlot = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}${MINT_SLOT_ENDPOINT}`, {
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
    console.error('Error minting slot:', error);
    throw error;
  }
};

/**
 * GET /api/slots/:slotId - Fetches slot info by slotId
 * @param {string|number} slotId - The slot ID to fetch
 * @returns {Promise} Slot information from blockchain or booking key
 */
export const getSlotInfo = async (slotId) => {
  try {
    const response = await fetch(`${API_BASE_URL}${GET_SLOT_ENDPOINT}/${slotId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching slot info:', error);
    throw error;
  }
};

/**
 * GET /api/slots/verify/:bookingKey - Verifies booking using slot key
 * @param {string} bookingKey - The booking key to verify
 * @returns {Promise} Formatted booking verification info
 */
export const verifyBookingKey = async (bookingKey) => {
  try {
    const response = await fetch(`${API_BASE_URL}${VERIFY_BOOKING_ENDPOINT}/${bookingKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying booking key:', error);
    throw error;
  }
};

/**
 * POST /api/slots/book/:slotId - Books a slot on blockchain
 * @param {string|number} slotId - The slot ID to book
 * @param {string} buyerAddress - Buyer's wallet address
 * @param {string} priceETH - Price in ETH as string
 * @returns {Promise} Response with txHash, bookingKey, etc.
 */
export const bookSlot = async (slotId, buyerAddress, priceETH) => {
  try {
    const response = await fetch(`${API_BASE_URL}${BOOK_SLOT_ENDPOINT}/${slotId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        buyerAddress, 
        priceETH 
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error booking slot:', error);
    throw error;
  }
};