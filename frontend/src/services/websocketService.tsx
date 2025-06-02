// WebSocket connection management
let socket: WebSocket | null = null;
let onlineUsersCallback: ((count: number) => void) | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10; // Increased max attempts
const RECONNECT_INTERVAL = 3000; // Reduced reconnect interval for faster recovery
const MAX_PING_FAILURES = 3;
let pingFailures = 0;
let pingIntervalId: ReturnType<typeof setInterval> | null = null;
let lastPingSentTime = 0; // Track when the last ping was sent

export const connectWebSocket = (token: string): void => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return;
  }

  // Close existing connection if any
  if (socket) {
    try {
      socket.close();
    } catch (err) {
      console.error('Error closing existing socket:', err);
    }
  }

  // Reset reconnect attempts and ping failures when intentionally connecting
  reconnectAttempts = 0;
  pingFailures = 0;
  lastPingSentTime = 0;

  try {
    // Create new WebSocket connection with auth token
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = '3001'; // Use environment variable in production
    const wsUrl = `${protocol}//${host}:${port}?token=${encodeURIComponent(token)}`;
    
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      // Reset reconnect attempts and ping failures on successful connection
      reconnectAttempts = 0;
      pingFailures = 0;
      
      // Start pinging when connection is established
      startPingInterval(15000); // More frequent ping interval (15 seconds)
      
      // Send an immediate ping to verify connection
      pingServer();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Reset ping failures when we get any message from the server
        pingFailures = 0;
        
        // Handle online users count update
        if (data.type === 'ONLINE_USERS_COUNT' && onlineUsersCallback) {
          onlineUsersCallback(data.totalCount); // Using totalCount instead of count
        }
        
        // Check for pong response
        if (data.type === 'PONG') {
          // Calculate ping-pong round trip time
          const roundTripTime = Date.now() - lastPingSentTime;
          // Pong received, connection is healthy
          pingFailures = 0;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = (event) => {
      // Stop pinging
      if (pingIntervalId) {
        clearInterval(pingIntervalId);
        pingIntervalId = null;
      }
      
      // Clear any existing reconnect timer
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      
      // Don't attempt to reconnect if closed normally (code 1000)
      if (event.code === 1000) {
        return;
      }
      
      // Try to reconnect as long as we haven't exceeded max attempts
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        
        // Use exponential backoff for reconnection attempts
        const backoffDelay = Math.min(RECONNECT_INTERVAL * Math.pow(1.5, reconnectAttempts - 1), 30000);
        
        reconnectTimer = setTimeout(() => {
          if (token) {
            connectWebSocket(token);
          }
        }, backoffDelay);
      }
    };

    socket.onerror = (error) => {
      // We don't need to do anything here as onclose will be called right after
    };
  } catch (error) {
    // Try to reconnect if connection fails to establish
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      
      reconnectTimer = setTimeout(() => {
        if (token) {
          connectWebSocket(token);
        }
      }, RECONNECT_INTERVAL);
    }
  }
};

export const disconnectWebSocket = (): void => {
  // Clear any reconnect timer
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  // Stop ping interval
  stopPingInterval();
  
  if (socket) {
    try {
      // Use 1000 (normal closure) to prevent reconnection attempts
      socket.close(1000, 'Intentional disconnect');
    } catch (err) {
      console.error('Error closing socket:', err);
    } finally {
      socket = null;
    }
  }
};

export const setOnlineUsersCallback = (callback: (count: number) => void): void => {
  onlineUsersCallback = callback;
};

// Send message to server with improved reliability
export const sendMessage = (data: any): boolean => {
  if (!socket) {
    console.warn('WebSocket is not initialized');
    return false;
  }
  
  if (socket.readyState === WebSocket.CONNECTING) {
    console.warn('WebSocket is still connecting, message not sent');
    return false;
  }
  
  if (socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('Error sending WebSocket message:', err);
      return false;
    }
  } else {
    console.error('WebSocket is not connected (state:', socket.readyState, ')');
    // Try to reconnect if the socket is closed or closing
    if (socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
      const token = localStorage.getItem("auth_token");
      if (token) {
        connectWebSocket(token);
      }
    }
    return false;
  }
};

// Ping the server to keep connection alive
export const pingServer = (): void => {
  lastPingSentTime = Date.now();
  const sentSuccessfully = sendMessage({ type: 'PING', timestamp: lastPingSentTime });
  
  // If ping failed, increment failure counter
  if (!sentSuccessfully) {
    pingFailures++;
    
    // If we've had too many failures, try to reconnect
    if (pingFailures >= MAX_PING_FAILURES) {
      const token = localStorage.getItem("auth_token");
      if (token) {
        connectWebSocket(token);
      }
    }
  }
};

// Start a ping interval with improved handling
export const startPingInterval = (intervalMs = 15000): void => {
  // Clear existing interval if any
  stopPingInterval();
  
  pingIntervalId = setInterval(() => {
    // Don't ping if socket isn't ready
    if (socket && socket.readyState === WebSocket.OPEN) {
      pingServer();
    } else if (socket && socket.readyState !== WebSocket.CONNECTING) {
      // If socket is closed or closing, try to reconnect
      const token = localStorage.getItem("auth_token");
      if (token) {
        connectWebSocket(token);
      }
    }
  }, intervalMs);
};

export const stopPingInterval = (): void => {
  if (pingIntervalId) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
  }
};
