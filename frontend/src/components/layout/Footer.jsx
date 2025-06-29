// src/components/layout/Footer.jsx
// Simple footer component for the DApp
// Displays project info and copyright

import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      backgroundColor: '#f9fafb',
      borderTop: '1px solid #e5e7eb',
      padding: '32px 24px 24px',
      marginTop: 'auto',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Main Footer Content */}
        <div style={{
          marginBottom: '16px'
        }}>
          <p style={{
            margin: '0 0 8px 0',
            fontSize: '16px',
            fontWeight: '500',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            Built with 
            <span style={{ 
              color: '#3b82f6', 
              fontSize: '18px',
              animation: 'pulse 2s infinite' 
            }}>
              💙
            </span> 
            using Ethereum + Zoom
          </p>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            fontSize: '14px',
            color: '#6b7280',
            flexWrap: 'wrap'
          }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>⚡</span>
              Powered by Smart Contracts
            </span>
            
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>🦊</span>
              MetaMask Integration
            </span>
            
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>🎯</span>
              Decentralized Booking
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: '100%',
          height: '1px',
          backgroundColor: '#e5e7eb',
          margin: '20px 0 16px'
        }} />

        {/* Copyright */}
        <div style={{
          fontSize: '14px',
          color: '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <span>
            © {currentYear} SlotBook DApp. All rights reserved.
          </span>
          
          {/* Optional Links */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <a
              href="#privacy"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '13px',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.color = '#374151'}
              onMouseOut={(e) => e.target.style.color = '#6b7280'}
            >
              Privacy
            </a>
            
            <span style={{ color: '#d1d5db' }}>•</span>
            
            <a
              href="#terms"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '13px',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.color = '#374151'}
              onMouseOut={(e) => e.target.style.color = '#6b7280'}
            >
              Terms
            </a>
            
            <span style={{ color: '#d1d5db' }}>•</span>
            
            <a
              href="#github"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '13px',
                transition: 'color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseOver={(e) => e.target.style.color = '#374151'}
              onMouseOut={(e) => e.target.style.color = '#6b7280'}
            >
              <span>📦</span>
              GitHub
            </a>
          </div>
        </div>

        {/* Technology Stack Info */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            🛠️ Built with React • Ethers.js • Solidity • Node.js
          </p>
        </div>
      </div>

      {/* Pulse Animation for Heart */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        
        @media (max-width: 768px) {
          footer {
            padding: 24px 16px 20px;
          }
          
          .footer-links {
            flex-direction: column;
            gap: 8px;
          }
          
          .tech-stack {
            font-size: 11px;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;