// src/hooks/useWallet.js
// Reusable React hook for MetaMask wallet connection
// Handles connection, account changes, and network changes

import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';

const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
  };

  // Connect to MetaMask wallet
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      const errorMsg = 'MetaMask is not installed. Please install MetaMask extension.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create provider and signer
      const browserProvider = new BrowserProvider(window.ethereum);
      const walletSigner = await browserProvider.getSigner();
      const address = await walletSigner.getAddress();

      // Update state
      setProvider(browserProvider);
      setSigner(walletSigner);
      setAccount(address);

      console.log('✅ Wallet connected:', address);
      return address;
    } catch (err) {
      console.error('❌ Failed to connect wallet:', err);
      
      let errorMessage = 'Failed to connect wallet';
      if (err.code === 4001) {
        errorMessage = 'User rejected the connection request';
      } else if (err.code === -32002) {
        errorMessage = 'Connection request already pending';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
  localStorage.setItem('wallet-disconnected', 'true'); // 🧠 prevent reconnect
  setAccount(null);
  setProvider(null);
  setSigner(null);
  setError(null);
  console.log('🔌 Wallet disconnected');
}, []);


  // Check if wallet is already connected on mount
  const checkConnection = useCallback(async () => {
  if (!isMetaMaskInstalled()) return;

  // 🧠 Do not auto-connect if user explicitly disconnected
  const isDisconnected = localStorage.getItem('wallet-disconnected') === 'true';
  if (isDisconnected) {
    console.log('🚫 Auto-connect skipped due to manual disconnect');
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });

    if (accounts.length > 0) {
      const browserProvider = new BrowserProvider(window.ethereum);
      const walletSigner = await browserProvider.getSigner();
      const address = await walletSigner.getAddress();

      setProvider(browserProvider);
      setSigner(walletSigner);
      setAccount(address);

      console.log('🔄 Auto-connected to wallet:', address);
    }
  } catch (err) {
    console.error('❌ Failed to check wallet connection:', err);
    setError('Failed to check wallet connection');
  }
}, []);


  // Handle account changes
  const handleAccountsChanged = useCallback((accounts) => {
    console.log('🔄 Account changed:', accounts);
    
    if (accounts.length === 0) {
      // User disconnected
      disconnectWallet();
    } else if (accounts[0] !== account) {
      // Account switched - reconnect
      connectWallet();
    }
  }, [account, connectWallet, disconnectWallet]);

  // Handle network/chain changes
  const handleChainChanged = useCallback((chainId) => {
    console.log('🔄 Network changed:', chainId);
    // Reload the page to reset state when network changes
    window.location.reload();
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!isMetaMaskInstalled()) {
      return;
    }

    // Check for existing connection on mount
    checkConnection();

    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    
    // Listen for network changes
    window.ethereum.on('chainChanged', handleChainChanged);

    // Cleanup event listeners
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [checkConnection, handleAccountsChanged, handleChainChanged]);

  // Get current network info
  const getNetworkInfo = useCallback(async () => {
    if (!provider) {
      return null;
    }

    try {
      const network = await provider.getNetwork();
      return {
        chainId: network.chainId,
        name: network.name
      };
    } catch (err) {
      console.error('❌ Failed to get network info:', err);
      return null;
    }
  }, [provider]);

  // Get account balance
  const getBalance = useCallback(async () => {
    if (!provider || !account) {
      return null;
    }

    try {
      const balance = await provider.getBalance(account);
      return balance;
    } catch (err) {
      console.error('❌ Failed to get balance:', err);
      return null;
    }
  }, [provider, account]);

  return {
    // Connection state
    account,
    provider,
    signer,
    isConnecting,
    error,
    isConnected: !!account,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    
    // Actions
    connectWallet,
    disconnectWallet,
    
    // Utilities
    getNetworkInfo,
    getBalance
  };
};

export default useWallet;