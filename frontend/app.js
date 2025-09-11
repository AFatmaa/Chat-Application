// Get references to DOM elements
const messagesList = document.getElementById('messagesList');

const backendUrl = 'http://localhost:3000';

// Global array to store messages in the frontend's memory.
let messages = [];

// It clears the existing display and adds each message as a new HTML element.
function renderMessages() {
  messagesList.innerHTML = '';
  messages.forEach(message => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.innerHTML = `
      <span class="message-text">${message.text}</span>
      <span class="message-timestamp">${new Date(message.timestamp).toLocaleDateString()}</span>
    `;
    messagesList.appendChild(messageElement);
  });
  messagesList.scrollTop = messagesList.scrollHeight;
}

// Fetches all messages from the backend API.
// This function is specifically for the initial load of chat history.
async function fetchInitialMessages() {
  try {
    // Send a GET request to the backend to get all messages.
    const response = await fetch(`${backendUrl}/messages`);

    // Check if the network request was successful.
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const fetchedMessages = await response.json();

    messages = fetchedMessages;

    renderMessages();

  } catch (error) {
    console.error('Error loading initial chat messages:', error);
    messagesList.innerHTML = '<p style="color: red;">Could not load initial chat history.</p>';
  }
}

function initChatApp() {
  fetchInitialMessages();
}

initChatApp();