import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Slot Components
import MintSlot from './components/slots/MintSlot';
import BookSlot from './components/slots/BookSlot';
import ViewBooking from './components/slots/ViewBooking';
import VerifySlot from './components/slots/VerifySlot';

// Meeting Components
import CreateMeeting from './components/meetings/CreateMeeting';
import GetRecording from './components/meetings/GetRecording';
import WalletContext from './context/WalletContext'; // ✅ import context
import useWallet from './hooks/useWallet'; // ✅ use wallet hook
// Home Component
const Home = () => {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ 
        fontSize: '2.5rem', 
        marginBottom: '1rem',
        color: '#2563eb'
      }}>
        TimeSlot NFT Platform
      </h1>
      <p style={{ 
        fontSize: '1.2rem', 
        color: '#6c757d',
        marginBottom: '2rem'
      }}>
        Mint time slots as NFTs, book meetings with ETH, and manage Zoom recordings on the blockchain.
      </p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginTop: '2rem'
      }}>
        <div style={{
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#2563eb', marginBottom: '0.5rem' }}>Mint Slots</h3>
          <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
            Create and mint new time slots as NFTs with integrated Zoom meetings.
          </p>
        </div>
        
        <div style={{
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#16a34a', marginBottom: '0.5rem' }}>Book Slots</h3>
          <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
            Purchase available time slots using ETH and get instant meeting access.
          </p>
        </div>
        
        <div style={{
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#dc3545', marginBottom: '0.5rem' }}>Manage Meetings</h3>
          <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
            Create Zoom meetings and download recordings from your booked slots.
          </p>
        </div>
      </div>
    </div>
  );
};

function App() {
  const wallet = useWallet(); // ✅ shared wallet state

  return (
    <WalletContext.Provider value={wallet}> {/* ✅ wrap in context */}
      <div className="app">
        <BrowserRouter>
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />

              <Route path="/mint" element={<MintSlot />} />
              <Route path="/book" element={<BookSlot />} />
              <Route path="/view" element={<ViewBooking />} />
              <Route path="/verify" element={<VerifySlot />} />
              <Route path="/zoom/create" element={<CreateMeeting />} />
              <Route path="/zoom/recording" element={<GetRecording />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </div>
    </WalletContext.Provider>
  );
}

export default App;