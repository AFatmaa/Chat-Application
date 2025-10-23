// Get references to DOM elements
const messagesList = document.getElementById('messagesList');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const usernameInput = document.getElementById('usernameInput');

// Global array to store messages in the frontend's memory
let messages = [];

// Renders all messages to the DOM.
// It clears the existing display and adds each message as a new HTML element.
function renderMessages(scrollToBottom = false) {
  messagesList.innerHTML = '';
  
  messages.forEach(message => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('message-username');
    usernameSpan.textContent = `${message.username}: `;

    // Message text span, use textContent for security
    const messageTextSpan = document.createElement('span');
    messageTextSpan.classList.add('message-text');
    messageTextSpan.textContent = message.text;

    // Timestamp span, use textContent for security
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

    messageElement.appendChild(usernameSpan);
    messageElement.appendChild(messageTextSpan);
    
    const bottom = document.createElement('div');
    bottom.classList.add('message-bottom');
    bottom.appendChild(messageTimestampSpan);
    bottom.appendChild(likeButton);
    messageElement.appendChild(bottom);

    messagesList.appendChild(messageElement);
  });
  
  // Only auto-scroll if explicitly requested (for new messages)
  if (scrollToBottom) {
    messagesList.scrollTop = messagesList.scrollHeight;
  }
}

// Validates message input before sending.
function validateMessageInput() {
  const text = messageInput.value.trim();
  const username = usernameInput.value.trim();

  if (text === '') {
    return { error: 'Please enter your message!' };
  }
  if (username === '') {
    return { error: 'Please enter your name!' };
  }

  return { text, username };
}

// Clears input fields after successful message send.
function clearInputs() {
  messageInput.value = '';
  usernameInput.value = '';
}

// Determines the correct backend URL based on environment.
// Returns object with { http: string, ws: string }
function getBackendUrls() {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocal) {
    console.log('Running in local mode. Using local backend.');
    return {
      http: 'http://localhost:3000',
      ws: 'ws://localhost:3000'
    };
  } else {
    console.log('Running in deployed mode. Using live backend.');
    return {
      http: 'https://afatmaa-my-chat-app-backend.hosting.codeyourfuture.io',
      ws: 'wss://afatmaa-my-chat-app-backend.hosting.codeyourfuture.io'
    };
  }
}