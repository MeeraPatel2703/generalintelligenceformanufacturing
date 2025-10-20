/**
 * FLOATING CHATBOT BUTTON
 * Always visible floating button for easy access to AI assistant
 */

import { useState, useEffect } from 'react';

interface Props {
  onClick: () => void;
  isOpen: boolean;
  hasNewMessages?: boolean;
}

export function FloatingChatbotButton({ onClick, isOpen, hasNewMessages = false }: Props) {
  const [isVisible, setIsVisible] = useState(true);
  const [pulseCount, setPulseCount] = useState(0);

  // Auto-hide after 5 seconds if not interacted with
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Show when there are new messages
  useEffect(() => {
    if (hasNewMessages) {
      setIsVisible(true);
      setPulseCount(3);
    }
  }, [hasNewMessages]);

  // Pulse animation for new messages
  useEffect(() => {
    if (pulseCount > 0) {
      const timer = setTimeout(() => {
        setPulseCount(pulseCount - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pulseCount]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 1000,
        cursor: 'pointer',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsVisible(true)}
    >
      {/* Main Button */}
      <div
        style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          backgroundColor: isOpen ? '#ef4444' : '#10b981',
          border: '3px solid #000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          color: '#000',
          fontWeight: 'bold',
          boxShadow: isOpen 
            ? '0 6px 20px rgba(239, 68, 68, 0.5)' 
            : '0 6px 20px rgba(16, 185, 129, 0.5)',
          transition: 'all 0.3s ease',
          transform: isOpen ? 'scale(1.1)' : 'scale(1)',
          animation: pulseCount > 0 ? 'pulse 0.5s ease-in-out' : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.transform = 'scale(1.15)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.6)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
          }
        }}
      >
        {isOpen ? '✕' : '🤖'}
      </div>

      {/* NEW Badge */}
      {!isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            backgroundColor: '#ef4444',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: '700',
            padding: '4px 8px',
            borderRadius: '12px',
            border: '2px solid #000',
            animation: 'pulse 2s infinite',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          NEW
        </div>
      )}

      {/* Tooltip */}
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '0',
          backgroundColor: 'var(--color-bg-primary)',
          color: 'var(--color-text-primary)',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: '600',
          border: '2px solid var(--color-primary)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          whiteSpace: 'nowrap',
          opacity: 0,
          transform: 'translateY(10px)',
          transition: 'all 0.3s ease',
          pointerEvents: 'none',
        }}
        className="chatbot-tooltip"
      >
        {isOpen ? 'Close Questions' : 'Ask Questions'}
        <div
          style={{
            position: 'absolute',
            bottom: '-8px',
            right: '20px',
            width: '0',
            height: '0',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid var(--color-primary)',
          }}
        />
      </div>

      {/* Show/Hide Toggle */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '0',
          width: '30px',
          height: '20px',
          backgroundColor: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.7rem',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(false);
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
          e.currentTarget.style.color = 'var(--color-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
          e.currentTarget.style.color = 'var(--color-text-secondary)';
        }}
        title="Hide chatbot button"
      >
        ×
      </div>
    </div>
  );
}
