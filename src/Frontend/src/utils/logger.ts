export const logToBackend = async (level: 'info' | 'warn' | 'error', message: string, stackTrace?: string) => {
  try {
    const url = window.location.href;
    
    // Fire and forget so we don't block the UI
    fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        message,
        url,
        stackTrace
      })
    }).catch((err: unknown) => {
      // Fallback if logging fails
      console.error("Failed to send log to backend:", err);
    });
  } catch (error) {
    console.error("Error in logger utility:", error);
  }
};

// Global error handlers
export const setupGlobalErrorLogging = () => {
  window.addEventListener('error', (event) => {
    logToBackend(
      'error', 
      event.message || 'Unhandled Error', 
      event.error?.stack || ''
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    logToBackend(
      'error', 
      `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
      event.reason?.stack || ''
    );
  });
};
