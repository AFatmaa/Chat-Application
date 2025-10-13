const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 3000;

// Stores chat messages temporarily (resets when server restarts)
let messages = [];

// Keeps track of clients waiting for new messages (for long-polling)
const callBackForNewMessages = [];

// Returns existing messages or waits for new ones (long-polling)
app.get('/messages', (req, res) => { 
  // Get the 'since' parameter from the request URL
  const { since } = req.query;
  
  if (!since) {
    // Send the current list of messages as a JSON array.
    res.json(messages);
  }

  // Avoid sending old messages again; only return messages after client's last timestamp
  const newMessagesForThisClient = messages.filter(message => message.timestamp > since);

  // If there are new messages immediately available for this client, send them now.
  if (newMessagesForThisClient.length > 0) {
    res.json(newMessagesForThisClient);
  } else {
    // If no new messages are immediatley available, put this client's request into a waiting queue.
    // The server will hold this connection open.
    const timeoutId = setTimeout(() => {
      // Find and remove this client's request from the waiting queue.
      const index = callBackForNewMessages.findIndex(cb => cb.res === res);
      if (index !== -1) {
        callBackForNewMessages.splice(index, 1);

        // Ensure we haven't already sent a response.
        if (!res.headersSent) {
          // Send an empty array to signal no new messages.
          res.status(200).json([]);
        }
      }
    }, 25000);

    callBackForNewMessages.push({
      res: res,
      since: since,
      timeoutId: timeoutId
    });
  }
});

// Handle new chat message creation and notify waiting clients
app.post('/messages', (req, res) => {
  // Validate user input before creating new message
  const { text } = req.body; 

  if (!text) {
    return res.status(400).json({ error: 'Message text is required.'});
  }

  const newMessage = {
    id: messages.length + 1,
    text: text,
    timestamp: new Date().toISOString(),
    likes: 0
  };

  messages.push(newMessage);

  res.status(201).json(newMessage);

  // Iterate through the waiting clients.
  for (let i = callBackForNewMessages.length -1; i >= 0; i--) {
    const waitingClient = callBackForNewMessages[i];
    
    if (newMessage.timestamp > waitingClient.since) {
      clearTimeout(waitingClient.timeoutId);

      // Ensure a response hasn't already been sent.
      if (!waitingClient.res.headersSent) {
        // Send the new message (as an array) to the waiting client.
        waitingClient.res.status(200).json([newMessage]);
      }
      // Remove the client from the waiting queue.
      callBackForNewMessages.splice(i, 1);
    }
  }
  broadcast({
    command: "new-message",
    message: newMessage,
  });
});

// Helper: send data to all connected WebSocket clients
function broadcast(data) {
  const json = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("✅ New WebSocket client connected");

  // When a new client connects, send existing messages
  ws.send(
    JSON.stringify({
      command: "initial-messages",
      messages: messages,
    })
  );

  // When a WebSocket message is received
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.command) {
        // A client sends a new chat message
        case "send-message": {
          const newMessage = {
            id: messages.length + 1,
            text: data.message.text,
            timestamp: new Date().toISOString(),
            likes: 0,
          };
          messages.push(newMessage);

          // Broadcast to all clients (both WebSocket + polling)
          broadcast({
            command: "new-message",
            message: newMessage,
          });
          break;
        }

        // A client likes a specific message
        case "like-message": {
          const msg = messages.find((m) => m.id === data.messageId);
          if (msg) {
            msg.likes += 1;

            // Notify all WebSocket clients
            broadcast({
              command: "like-update",
              messageId: msg.id,
              likes: msg.likes,
            });
          }
          break;
        }

        default:
          console.warn("⚠️ Unknown command:", data.command);
      }
    } catch (err) {
      console.error("Error handling WebSocket message:", err);
    }
  });

  // Handle WebSocket disconnection
  ws.on("close", () => {
    console.log("❌ WebSocket client disconnected");
  });
});

server.listen(port, () => {
  console.log(`Chat server (HTTP + WebSocket) running on port ${port}`);
});