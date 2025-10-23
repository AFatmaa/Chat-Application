// Get backend WebSocket URL from shared utilities
const backendWsUrl = getBackendUrls().ws;

const socket = new WebSocket(backendWsUrl);

// Sends a message to the WebSocket server with a specific command.
function sendCommand(command, data) {
  const payload = JSON.stringify({ command, ...data });
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
      renderMessages(true);
      break;

    // When a new message is received from any client.
    case 'new-message':
      messages.push(data.message);
      renderMessages(true);
      break;

    // When a like count is updated.
    case 'like-update':
      const msg = messages.find((m) => m.id === data.messageId);
      if (msg) {
        msg.likes = data.likes;
        renderMessages(false);
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
  const result = validateMessageInput();

  // If validation failed, show error and stop
  if (result.error) {
    alert(result.error);
    return;
  }

  // If validation passed, result contains text and username
  sendCommand('send-message', { 
    message: { 
      text: result.text, 
      username: result.username
    } 
  });

  clearInputs();
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