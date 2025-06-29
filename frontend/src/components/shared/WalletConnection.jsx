// src/components/shared/WalletConnection.jsx
// Reusable React component for wallet connection UI
// Uses useWallet hook for MetaMask integration

import React from 'react';
import { useContext } from 'react';
import WalletContext from '../../context/WalletContext';

const WalletConnection = ({ onConnected, className = '' }) => {
  const {
    account,
    isConnected,
    isConnecting,
    error,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet
  } = useContext(WalletContext)

  // Handle wallet connection
  const handleConnect = async () => {
    try {
      const connectedAccount = await connectWallet();
      if (onConnected && connectedAccount) {
        onConnected(connectedAccount);
      }
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  // Format wallet address for display (0x123...cB9)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // If MetaMask is not installed
  if (!isMetaMaskInstalled) {
    return (
      <div className={`wallet-connection ${className}`}>
        <div style={{ 
          color: '#ef4444', 
          fontSize: '14px',
          fontWeight: '500'
        }}>
          ⚠️ MetaMask not detected
        </div>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: '8px',
            padding: '8px 16px',
            backgroundColor: '#f97316',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#ea580c'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#f97316'}
        >
          Install MetaMask
        </a>
      </div>
    );
  }

  // Connected state
  if (isConnected && account) {
    return (
      <div className={`wallet-connection ${className}`}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#16a34a',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            <span style={{ fontSize: '16px' }}>✅</span>
            Connected: {formatAddress(account)}
          </div>
          
          <button
            onClick={disconnectWallet}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#fef2f2';
              e.target.style.borderColor = '#fca5a5';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = '#fecaca';
            }}
          >
            Disconnect
          </button>
        </div>
        
        {error && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '13px'
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // Not connected state
  return (
    <div className={`wallet-connection ${className}`}>
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 20px',
          backgroundColor: isConnecting ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
        onMouseOver={(e) => {
          if (!isConnecting) {
            e.target.style.backgroundColor = '#2563eb';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
          }
        }}
        onMouseOut={(e) => {
          if (!isConnecting) {
            e.target.style.backgroundColor = '#3b82f6';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }
        }}
      >
        {isConnecting ? (
          <>
            <span style={{ 
              display: 'inline-block', 
              animation: 'spin 1s linear infinite',
              fontSize: '18px'
            }}>
              ⏳
            </span>
            Connecting...
          </>
        ) : (
          <>
            <span style={{ fontSize: '18px' }}>🦊</span>
            Connect Wallet
          </>
        )}
      </button>
      
      {error && (
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <span style={{ fontSize: '16px', marginRight: '6px' }}>⚠️</span>
          {error}
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default WalletConnection;