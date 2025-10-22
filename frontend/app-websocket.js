// Get references to DOM elements
const messagesList = document.getElementById('messagesList');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// Automatically switches between local and deployed backend URLs based on the hostname.
let backendWsUrl;
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  backendWsUrl = 'ws://localhost:3000';
  console.log('WebSocket: Running in local mode. Using local backend WebSocket.');
} else {
  backendWsUrl = 'wss://afatmaa-my-chat-app-backend.hosting.codeyourfuture.io';
  console.log('WebSocket: Running in deployed mode. Using live backend WebSocket.');
}

const socket = new WebSocket(backendWsUrl);

// Store all messages locally in the browser.
let messages = [];

// It clears the existing display and adds each message as a new HTML element.
function renderMessages() {
  messagesList.innerHTML = '';
  messages.forEach(message => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    // Create a span for the message text and use textContent for safety.
    const messageTextSpan = document.createElement('span');
    messageTextSpan.classList.add('message-text');
    messageTextSpan.textContent = message.text;

    // Create a span for the timestamp and use textContent for safety.
    const messageTimestampSpan = document.createElement('span');
    messageTimestampSpan.classList.add('message-timestamp');
    messageTimestampSpan.textContent = new Date(message.timestamp).toLocaleString("en-GB", {
      day: "2-digit", 
      month: "short", 
      hour: "2-digit", 
      minute: "2-digit"
    });

    const likeButton = document.createElement('button');
    likeButton.classList.add('like-btn');
    likeButton.dataset.id = message.id;
    likeButton.textContent = `❤️ ${message.likes || 0}`;

    messageElement.appendChild(messageTextSpan);
    messageElement.appendChild(messageTimestampSpan);
    messageElement.appendChild(likeButton);

    messagesList.appendChild(messageElement);
  });
  messagesList.scrollTop = messagesList.scrollHeight;
}

//Sends a message to the WebSocket server with a specific command.
function sendCommand(command, data) {
  const payload = JSON.stringify({ command, ...data });
  console.log("Payload before stringify:", { command, ...data });
  console.log("Payload JSON string:", payload);
  socket.send(payload);
}

// When the WebSocket connection is successfully opened.
socket.onopen = () => {
  console.log('Connected to WebSocket server');
};

// When the WebSocket receives a message from the server.
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.command) {
    // When the server sends the full chat history.
    case 'initial-messages':
      messages = data.messages;
      renderMessages();
      break;

    // When a new message is received from any client.
    case 'new-message':
      messages.push(data.message);
      renderMessages();
      break;

    // When a like count is updated.
    case 'like-update':
      const msg = messages.find((m) => m.id === data.messageId);
      if (msg) {
        msg.likes = data.likes;
        renderMessages();
      }
      break;

    default:
      console.warn('Unknown command received:', data.command);
  }
};

// When the WebSocket connection closes.
socket.onclose = () => {
  console.warn('WebSocket connection closed. Try refreshing the page.');
};

// When an error occurs in the WebSocket.
socket.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// Sends a new chat message from the input box.
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  sendCommand('send-message', { message: { text } });
  messageInput.value = "";
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Handles clicks on any "like" button inside the message list.
messagesList.addEventListener('click', (e) => {
  if (e.target.classList.contains('like-btn')) {
    const messageId = Number(e.target.dataset.id);
    sendCommand('like-message', { messageId });
  }
});