// Import necessary libraries
const express = require('express');
const cors = require('cors');

// Create an Express application
const app = express();
// Define the port for the server to listen on.
const port = 3000;

// A simple array to store char messages.
// In a real application, this would be a database.
let messages = [];

// This allows the frontend to talk to this backend.
app.use(cors());
// This is needed to read message text sent from the frontend.
app.use(express.json());

// GET /messages: Endpoint to retrieve all messages
// This endpoint handles requests to get the chat history.
app.get('/messages', (req, res) => {
  // Send the current list of messages as a JSON array.
  res.json(messages);
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
});

// Make the Express app listen for incoming requests on the specified port.
app.listen(port, () => {
  console.log(`Chat backend listening at http://localhost:${port}`);
});