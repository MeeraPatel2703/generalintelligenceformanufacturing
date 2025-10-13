import { useState, useEffect } from 'react'
import './LoadingSpinner.css'

interface LoadingSpinnerProps {
  message?: string
}

const PROGRESS_MESSAGES = [
  'Parsing CSV data...',
  'Analyzing machine patterns...',
  'Calculating cycle times...',
  'Identifying bottlenecks...',
  'Finalizing analysis...'
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
    <div className="loading-spinner-container">
      <div className="spinner"></div>
      <p className="loading-message">{currentMessage}</p>
    </div>
  )
}
