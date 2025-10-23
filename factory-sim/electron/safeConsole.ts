/**
 * Safe console logging utilities to prevent EPIPE errors
 * when the renderer process disconnects while logging
 */

export const safeLog = (...args: any[]) => {
  try {
    console.log(...args)
  } catch (error) {
    // Silently ignore EPIPE errors during logging
  }
}

export const safeError = (...args: any[]) => {
  try {
    console.error(...args)
  } catch (error) {
    // Silently ignore EPIPE errors during logging
  }
}

export const safeWarn = (...args: any[]) => {
  try {
    console.warn(...args)
  } catch (error) {
    // Silently ignore EPIPE errors during logging
  }
}
