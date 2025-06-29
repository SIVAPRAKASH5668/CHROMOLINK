// routes/slots.js
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

// POST /api/slots/mint - Mint a slot and create a Zoom meeting
router.post("/mint", async (req, res) => {
  console.log("🔵 Mint slot request:", req.body);
  
  const { topic, date, time, duration, priceETH, account } = req.body;

  // Basic validations
  if (!topic || !date || !time || !duration || !priceETH || !account) {
    return res.status(400).json({ 
      error: "Missing required fields",
      required: ["topic", "date", "time", "duration", "priceETH", "account"]
    });
  }

  // Validate date format
  if (!isValidDate(date)) {
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
  }

  // Validate time format
  if (!isValidTime(time)) {
    return res.status(400).json({ error: "Invalid time format. Use HH:MM (24-hour)" });
  }

  // Validate Ethereum address
  if (!ethers.isAddress(account)) {
    return res.status(400).json({ error: "Invalid wallet address format" });
  }

  // Validate duration
  const durationNum = parseInt(duration);
  if (isNaN(durationNum) || durationNum < 1 || durationNum > 1440) {
    return res.status(400).json({ error: "Duration must be between 1-1440 minutes" });
  }

  // Validate price
  const priceNum = parseFloat(priceETH);
  if (isNaN(priceNum) || priceNum <= 0) {
    return res.status(400).json({ error: "Price must be a positive number" });
  }

  try {
    // Format ISO time for Zoom
    const startDateTimeStr = `${date}T${time}:00.000Z`;
    const startTimeISO = new Date(startDateTimeStr).toISOString();

    // Check if the meeting time is in the future
    if (new Date(startTimeISO) < new Date()) {
      return res.status(400).json({ error: "Cannot create meeting in the past" });
    }

    console.log("🔵 Getting Zoom access token...");
    // Step 1: Get Zoom Access Token
    const zoomAccessToken = await getZoomAccessToken();

    console.log("🔵 Creating Zoom meeting...");
    // Step 2: Create Zoom Meeting
    const zoomMeeting = await createZoomMeeting(
      zoomAccessToken,
      topic,
      startTimeISO,
      durationNum
    );

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

  } catch (error) {
    console.error("🔴 Mint slot error:", error.stack || error.message || error);
    return res.status(500).json({
      error: error.message || "Failed to mint slot and create meeting"
    });
  }
});

// GET /api/slots/:slotId - Get slot info by ID
router.get("/:slotId", async (req, res) => {
  const { slotId } = req.params;
  
  console.log(`🔵 Fetching slot info for ID: ${slotId}`);

  // Validate slotId
  if (!slotId || slotId.trim() === "") {
    return res.status(400).json({ error: "Slot ID is required" });
  }

  // Check if slotId is a valid number (for uint256 slots)
  const slotIdNum = parseInt(slotId, 10);
  if (isNaN(slotIdNum) || slotIdNum < 0) {
    return res.status(400).json({ error: "Slot ID must be a valid positive number" });
  }

  try {
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

  } catch (error) {
    console.error("🔴 Get slot info error:", error.stack || error.message || error);
    
    // More specific error handling
    if (error.message.includes("execution reverted")) {
      return res.status(404).json({ error: "Slot not found on blockchain" });
    }
    
    if (error.message.includes("invalid address")) {
      return res.status(400).json({ error: "Invalid contract address" });
    }
    
    if (error.message.includes("network") || error.message.includes("connection")) {
      return res.status(503).json({ error: "Blockchain network unavailable" });
    }

    if (error.message.includes("timeout")) {
      return res.status(504).json({ error: "Request timeout" });
    }

    return res.status(500).json({
      error: "Failed to get slot information"
    });
  }
});

// POST /api/slots/book - Book a slot by ID
router.post("/book", async (req, res) => {
  console.log("🔵 Book slot request:", req.body);
  
  const { slotId, buyerAddress } = req.body;

  // Validate inputs
  if (!slotId || !buyerAddress) {
    return res.status(400).json({ error: "Missing slotId or buyerAddress" });
  }

  const slotIdNum = parseInt(slotId, 10);
  if (isNaN(slotIdNum) || slotIdNum < 0) {
    return res.status(400).json({ error: "Invalid slot ID format" });
  }

  if (!ethers.isAddress(buyerAddress)) {
    return res.status(400).json({ error: "Invalid buyer address format" });
  }

  try {
    console.log(`🔵 Getting slot info for booking: ${slotIdNum}`);
    
    // First, get slot info to check if it exists and get price
    const slotInfo = await getSlotInfo(slotIdNum);
    
    if (!slotInfo) {
      return res.status(404).json({ error: "Slot not found" });
    }

    if (slotInfo.isBooked) {
      return res.status(400).json({ error: "Slot is already booked" });
    }

    console.log(`🔵 Getting slot price for: ${slotIdNum}`);
    
    // Get the price for this slot
    const slotPrice = await getSlotPrice(slotIdNum);
    
    if (!slotPrice || slotPrice === "0") {
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

  } catch (error) {
    console.error("🔴 Book slot error:", error.stack || error.message);
    return res.status(500).json({
      error: error.message || "Failed to book slot"
    });
  }
});

// POST /api/slots/verify - Verify booking key and get Zoom link
router.post("/verify", async (req, res) => {
  console.log("🔵 Verify booking request:", req.body);
  
  const { bookingKey } = req.body;

  if (!bookingKey) {
    return res.status(400).json({ error: "Booking key is required" });
  }

  try {
    const slotInfo = await getSlotInfo(bookingKey);

    if (!slotInfo || !slotInfo.isBooked) {
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

  } catch (error) {
    console.error("🔴 Verify slot error:", error.stack || error.message || error);
    return res.status(500).json({
      error: error.message || "Failed to verify booking key"
    });
  }
});

// GET /api/slots - List all slots (optional endpoint for debugging)
router.get("/", async (req, res) => {
  try {
    // This would require implementing a getAllSlots function in your blockchain service
    // For now, return a simple response
    return res.json({
      success: true,
      message: "Slots endpoint is working. Use /api/slots/:slotId to get specific slot info."
    });
  } catch (error) {
    console.error("🔴 List slots error:", error);
    return res.status(500).json({
      error: "Failed to list slots"
    });
  }
});

module.exports = router;