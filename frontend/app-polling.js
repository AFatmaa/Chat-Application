// Get references to DOM elements
const messagesList = document.getElementById('messagesList');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const usernameInput = document.getElementById('usernameInput');

// Automatically switches between local and deployed backend URLs based on the hostname.
let backendUrl;
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  backendUrl = 'http://localhost:3000';
  console.log('Long Polling: Running in local mode. Using local backend.');
} else {
  backendUrl = 'https://afatmaa-my-chat-app-backend.hosting.codeyourfuture.io';
  console.log('Long Polling: Running in deployed mode. Using live backend.');
}

// Global array to store messages in the frontend's memory.
let messages = [];

// It clears the existing display and adds each message as a new HTML element.
function renderMessages() {
  messagesList.innerHTML = '';
  messages.forEach(message => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('message-username');
    usernameSpan.textContent = `${message.username}: `;

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

    messageElement.appendChild(usernameSpan);
    messageElement.appendChild(messageTextSpan);
    const bottom = document.createElement('div');
    bottom.classList.add('message-bottom');
    bottom.appendChild(messageTimestampSpan);
    bottom.appendChild(likeButton);
    messageElement.appendChild(bottom);

    messagesList.appendChild(messageElement);
  });
  messagesList.scrollTop = messagesList.scrollHeight;
}

// Starts a single long-polling request to the backend for new messages.
async function startLongPolling(lastSince = null) {

  // Prevent fetching the same first message again when polling starts.
  const lastMessageTime = lastSince || messages.length > 0 ? messages[messages.length - 1].timestamp : null;
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
        // If it's a like update, find the matching message and update its like count
        if (newMsg.command === 'like-update') {
          const likedMsg = messages.find(msg => msg.id === newMsg.messageId);
          if (likedMsg) {
            likedMsg.likes = newMsg.likes;
          }
        } 
        // Otherwise, add the new message if it doesn't already exist
        else if (newMsg.id && !messages.some(msg => msg.id === newMsg.id)) {
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
  const username = usernameInput.value.trim();

  if (text === '') {
    alert('Please enter your message!');
    return;
  }
  if (username === '') {
    alert('Please enter your name!');
    return;
  }

  try {
    // Send a POST request to the backend's /messages endpoint.
    const response = await fetch(`${backendUrl}/messages`, {
      method: 'POST', // Specify the HTTP method as POST.
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: text, username: username })
    });

    if (response.ok) {
      messageInput.value = '';
      usernameInput.value = '';
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

// Load existing messages first, then start long-polling from the last message timestamp
// to avoid duplicate updates (especially the first like or message).
async function initChatApp() {
  await fetchInitialMessages();

  const lastMessageTime = messages.length > 0 ? messages[messages.length - 1].timestamp : null;
  startLongPolling(lastMessageTime);
}

initChatApp();