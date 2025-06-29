// src/services/blockchain.js
// Frontend blockchain service using ethers.js and MetaMask
// Matches backend blockchainService.js function names and parameters exactly

import { ethers, parseEther, formatEther } from 'ethers';
import contractArtifact from '../config/contractABI.json';
const contractABI = contractArtifact.abi;

// Contract configuration - update these with your actual values
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';


/**
 * Get MetaMask provider and signer
 * @returns {Object} { provider, signer }
 */
const getProviderAndSigner = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  // ✅ This works in ethers v6
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner(); // Note: now async in v6

  return { provider, signer };
};



/**
 * Get contract instance
 * @param {ethers.Signer} signer - Ethereum signer
 * @returns {ethers.Contract} Contract instance
 */
const getContract = (signer) => {
    if (!Array.isArray(contractABI)) {
        throw new Error('Loaded contract ABI is not an array — check the ABI import.');
    }
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
};

/**
 * Mint slot on blockchain - matches backend mintSlotOnBlockchain function
 * @param {Object} data - { date, time, priceETH, account, meetingId, joinUrl }
 * @returns {Promise<Object>} { txHash, slotId }
 */
export async function mintSlotOnBlockchain({ date, time, priceETH, account, meetingId, joinUrl }) {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

    console.log("🔍 joinUrl value before sending to contract:", joinUrl);

    // Validate joinUrl
    if (!joinUrl || typeof joinUrl !== 'string') {
      throw new Error('joinUrl is missing or invalid');
    }

    // Validate meetingId
    if (!meetingId || typeof meetingId !== 'string') {
      throw new Error('meetingId is missing or invalid');
    }

    const tx = await contract.mintSlot(
      date,                                  // string
      time,                                  // string
      ethers.parseEther(priceETH.toString()), // uint256 in wei
      account,                               // address
      meetingId,                             // string
      joinUrl                                // string
    );

    const receipt = await tx.wait();

    // Extract SlotMinted event
    const event = receipt.logs
      .map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(parsed => parsed?.name === 'SlotMinted');

    return {
      txHash: tx.hash,
      slotId: event?.args?.slotId?.toString() ?? null
    };

  } catch (err) {
    console.error('Error minting on blockchain:', err);
    return { txHash: undefined, slotId: undefined };
  }
};



/**
 * Get slot info from blockchain - matches backend getSlotInfo function
 * @param {string|number} slotIdOrKey - Slot ID or booking key
 * @returns {Promise<Object>} Full slot metadata (owner, price, status, etc.)
 */
export const getSlotInfo = async (slotIdOrKey) => {
  try {
    const { provider } = await getProviderAndSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

    // Call getSlotInfo function on smart contract
    const slotInfo = await contract.getSlotInfo(slotIdOrKey);

    return {
      owner: slotInfo.owner,
      price: ethers.utils.formatEther(slotInfo.price),
      status: slotInfo.status,
      date: slotInfo.date,
      time: slotInfo.time,
      meetingId: slotInfo.meetingId,
      joinUrl: slotInfo.joinUrl,
      isBooked: slotInfo.isBooked,
      bookedBy: slotInfo.bookedBy
    };
  } catch (error) {
    console.error('Error getting slot info from blockchain:', error);
    throw error;
  }
};

/**
 * Get slot price from blockchain - matches backend getSlotPrice function
 * @param {string|number} slotId - The slot ID
 * @returns {Promise<string>} ETH price as string
 */
export const getSlotPrice = async (slotId) => {
  try {
    const { provider } = await getProviderAndSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

    // Call getSlotPrice function on smart contract
    const priceWei = await contract.getSlotPrice(slotId);
    
    // Convert from wei to ETH and return as string
    return ethers.utils.formatEther(priceWei);
  } catch (error) {
    console.error('Error getting slot price from blockchain:', error);
    throw error;
  }
};

/**
 * Book slot on blockchain - matches backend bookSlotOnBlockchain function
 * @param {Object} data - { slotId, buyerAddress, priceETH }
 * @returns {Promise<Object>} { txHash, bookingKey }
 */
export const bookSlotOnBlockchain = async (data) => {
  try {
    const { slotId, buyerAddress, priceETH } = data;
    const { signer } = await getProviderAndSigner();
    const contract = getContract(signer);

    // Convert price to wei
    const priceWei = ethers.utils.parseEther(priceETH);

    // Call book function on smart contract with payment
    const tx = await contract.bookSlot(slotId, {
      value: priceWei
    });

    const receipt = await tx.wait();
    console.log('🔍 TX Receipt:', receipt);

    
    // Extract booking key from event logs
    const bookEvent = receipt.events?.find(event => event.event === 'SlotBooked');
    const bookingKey = bookEvent?.args?.bookingKey;

    return {
      txHash: receipt.transactionHash,
      bookingKey: bookingKey
    };
  } catch (error) {
    console.error('Error booking slot on blockchain:', error);
    throw error;
  }
};

/**
 * Check if MetaMask is connected
 * @returns {Promise<boolean>} Connection status
 */
export const isMetaMaskConnected = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      return false;
    }
    
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0;
  } catch (error) {
    console.error('Error checking MetaMask connection:', error);
    return false;
  }
};

/**
 * Connect to MetaMask
 * @returns {Promise<string>} Connected account address
 */
export const connectWallet = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    return accounts[0];
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};