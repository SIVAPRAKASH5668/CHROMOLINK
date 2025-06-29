// src/components/layout/Navbar.jsx
// Navigation bar component with wallet connection
// Uses WalletConnection component for MetaMask integration

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletConnection from '../shared/WalletConnection';

const Navbar = () => {
  const location = useLocation();

  // Check if current path matches the link
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  // Navigation links configuration
  const navLinks = [
    { path: '/mint', label: 'Mint Slot', icon: '⚡' },
    { path: '/book', label: 'Book Slot', icon: '📅' },
    { path: '/view', label: 'View Booking', icon: '👁️' },
    { path: '/verify', label: 'Verify Slot', icon: '✅' }
  ];

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      {/* Logo/Brand Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Link 
          to="/" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: '#1f2937',
            fontSize: '20px',
            fontWeight: '700'
          }}
        >
          <span style={{ fontSize: '24px' }}>🎯</span>
          SlotBook DApp
        </Link>
      </div>

      {/* Navigation Links - Desktop */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Desktop Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginRight: '24px'
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                backgroundColor: isActiveLink(link.path) ? '#dbeafe' : 'transparent',
                color: isActiveLink(link.path) ? '#1d4ed8' : '#6b7280',
                border: isActiveLink(link.path) ? '1px solid #bfdbfe' : '1px solid transparent'
              }}
              onMouseOver={(e) => {
                if (!isActiveLink(link.path)) {
                  e.target.style.backgroundColor = '#f9fafb';
                  e.target.style.color = '#374151';
                }
              }}
              onMouseOut={(e) => {
                if (!isActiveLink(link.path)) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6b7280';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Wallet Connection */}
        <WalletConnection 
          className="navbar-wallet"
          onConnected={(account) => {
            console.log('Wallet connected in navbar:', account);
          }}
        />
      </div>

      {/* Mobile Navigation Toggle (for future responsive implementation) */}
      <style jsx>{`
        @media (max-width: 768px) {
          nav {
            flex-wrap: wrap;
            padding: 12px 16px;
          }
          
          .nav-links {
            display: none;
            width: 100%;
            margin-top: 12px;
            flex-direction: column;
            gap: 8px;
          }
          
          .nav-links.mobile-open {
            display: flex;
          }
          
          .mobile-toggle {
            display: block;
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 8px;
          }
        }
        
        @media (min-width: 769px) {
          .mobile-toggle {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;