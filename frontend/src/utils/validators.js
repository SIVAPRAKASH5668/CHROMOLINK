// src/utils/validators.js
// Frontend validation utilities that match backend validator logic exactly
// Used for form validation before API calls

/**
 * Validates date format and ensures it's not in the past
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidDate = (date) => {
  if (!date || typeof date !== 'string') {
    return false;
  }

  // Check format: YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }

  // Parse the date
  const parsedDate = new Date(date);
  
  // Check if it's a valid calendar date
  if (isNaN(parsedDate.getTime())) {
    return false;
  }

  // Verify the parsed date matches the input (handles invalid dates like 2023-02-30)
  const [year, month, day] = date.split('-').map(Number);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return false;
  }

  // Check if date is not in the past (compare with today's date only, ignore time)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  parsedDate.setHours(0, 0, 0, 0); // Reset time to start of day
  
  return parsedDate >= today;
};

/**
 * Validates time format in 24-hour HH:MM format
 * @param {string} time - Time string in HH:MM format
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidTime = (time) => {
  if (!time || typeof time !== 'string') {
    return false;
  }

  // Check format: HH:MM (24-hour)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time)) {
    return false;
  }

  // Additional validation - extract hours and minutes
  const [hours, minutes] = time.split(':').map(Number);
  
  // Validate ranges
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
};

/**
 * Validates ETH amount - must be positive float, cannot be 0 or negative
 * @param {string|number} amount - ETH amount
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidETHAmount = (amount) => {
  if (amount === null || amount === undefined || amount === '') {
    return false;
  }

  // Convert to number if string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if it's a valid number
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return false;
  }

  // Must be positive (greater than 0)
  return numAmount > 0;
};

/**
 * Validates Ethereum address format
 * @param {string} address - Ethereum address
 * @returns {boolean} True if valid, false otherwise
 */
export const isETHAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Must be 42 characters long and start with 0x
  if (address.length !== 42 || !address.startsWith('0x')) {
    return false;
  }

  // Must contain only hexadecimal characters after 0x
  const hexRegex = /^0x[a-fA-F0-9]{40}$/;
  return hexRegex.test(address);
};

/**
 * Validates duration in minutes - must be integer between 1 and 1440
 * @param {string|number} duration - Duration in minutes
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidDuration = (duration) => {
  if (duration === null || duration === undefined || duration === '') {
    return false;
  }

  // Convert to number if string
  const numDuration = typeof duration === 'string' ? parseInt(duration, 10) : duration;
  
  // Check if it's a valid integer
  if (isNaN(numDuration) || !Number.isInteger(numDuration)) {
    return false;
  }

  // Must be between 1 and 1440 minutes (24 hours)
  return numDuration >= 1 && numDuration <= 1440;
};

/**
 * Validates a complete mint slot form data object
 * @param {Object} data - Form data object
 * @param {string} data.topic - Meeting topic
 * @param {string} data.date - Date in YYYY-MM-DD format
 * @param {string} data.time - Time in HH:MM format
 * @param {number|string} data.duration - Duration in minutes
 * @param {number|string} data.priceETH - Price in ETH
 * @param {string} data.account - Ethereum address
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validateMintSlotData = (data) => {
  const errors = [];

  // Validate topic
  if (!data.topic || typeof data.topic !== 'string') {
    errors.push('Topic is required');
  } else if (data.topic.trim().length === 0) {
    errors.push('Topic cannot be empty');
  } else if (data.topic.length > 200) {
    errors.push('Topic must be less than 200 characters');
  }

  // Validate date
  if (!isValidDate(data.date)) {
    errors.push('Date must be in YYYY-MM-DD format and not in the past');
  }

  // Validate time
  if (!isValidTime(data.time)) {
    errors.push('Time must be in HH:MM format (24-hour)');
  }

  // Validate date + time combination (must be in future)
  if (isValidDate(data.date) && isValidTime(data.time)) {
    const dateTime = new Date(`${data.date}T${data.time}:00`);
    if (dateTime <= new Date()) {
      errors.push('Meeting time must be in the future');
    }
  }

  // Validate duration
  if (!isValidDuration(data.duration)) {
    errors.push('Duration must be between 1-1440 minutes');
  }

  // Validate price
  if (!isValidETHAmount(data.priceETH)) {
    errors.push('Price must be a positive number');
  }

  // Validate account
  if (!isETHAddress(data.account)) {
    errors.push('Invalid Ethereum address');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates book slot form data
 * @param {Object} data - Booking data object
 * @param {string|number} data.slotId - Slot ID
 * @param {string} data.buyerAddress - Buyer's Ethereum address
 * @param {number|string} data.priceETH - Price in ETH
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validateBookSlotData = (data) => {
  const errors = [];

  // Validate slot ID
  if (!data.slotId && data.slotId !== 0) {
    errors.push('Slot ID is required');
  }

  // Validate buyer address
  if (!isETHAddress(data.buyerAddress)) {
    errors.push('Invalid buyer Ethereum address');
  }

  // Validate price
  if (!isValidETHAmount(data.priceETH)) {
    errors.push('Price must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates booking key format
 * @param {string} bookingKey - Booking key to validate
 * @returns {boolean} True if valid format, false otherwise
 */
export const isValidBookingKey = (bookingKey) => {
  if (!bookingKey || typeof bookingKey !== 'string') {
    return false;
  }

  // Booking key should be non-empty string
  // Add specific format validation if backend has requirements
  return bookingKey.trim().length > 0;
};

/**
 * Sanitizes user input by trimming whitespace
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  return input.trim();
};

/**
 * Formats ETH amount to a consistent decimal places
 * @param {string|number} amount - ETH amount
 * @param {number} decimals - Number of decimal places (default: 6)
 * @returns {string} Formatted ETH amount
 */
export const formatETHAmount = (amount, decimals = 6) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0';
  }
  
  return numAmount.toFixed(decimals);
};

/**
 * Validates form field and returns error message
 * @param {string} fieldName - Name of the field being validated
 * @param {any} value - Value to validate
 * @param {string} type - Type of validation ('date', 'time', 'eth', 'address', 'duration')
 * @returns {string|null} Error message or null if valid
 */
export const getFieldError = (fieldName, value, type) => {
  switch (type) {
    case 'date':
      return isValidDate(value) ? null : `${fieldName} must be in YYYY-MM-DD format and not in the past`;
    
    case 'time':
      return isValidTime(value) ? null : `${fieldName} must be in HH:MM format (24-hour)`;
    
    case 'eth':
      return isValidETHAmount(value) ? null : `${fieldName} must be a positive number`;
    
    case 'address':
      return isETHAddress(value) ? null : `${fieldName} must be a valid Ethereum address`;
    
    case 'duration':
      return isValidDuration(value) ? null : `${fieldName} must be between 1-1440 minutes`;
    
    default:
      return null;
  }
};