
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const { JWT_SECRET } = require('./middleware/auth');

// Keep track of all connected clients
const clients = new Map();
// Store authenticated user IDs
const authenticatedUsers = new Set();
// Store anonymous visitor count
let anonymousVisitors = 0;

function setupWebsocketServer(server) {
  // Create WebSocket server
  const wss = new WebSocket.Server({ 
    noServer: true 
  });

  // Handle upgrade requests for WebSocket
  server.on('upgrade', (request, socket, head) => {
    const { query } = url.parse(request.url, true);
    const token = query.token;
    
    if (token) {
      try {
        // Verify token using the same JWT_SECRET as our auth middleware
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;
        
        // Proceed with WebSocket upgrade for authenticated user
        wss.handleUpgrade(request, socket, head, (ws) => {
          // Add user ID to client data
          ws.userId = userId;
          ws.isAuthenticated = true;
          ws.isAlive = true;
          wss.emit('connection', ws, request);
        });
      } catch (error) {
        // Invalid token but still allow connection as anonymous
        wss.handleUpgrade(request, socket, head, (ws) => {
          ws.isAuthenticated = false;
          ws.isAlive = true;
          anonymousVisitors++;
          wss.emit('connection', ws, request);
        });
      }
    } else {
      // No token, connect as anonymous
      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.isAuthenticated = false;
        ws.isAlive = true;
        anonymousVisitors++;
        wss.emit('connection', ws, request);
      });
    }
  });

  // Handle WebSocket connections
  wss.on('connection', (ws, request) => {
    const userId = ws.userId;
    const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
    
    console.log(`WebSocket connection established: ${ws.isAuthenticated ? 'User: ' + userId : 'Anonymous visitor'}, IP: ${ip}`);
    
    // Store client connection
    clients.set(ws, { 
      userId: ws.isAuthenticated ? userId : null,
      ip,
      isAuthenticated: ws.isAuthenticated,
      connectedAt: new Date()
    });
    
    // Add user to authenticated users set if authenticated
    if (ws.isAuthenticated) {
      authenticatedUsers.add(userId);
    }
    
    // Send initial online users count
    broadcastOnlineUsersCount();
    
    // Handle client messages
    ws.on('message', (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        
        // Handle different message types (can be extended)
        if (parsedMessage.type === 'PING') {
          ws.isAlive = true;
          ws.send(JSON.stringify({ type: 'PONG' }));
          return;
        }
        
        console.log(`Received message from ${ws.isAuthenticated ? userId : 'anonymous'}:`, parsedMessage);
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      const clientData = clients.get(ws);
      console.log(`WebSocket connection closed: ${clientData?.isAuthenticated ? 'User: ' + clientData.userId : 'Anonymous visitor'}`);
      
      // Remove client from map
      clients.delete(ws);
      
      // If anonymous, decrement visitor count
      if (!ws.isAuthenticated) {
        anonymousVisitors = Math.max(0, anonymousVisitors - 1);
      } else {
        // Check if user has other active connections
        let userHasOtherConnections = false;
        for (const clientData of clients.values()) {
          if (clientData.userId === userId) {
            userHasOtherConnections = true;
            break;
          }
        }
        
        // If no other connections, remove from authenticated users
        if (!userHasOtherConnections) {
          authenticatedUsers.delete(userId);
        }
      }
      
      // Broadcast updated count
      broadcastOnlineUsersCount();
    });
    
    // Handle connection errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
      
      // If anonymous, decrement visitor count
      if (!ws.isAuthenticated) {
        anonymousVisitors = Math.max(0, anonymousVisitors - 1);
      }
    });
  });

  // Health check interval to detect broken connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log("Terminating stale connection");
        if (!ws.isAuthenticated) {
          anonymousVisitors = Math.max(0, anonymousVisitors - 1);
        }
        return ws.terminate();
      }

      ws.isAlive = false; // Will be set to true when ping response comes back
    });
  }, 30000); // Check every 30 seconds
  
  // Stop the interval when the server closes
  wss.on('close', () => {
    console.log("WebSocket server closing, clearing interval");
    clearInterval(interval);
  });
  
  // Set up periodic broadcast of online users count
  setInterval(() => {
    broadcastOnlineUsersCount();
  }, 10000); // every 10 seconds
  
  return wss;
}

// Broadcast online users count to all clients
function broadcastOnlineUsersCount() {
  const message = {
    type: 'ONLINE_USERS_COUNT',
    authenticatedCount: authenticatedUsers.size,
    anonymousCount: anonymousVisitors,
    totalCount: authenticatedUsers.size + anonymousVisitors
  };
  
  broadcast(message);
}

// Broadcast message to all connected clients
function broadcast(message) {
  clients.forEach((data, client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Export functions
module.exports = {
  setupWebsocketServer,
  getOnlineUsers: () => ({
    authenticated: authenticatedUsers.size,
    anonymous: anonymousVisitors,
    total: authenticatedUsers.size + anonymousVisitors
  }),
  broadcast
};
