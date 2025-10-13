import { useState, useEffect } from 'react'

interface LoadingSpinnerProps {
  message?: string
}

const PROGRESS_MESSAGES = [
  'INITIALIZING SYSTEM...',
  'PARSING DATA STRUCTURES...',
  'ANALYZING PATTERNS...',
  'CALCULATING METRICS...',
  'FINALIZING RESULTS...'
]

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  const [currentMessage, setCurrentMessage] = useState(message || PROGRESS_MESSAGES[0])
  const [, setMessageIndex] = useState(0)

  useEffect(() => {
    if (message) {
      setCurrentMessage(message)
      return
    }

    // Cycle through progress messages every 3 seconds
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        const next = (prev + 1) % PROGRESS_MESSAGES.length
        setCurrentMessage(PROGRESS_MESSAGES[next])
        return next
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [message])

  return (
    <div className="industrial-loader">
      <div className="industrial-loader__spinner"></div>
      <div className="industrial-status industrial-status--processing">
        <span className="industrial-status__indicator"></span>
        {currentMessage}
      </div>
    </div>
  )
}
