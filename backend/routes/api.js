//routes/application.js
const express = require("express");
const router = express.Router();
const { createMeeting } = require("../services/zoomService");
const { mintSlotOnBlockchain } = require("../blockchainService");

// Endpoint to mint slot + create Zoom meeting
router.post("/mint-slot", async (req, res) => {
  const { date, time, price } = req.body;

  if (!date || !time || !price) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    // Mint the slot NFT on blockchain (implement blockchainService later)
    const txHash = await mintSlotOnBlockchain(date, time, price);

    // Prepare ISO date string for Zoom
    const isoStartTime = new Date(`${date}T${time}`).toISOString();

    // Create Zoom meeting
    const meeting = await createMeeting(
      `Slot for user on ${date} at ${time}`,
      isoStartTime,
      60 // duration in minutes
    );

    res.json({
      success: true,
      txHash,
      zoomJoinUrl: meeting.join_url,
      zoomStartUrl: meeting.start_url,
      meetingId: meeting.id,
    });
  } catch (err) {
    console.error("Mint Slot Error:", err);
    res.status(500).json({ error: err.message || "Mint + Zoom meeting failed" });
  }
});

module.exports = router;
