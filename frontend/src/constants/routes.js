// src/constants/routes.js
// API route constants for use in frontend

// Safe access to env in Vite
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const MINT_SLOT_ENDPOINT = '/api/slots/mint';
export const GET_SLOT_ENDPOINT = '/api/slots';
export const BOOK_SLOT_ENDPOINT = '/api/slots/book';
export const VERIFY_BOOKING_ENDPOINT = '/api/slots/verify';

// Full URLs for convenience
export const MINT_SLOT_URL = `${API_BASE_URL}${MINT_SLOT_ENDPOINT}`;
export const GET_SLOT_URL = `${API_BASE_URL}${GET_SLOT_ENDPOINT}`;
export const BOOK_SLOT_URL = `${API_BASE_URL}${BOOK_SLOT_ENDPOINT}`;
export const VERIFY_BOOKING_URL = `${API_BASE_URL}${VERIFY_BOOKING_ENDPOINT}`;
