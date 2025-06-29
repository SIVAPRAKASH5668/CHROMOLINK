// routes/slots.js - Fixed version with enhanced error handling
const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const { mintSlotOnBlockchain, getSlotInfo, getSlotPrice, bookSlotOnBlockchain } = require("../services/blockchainService");
const { getZoomAccessToken, createZoomMeeting } = require("../services/zoomService");

// Helper function to validate date format
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && dateString === date.toISOString().split('T')[0];
}

// Helper function to validate time format
function isValidTime(timeString) {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeString);
}

// Async wrapper for better error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/slots/test - Test endpoint
router.get("/test", asyncHandler(async (req, res) => {
  res.json({ 
    message: "Slots API is working", 
    timestamp: new Date().toISOString() 
  });
}));

// POST /api/slots/mint - Mint a slot and create a Zoom meeting
router.post("/mint", asyncHandler(async (req, res) => {
  console.log("🔵 Mint slot request received");
  console.log("Request body:", req.body);
  
  const { topic, date, time, duration, priceETH, account } = req.body;

  // Basic validations
  if (!topic || !date || !time || !duration || !priceETH || !account) {
    console.log("❌ Missing required fields");
    return res.status(400).json({ 
      error: "Missing required fields",
      required: ["topic", "date", "time", "duration", "priceETH", "account"],
      received: { topic: !!topic, date: !!date, time: !!time, duration: !!duration, priceETH: !!priceETH, account: !!account }
    });
  }

  // Validate date format
  if (!isValidDate(date)) {
    console.log("❌ Invalid date format:", date);
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
  }

  // Validate time format
  if (!isValidTime(time)) {
    console.log("❌ Invalid time format:", time);
    return res.status(400).json({ error: "Invalid time format. Use HH:MM (24-hour)" });
  }

  // Validate Ethereum address
  if (!ethers.isAddress(account)) {
    console.log("❌ Invalid wallet address:", account);
    return res.status(400).json({ error: "Invalid wallet address format" });
  }

  // Validate duration
  const durationNum = parseInt(duration);
  if (isNaN(durationNum) || durationNum < 1 || durationNum > 1440) {
    console.log("❌ Invalid duration:", duration);
    return res.status(400).json({ error: "Duration must be between 1-1440 minutes" });
  }

  // Validate price
  const priceNum = parseFloat(priceETH);
  if (isNaN(priceNum) || priceNum <= 0) {
    console.log("❌ Invalid price:", priceETH);
    return res.status(400).json({ error: "Price must be a positive number" });
  }

  console.log("✅ All validations passed");

  // Format ISO time for Zoom
  const startDateTimeStr = `${date}T${time}:00.000Z`;
  const startTimeISO = new Date(startDateTimeStr).toISOString();

  // Check if the meeting time is in the future
  if (new Date(startTimeISO) < new Date()) {
    console.log("❌ Meeting time is in the past:", startTimeISO);
    return res.status(400).json({ error: "Cannot create meeting in the past" });
  }

  console.log("🔵 Getting Zoom access token...");
  // Step 1: Get Zoom Access Token
  const zoomAccessToken = await getZoomAccessToken();
  console.log("✅ Zoom access token obtained");

  console.log("🔵 Creating Zoom meeting...");
  // Step 2: Create Zoom Meeting
  const zoomMeeting = await createZoomMeeting(
    zoomAccessToken,
    topic,
    startTimeISO,
    durationNum
  );
  console.log("✅ Zoom meeting created:", zoomMeeting.id);

  console.log("🔵 Minting slot on blockchain...");
  // Step 3: Mint Slot on Blockchain
  const mintResult = await mintSlotOnBlockchain({
    date,
    time,
    priceETH: priceNum,
    account,
    meetingId: zoomMeeting.id.toString(),
    joinUrl: zoomMeeting.join_url
  });

  console.log("✅ Mint successful:", mintResult);

  return res.json({
    success: true,
    txHash: mintResult.txHash,
    slotId: mintResult.slotId,
    zoomJoinUrl: zoomMeeting.join_url,
    zoomStartUrl: zoomMeeting.start_url,
    meetingId: zoomMeeting.id,
    startTime: startTimeISO,
    topic: topic,
    date: date,
    time: time,
    duration: durationNum,
    priceETH: priceNum
  });
}));

// GET /api/slots/:slotId - Get slot info by ID
router.get("/:slotId", asyncHandler(async (req, res) => {
  const { slotId } = req.params;
  
  console.log(`🔵 Fetching slot info for ID: ${slotId}`);

  // Validate slotId
  if (!slotId || slotId.trim() === "") {
    console.log("❌ Empty slot ID");
    return res.status(400).json({ error: "Slot ID is required" });
  }

  // Check if slotId is a valid number (for uint256 slots)
  const slotIdNum = parseInt(slotId, 10);
  if (isNaN(slotIdNum) || slotIdNum < 0) {
    console.log("❌ Invalid slot ID format:", slotId);
    return res.status(400).json({ error: "Slot ID must be a valid positive number" });
  }

  console.log(`🔍 Querying blockchain for slot ${slotIdNum}`);
  const slotInfo = await getSlotInfo(slotIdNum);

  if (!slotInfo) {
    console.log(`🔴 Slot ${slotIdNum} not found`);
    return res.status(404).json({ error: "Slot not found" });
  }

  console.log(`✅ Slot info retrieved for ID ${slotIdNum}:`, slotInfo);

  return res.json({
    success: true,
    slot: slotInfo
  });
}));

// POST /api/slots/book - Book a slot by ID
router.post("/book", asyncHandler(async (req, res) => {
  console.log("🔵 Book slot request received");
  console.log("Request body:", req.body);
  
  const { slotId, buyerAddress } = req.body;

  // Validate inputs
  if (!slotId || !buyerAddress) {
    console.log("❌ Missing required fields for booking");
    return res.status(400).json({ 
      error: "Missing slotId or buyerAddress",
      received: { slotId: !!slotId, buyerAddress: !!buyerAddress }
    });
  }

  const slotIdNum = parseInt(slotId, 10);
  if (isNaN(slotIdNum) || slotIdNum < 0) {
    console.log("❌ Invalid slot ID format:", slotId);
    return res.status(400).json({ error: "Invalid slot ID format" });
  }

  if (!ethers.isAddress(buyerAddress)) {
    console.log("❌ Invalid buyer address:", buyerAddress);
    return res.status(400).json({ error: "Invalid buyer address format" });
  }

  console.log(`🔵 Getting slot info for booking: ${slotIdNum}`);
  
  // First, get slot info to check if it exists and get price
  const slotInfo = await getSlotInfo(slotIdNum);
  
  if (!slotInfo) {
    console.log("❌ Slot not found for booking");
    return res.status(404).json({ error: "Slot not found" });
  }

  if (slotInfo.isBooked) {
    console.log("❌ Slot already booked");
    return res.status(400).json({ error: "Slot is already booked" });
  }

  console.log(`🔵 Getting slot price for: ${slotIdNum}`);
  
  // Get the price for this slot
  const slotPrice = await getSlotPrice(slotIdNum);
  
  if (!slotPrice || slotPrice === "0") {
    console.log("❌ Invalid slot price:", slotPrice);
    return res.status(400).json({ error: "Invalid slot price" });
  }

  console.log(`🔵 Booking slot on blockchain...`);
  
  // Book the slot on blockchain
  const bookingResult = await bookSlotOnBlockchain({
    slotId: slotIdNum,
    buyerAddress,
    priceETH: slotPrice
  });

  console.log("✅ Booking successful:", bookingResult);

  return res.json({
    success: true,
    txHash: bookingResult.txHash,
    bookingKey: bookingResult.bookingKey,
    slotInfo: {
      ...slotInfo,
      priceETH: slotPrice
    }
  });
}));

// POST /api/slots/verify - Verify booking key and get Zoom link
router.post("/verify", asyncHandler(async (req, res) => {
  console.log("🔵 Verify booking request received");
  console.log("Request body:", req.body);
  
  const { bookingKey } = req.body;

  if (!bookingKey) {
    console.log("❌ Missing booking key");
    return res.status(400).json({ error: "Booking key is required" });
  }

  console.log(`🔍 Verifying booking key: ${bookingKey}`);
  const slotInfo = await getSlotInfo(bookingKey);

  if (!slotInfo || !slotInfo.isBooked) {
    console.log("❌ Invalid booking key or slot not booked");
    return res.status(404).json({ error: "Invalid booking key or slot not booked" });
  }

  console.log("✅ Booking verified:", slotInfo);

  return res.json({
    success: true,
    joinUrl: slotInfo.joinUrl,
    startTime: slotInfo.startTime,
    topic: slotInfo.topic,
    meetingId: slotInfo.meetingId,
    date: slotInfo.date,
    time: slotInfo.time
  });
}));

// GET /api/slots - List all slots (debugging endpoint)
router.get("/", asyncHandler(async (req, res) => {
  console.log("🔵 List slots request received");
  
  return res.json({
    success: true,
    message: "Slots API is working. Use /api/slots/:slotId to get specific slot info.",
    endpoints: [
      'GET /api/slots/test - Test endpoint',
      'POST /api/slots/mint - Mint a new slot',
      'GET /api/slots/:slotId - Get slot information',
      'POST /api/slots/book - Book a slot',
      'POST /api/slots/verify - Verify booking key'
    ],
    timestamp: new Date().toISOString()
  });
}));

// Error handling for this router
router.use((error, req, res, next) => {
  console.error("🔴 Slots router error:", error);
  
  // Handle blockchain-specific errors
  if (error.message.includes("execution reverted")) {
    return res.status(400).json({ 
      error: "Blockchain transaction failed", 
      details: error.message 
    });
  }
  
  if (error.message.includes("network") || error.message.includes("connection")) {
    return res.status(503).json({ 
      error: "Blockchain network unavailable", 
      details: error.message 
    });
  }
  
  if (error.message.includes("timeout")) {
    return res.status(504).json({ 
      error: "Request timeout", 
      details: error.message 
    });
  }
  
  // Handle Zoom API errors
  if (error.message.includes("zoom") || error.message.includes("meeting")) {
    return res.status(502).json({ 
      error: "Zoom service error", 
      details: error.message 
    });
  }
  
  // Default error
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;