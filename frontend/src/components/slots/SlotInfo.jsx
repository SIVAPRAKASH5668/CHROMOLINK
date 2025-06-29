import React from 'react';

const SlotInfo = ({ 
  slot, 
  showOwner = true, 
  showBookingKey = false, 
  highlightStatus = true 
}) => {
  // Handle missing slot data
  if (!slot) {
    return (
      <div style={styles.container}>
        <div style={styles.errorMessage}>
          No slot information available
        </div>
      </div>
    );
  }

  // Format Ethereum address to display format (0x12...34aB)
  const formatAddress = (address) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Format date and time to readable format
  const formatDateTime = (date, time) => {
    if (!date || !time) return 'Date/Time not available';
    
    try {
      // Parse date string (YYYY-MM-DD)
      const [year, month, day] = date.split('-');
      const dateObj = new Date(year, month - 1, day);
      
      // Format date
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      // Format time (assume 24-hour format HH:MM)
      const [hours, minutes] = time.split(':');
      const timeObj = new Date();
      timeObj.setHours(parseInt(hours), parseInt(minutes));
      const formattedTime = timeObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      return `${formattedDate} at ${formattedTime}`;
    } catch (error) {
      return `${date} at ${time}`;
    }
  };

  // Get status color and text
  const getStatusInfo = () => {
    if (slot.isBooked) {
      return {
        color: '#22c55e', // Green
        backgroundColor: '#dcfce7',
        text: 'Booked',
        icon: '🟢'
      };
    } else {
      return {
        color: '#eab308', // Yellow
        backgroundColor: '#fef3c7',
        text: 'Available',
        icon: '🟡'
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div style={styles.container}>
      {/* Header with Slot ID and Status */}
      <div style={styles.header}>
        <div style={styles.slotIdSection}>
          <h3 style={styles.slotId}>
            Slot #{slot.slotId || 'Unknown'}
          </h3>
          {slot.topic && (
            <p style={styles.topic}>{slot.topic}</p>
          )}
        </div>
        
        {highlightStatus && (
          <div 
            style={{
              ...styles.statusBadge,
              color: statusInfo.color,
              backgroundColor: statusInfo.backgroundColor
            }}
          >
            <span style={styles.statusIcon}>{statusInfo.icon}</span>
            {statusInfo.text}
          </div>
        )}
      </div>

      {/* Main slot information */}
      <div style={styles.infoGrid}>
        {/* Date & Time */}
        <div style={styles.infoItem}>
          <div style={styles.label}>📅 Date & Time</div>
          <div style={styles.value}>
            {formatDateTime(slot.date, slot.time)}
          </div>
        </div>

        {/* Price */}
        <div style={styles.infoItem}>
          <div style={styles.label}>💰 Price</div>
          <div style={styles.priceValue}>
            {slot.price || '0'} ETH
          </div>
        </div>

        {/* Owner */}
        {showOwner && slot.owner && (
          <div style={styles.infoItem}>
            <div style={styles.label}>👤 Owner</div>
            <div style={styles.addressValue}>
              {formatAddress(slot.owner)}
            </div>
          </div>
        )}

        {/* Booked By */}
        {slot.isBooked && slot.bookedBy && (
          <div style={styles.infoItem}>
            <div style={styles.label}>🎫 Booked By</div>
            <div style={styles.addressValue}>
              {formatAddress(slot.bookedBy)}
            </div>
          </div>
        )}

        {/* Zoom Meeting Information */}
        {slot.meetingId && (
          <div style={styles.infoItem}>
            <div style={styles.label}>🎥 Meeting ID</div>
            <div style={styles.value}>
              {slot.meetingId}
            </div>
          </div>
        )}
      </div>

      {/* Zoom Join Button */}
      {slot.joinUrl && (
        <div style={styles.zoomSection}>
          <a 
            href={slot.joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.joinButton}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1d4ed8';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#2563eb';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            🎥 Join Zoom Meeting
          </a>
        </div>
      )}

      {/* Booking Key (if requested) */}
      {showBookingKey && slot.bookingKey && (
        <div style={styles.bookingKeySection}>
          <div style={styles.label}>🔑 Booking Key</div>
          <div style={styles.bookingKeyValue}>
            {slot.bookingKey}
          </div>
        </div>
      )}
    </div>
  );
};

// Inline styles
const styles = {
  container: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: '1.5',
    maxWidth: '100%'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px'
  },

  slotIdSection: {
    flex: '1',
    minWidth: '200px'
  },

  slotId: {
    margin: '0 0 8px 0',
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827'
  },

  topic: {
    margin: '0',
    fontSize: '16px',
    color: '#6b7280',
    fontWeight: '500'
  },

  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    border: '1px solid currentColor'
  },

  statusIcon: {
    fontSize: '12px'
  },

  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },

  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },

  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },

  value: {
    fontSize: '16px',
    color: '#111827',
    fontWeight: '500'
  },

  priceValue: {
    fontSize: '18px',
    color: '#059669',
    fontWeight: '700'
  },

  addressValue: {
    fontSize: '16px',
    color: '#6366f1',
    fontWeight: '500',
    fontFamily: 'Monaco, "Courier New", monospace'
  },

  zoomSection: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb'
  },

  joinButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: 'pointer'
  },

  bookingKeySection: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },

  bookingKeyValue: {
    fontSize: '14px',
    color: '#374151',
    fontFamily: 'Monaco, "Courier New", monospace',
    wordBreak: 'break-all',
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '4px'
  },

  errorMessage: {
    textAlign: 'center',
    color: '#ef4444',
    fontSize: '16px',
    padding: '20px'
  },

  // Mobile responsive styles
  '@media (max-width: 768px)': {
    container: {
      padding: '16px'
    },
    
    header: {
      flexDirection: 'column',
      alignItems: 'stretch'
    },
    
    slotId: {
      fontSize: '20px'
    },
    
    infoGrid: {
      gridTemplateColumns: '1fr',
      gap: '16px'
    },
    
    joinButton: {
      width: '100%',
      justifyContent: 'center'
    }
  }
};

export default SlotInfo;