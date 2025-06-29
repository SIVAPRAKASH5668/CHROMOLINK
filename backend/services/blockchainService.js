const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { ethers } = require("ethers");

// Load contract ABI from JSON file
let contractABI;
try {
  const contractJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "contracts", "TimeSlot.json"))
  );
  contractABI = contractJson.abi;
  console.log("✅ ABI loaded, length:", contractABI.length);
} catch (error) {
  console.error("❌ Failed to load contract ABI:", error);
  throw new Error(
    "Contract ABI not found. Make sure TimeSlot.json exists in contracts folder."
  );
}

// Validate environment variables
const { RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;
if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  throw new Error(
    "Missing required environment variables: RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS"
  );
}

// Setup ethers provider, wallet, and contract instance
let provider, wallet, contract;

try {
  // Initialize provider
  provider = new ethers.JsonRpcProvider(RPC_URL);
  
  // Initialize wallet
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  // Initialize contract
  contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
  
  console.log("✅ Blockchain service initialized successfully");
  console.log("Contract address:", CONTRACT_ADDRESS);
  console.log("Wallet address:", wallet.address);
  
} catch (error) {
  console.error("❌ Failed to initialize blockchain service:", error);
  throw error;
}

// Log available functions for debugging
if (Array.isArray(contractABI)) {
  const functionNames = contractABI
    .filter((item) => item.type === "function")
    .map((func) => func.name);
  console.log("Contract functions:", functionNames);
} else {
  console.warn("Warning: contractABI is not an array");
}

/**
 * Test contract connection
 */
async function testContractConnection() {
  try {
    // Test basic contract call
    const network = await provider.getNetwork();
    console.log("Connected to network:", network.name, "Chain ID:", network.chainId);
    
    // Test if contract has required functions
    const requiredFunctions = ['mintSlot', 'getSlotInfo', 'bookSlot'];
    const missingFunctions = [];
    
    for (const funcName of requiredFunctions) {
      if (!contract[funcName]) {
        missingFunctions.push(funcName);
      }
    }
    
    if (missingFunctions.length > 0) {
      console.error("❌ Missing functions:", missingFunctions);
      console.log("Available functions:", Object.keys(contract.interface.functions));
      return false;
    }
    
    console.log("✅ All required functions found on contract");
    return true;
  } catch (error) {
    console.error("❌ Contract connection test failed:", error);
    return false;
  }
}

/**
 * Mint the slot NFT on blockchain
 * @param {Object} slotData - { date, time, priceETH, account, meetingId, joinUrl }
 */
async function mintSlotOnBlockchain(slotData) {
  const { date, time, priceETH, account, meetingId, joinUrl } = slotData;

  console.log("🔄 Minting slot with params:", {
    date,
    time,
    priceETH,
    account,
    meetingId: meetingId.substring(0, 20) + "...", // Truncated for logs
    joinUrl: joinUrl.substring(0, 30) + "...", // Truncated for logs
  });

  try {
    // Validate contract is initialized
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    // Test contract connection first
    const connectionOk = await testContractConnection();
    if (!connectionOk) {
      throw new Error("Contract connection test failed");
    }

    if (!ethers.isAddress(account)) {
      throw new Error("Invalid wallet address");
    }

    const priceInWei = ethers.parseEther(priceETH.toString());

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log("Wallet balance:", ethers.formatEther(balance), "ETH");

    // Ensure we have the mintSlot function
    if (!contract.mintSlot) {
      throw new Error("mintSlot function not found on contract");
    }

    // Estimate gas for mintSlot call
    console.log("🔄 Estimating gas for mintSlot...");
    const gasEstimate = await contract.mintSlot.estimateGas(
      date,
      time,
      priceInWei,
      account,
      meetingId,
      joinUrl
    );

    console.log("Gas estimate:", gasEstimate.toString());

    const feeData = await provider.getFeeData();
    const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice;
    if (!gasPrice) throw new Error("Unable to fetch gas price");

    // Calculate estimated cost
    const estimatedCost = gasEstimate * gasPrice;
    console.log("Estimated cost:", ethers.formatEther(estimatedCost), "ETH");

    if (balance < estimatedCost) {
      throw new Error(`Insufficient funds. Need ${ethers.formatEther(estimatedCost)} ETH, have ${ethers.formatEther(balance)} ETH`);
    }

    // Add 20% gas buffer
    const gasLimit = (gasEstimate * 120n) / 100n;

    // Send transaction
    console.log("🔄 Sending transaction...");
    const tx = await contract.mintSlot(
      date,
      time,
      priceInWei,
      account,
      meetingId,
      joinUrl,
      {
        gasLimit,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      }
    );

    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed:", receipt.hash);

    // Parse logs to find SlotMinted event
    let slotId = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog.name === "SlotMinted") {
          slotId = parsedLog.args.slotId?.toString();
          console.log("SlotMinted event found, slotId:", slotId);
          break;
        }
      } catch (e) {
        // Skip logs that can't be parsed by this contract
        continue;
      }
    }

    if (!slotId) {
      console.warn("⚠️ Warning: SlotMinted event not found in logs");
    }

    return {
      txHash: receipt.hash,
      slotId,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("❌ Minting error:", error);
    throw error;
  }
}

/**
 * Get slot info from blockchain by slotId or bookingKey
 * @param {string|number} slotIdOrBookingKey
 */
async function getSlotInfo(slotIdOrBookingKey) {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    console.log(`🔄 Getting slot info for: ${slotIdOrBookingKey}`);

    let slotInfo;
    
    // Try different approaches based on input type
    if (typeof slotIdOrBookingKey === 'number' || /^\d+$/.test(slotIdOrBookingKey)) {
      // Numeric slotId - try getSlotInfo first
      const slotId = parseInt(slotIdOrBookingKey, 10);
      console.log(`Calling getSlotInfo with slotId: ${slotId}`);
      
      try {
        slotInfo = await contract.getSlotInfo(slotId);
      } catch (error) {
        console.error("getSlotInfo failed:", error.message);
        
        // If getSlotInfo fails, the slot might not exist
        if (error.message.includes("execution reverted") || 
            error.message.includes("Slot does not exist")) {
          return null;
        }
        throw error;
      }
    } else {
      // Non-numeric - assume it's a booking key
      console.log(`Calling getSlotByBookingKey with key: ${slotIdOrBookingKey}`);
      
      try {
        slotInfo = await contract.getSlotByBookingKey(slotIdOrBookingKey);
      } catch (error) {
        console.error("getSlotByBookingKey failed:", error.message);
        
        // Try as slotId anyway (sometimes bookingKeys are numeric)
        if (!isNaN(slotIdOrBookingKey)) {
          try {
            slotInfo = await contract.getSlotInfo(parseInt(slotIdOrBookingKey, 10));
          } catch (e) {
            console.error("Fallback getSlotInfo also failed:", e.message);
            return null;
          }
        } else {
          return null;
        }
      }
    }

    // Handle the case where slot exists but has default/empty values
    if (!slotInfo || (slotInfo.owner === ethers.ZeroAddress && slotInfo.price === 0n)) {
      console.log("Slot not found or has default values");
      return null;
    }

    const formattedSlotInfo = {
      slotId: slotInfo.slotId?.toString() ?? null,
      date: slotInfo.date || "",
      time: slotInfo.time || "",
      price: slotInfo.price ? ethers.formatEther(slotInfo.price) : "0",
      owner: slotInfo.owner || "",
      bookedBy: slotInfo.bookedBy ?? slotInfo.booker ?? "",
      isBooked: Boolean(slotInfo.booked ?? slotInfo.isBooked ?? false),
      paymentReleased: Boolean(slotInfo.paymentReleased ?? false),
      meetingId: slotInfo.meetingId || "",
      joinUrl: slotInfo.joinUrl || "",
    };

    console.log("✅ Formatted slot info:", formattedSlotInfo);
    return formattedSlotInfo;

  } catch (error) {
    console.error("❌ Get slot info error:", error);
    throw error;
  }
}

/**
 * Get the price of a slot by slotId
 * @param {number} slotId
 */
async function getSlotPrice(slotId) {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }
    
    console.log(`🔄 Getting price for slot ${slotId}`);
    
    // Try different function names that might exist
    let price;
    if (contract.slotPrice) {
      price = await contract.slotPrice(slotId);
    } else if (contract.getSlotPrice) {
      price = await contract.getSlotPrice(slotId);
    } else {
      // Fallback to getSlotInfo and extract price
      const slotInfo = await contract.getSlotInfo(slotId);
      price = slotInfo.price;
    }
    
    return ethers.formatEther(price);
  } catch (error) {
    console.error("❌ Get slot price error:", error);
    throw error;
  }
}

/**
 * Book a slot on blockchain
 * @param {Object} bookingData - { slotId, buyerAddress, priceETH }
 */
async function bookSlotOnBlockchain(bookingData) {
  const { slotId, buyerAddress, priceETH } = bookingData;

  console.log("🔄 Booking slot with params:", {
    slotId,
    buyerAddress,
    priceETH,
  });

  try {
    // Validate contract is initialized
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    if (!ethers.isAddress(buyerAddress)) {
      throw new Error("Invalid buyer wallet address");
    }

    // Convert price to Wei
    const priceInWei = ethers.parseEther(priceETH.toString());

    // Check if bookSlot function exists
    if (!contract.bookSlot) {
      throw new Error("bookSlot function not found on contract. Available functions: " + 
        Object.keys(contract.interface.functions).join(", "));
    }

    // Get current network and wallet info
    const network = await provider.getNetwork();
    const balance = await provider.getBalance(wallet.address);
    console.log("Connected to network:", network.name);
    console.log("Wallet balance:", ethers.formatEther(balance), "ETH");

    // Estimate gas for bookSlot call
    console.log("🔄 Estimating gas for bookSlot...");
    const gasEstimate = await contract.bookSlot.estimateGas(slotId, {
      from: wallet.address,
      value: priceInWei
    });

    console.log("Gas estimate:", gasEstimate.toString());

    const feeData = await provider.getFeeData();
    const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice;
    if (!gasPrice) throw new Error("Unable to fetch gas price");

    // Calculate total cost (gas + slot price)
    const gasCost = gasEstimate * gasPrice;
    const totalCost = gasCost + priceInWei;
    console.log("Gas cost:", ethers.formatEther(gasCost), "ETH");
    console.log("Slot price:", ethers.formatEther(priceInWei), "ETH");
    console.log("Total cost:", ethers.formatEther(totalCost), "ETH");

    if (balance < totalCost) {
      throw new Error(`Insufficient funds. Need ${ethers.formatEther(totalCost)} ETH, have ${ethers.formatEther(balance)} ETH`);
    }

    // Add 20% gas buffer
    const gasLimit = (gasEstimate * 120n) / 100n;

    // Send transaction to book the slot
    console.log("🔄 Sending booking transaction...");
    const tx = await contract.bookSlot(slotId, {
      value: priceInWei,
      gasLimit,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    });

    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Booking transaction confirmed:", receipt.hash);

    // Parse logs to find SlotBooked event
    let bookingKey = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog.name === "SlotBooked") {
          bookingKey = parsedLog.args.bookingKey;
          console.log("SlotBooked event found, bookingKey:", bookingKey);
          break;
        }
      } catch (e) {
        // Skip logs that can't be parsed by this contract
        continue;
      }
    }

    if (!bookingKey) {
      console.warn("⚠️ Warning: SlotBooked event not found in transaction logs");
    }

    return {
      txHash: receipt.hash,
      bookingKey,
      blockNumber: receipt.blockNumber,
      slotId: slotId.toString(),
    };

  } catch (error) {
    console.error("❌ Booking error:", error);
    throw error;
  }
}

module.exports = {
  mintSlotOnBlockchain,
  getSlotInfo,
  getSlotPrice,
  bookSlotOnBlockchain,
  testContractConnection,
  contract,
  provider,
};
