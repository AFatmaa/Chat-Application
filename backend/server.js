// Import necessary libraries
const express = require('express');
const cors = require('cors');

// Create an Express application
const app = express();
// Define the port for the server to listen on.
const port = 3000;

// Our in-memory message storage
let messages = [];

// This array will hold information about clients waiting for new messages (for Long-Polling).
const callBackForNewMessages = [];

// This allows the frontend to talk to this backend.
app.use(cors());
// This is needed to read message text sent from the frontend.
app.use(express.json());

// GET /messages: Endpoint to retrieve all messages
// This endpoint handles requests to get the chat history.
app.get('/messages', (req, res) => {
  // Get the 'since' parameter from the request URL 
  const { since } = req.query;
  
  if (!since) {
    // Send the current list of messages as a JSON array.
    res.json(messages);
  }

  // Filter messages to find only those newer than the 'since' timestamp provided by the client.
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

// POST /messages: Endpoint to add a new message
// This endpoint handles requests to send a new message to the chat.
app.post('/messages', (req, res) => {
  // Extract the 'text' property from the request body.
  const { text } = req.body; 

  if (!text) {
    return res.status(400).json({ error: 'Message text is required.'});
  }

  const newMessage = {
    id: messages.length + 1,
    text: text,
    timestamp: new Date().toISOString()
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
});

// Make the Express app listen for incoming requests on the specified port.
app.listen(port, () => {
  console.log(`Chat backend listening at http://localhost:${port}`);
});