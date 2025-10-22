// Get references to DOM elements
const messagesList = document.getElementById('messagesList');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

const backendUrl = 'https://afatmaa-my-chat-app-backend.hosting.codeyourfuture.io';

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
      <button class="like-btn" data-id="${message.id}">❤️ ${message.likes || 0}</button>
    `;
    messagesList.appendChild(messageElement);
  });
  messagesList.scrollTop = messagesList.scrollHeight;
}

// Starts a single long-polling request to the backend for new messages.
async function startLongPolling() {

  const lastMessageTime = messages.length > 0 ? messages[messages.length - 1].timestamp : null;
  const queryString = lastMessageTime ? `?since=${lastMessageTime}` : '';
  const url = `${backendUrl}/messages${queryString}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const newMessages = await response.json();

    // If new messages are received, add them to our global 'messages' array and rerender.
    if (newMessages.length > 0) {

      newMessages.forEach(newMsg => {
        // Only add if message with same id does not already exist
        if (!messages.some(msg => msg.id === newMsg.id)) {
          messages.push(newMsg);
        }
      });
      renderMessages();
    }
  } catch (error) {
    console.error('[Frontend Error] Long-polling request failed:', error.message);
  } finally {
    // Wait a very short moment and the start the next long-polling request.
    setTimeout(startLongPolling, 1000);
  }
  
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
    if (messagesList) {
      messagesList.innerHTML = '<p style="color: red;">Could not load initial chat history.</p>';
    }
  }
}

// Sends a new message to the backend via a POST request.
async function sendMessages() {
  const text = messageInput.value.trim();

  if (text === '') {
    return;
  }

  try {
    // Send a POST request to the backend's /messages endpoint.
    const response = await fetch(`${backendUrl}/messages`, {
      method: 'POST', // Specify the HTTP method as POST.
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: text })
    });

    if (response.ok) {
      messageInput.value = '';
    } else {
      const errorData = await response.json();
      console.error('Error sending message:', errorData.error);
      alert(`Failed to send message: ${errorData.error}`);
    }

  } catch (error) {
    console.error('Network error occured while sending message:', error);
    alert('A network error occurred while sending the message.')
  }
  
}

sendButton.addEventListener('click', sendMessages);

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessages();
  }
});

messagesList.addEventListener('click', async (e) => {
  if (e.target.classList.contains('like-btn')) {
    const messageId = Number(e.target.dataset.id);

    try {
      const response = await fetch(`${backendUrl}/messages/${messageId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const likedMessage = messages.find(msg => msg.id === messageId);
      if (likedMessage) {
        likedMessage.likes = (likedMessage.likes || 0) + 1;
        renderMessages();
      }
    } catch (error) {
      console.error('Error liking message:', error);
    }
  }
})

function initChatApp() {
  fetchInitialMessages();
  startLongPolling();
}

initChatApp();