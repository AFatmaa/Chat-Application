// Get backend URL from shared utilities
const backendUrl = getBackendUrls().http;

// Starts a single long-polling request to the backend for new messages.
async function startLongPolling() {

  // Use the timestamp of the last message, or current time if no messages exist
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
      let hasNewMessage = false;

      newMessages.forEach(data => {
        // If it's a like update, find the matching message and update its like count
        if (data.command === 'like-update') {
          const likedMsg = messages.find(msg => msg.id === data.messageId);
          if (likedMsg) {
            likedMsg.likes = data.likes;
          }
        } else if (data.command === 'new-message') {
          // Handle new message from broadcast
          if (!messages.some(msg => msg.id === data.message.id)) {
            messages.push(data.message);
            hasNewMessage = true; // Mark that we have a new message
          }
        } else if (data.id) {
          // Handle direct message object (from initial load or when no 'since' param)
          if (!messages.some(msg => msg.id === data.id)) {
            messages.push(data);
            hasNewMessage = true; // Mark that we have a new message
          }
        }
      });
      // Only scroll to bottom if we added a new message
      renderMessages(hasNewMessage);
    }
  } catch (error) {
    console.error('[Frontend Error] Long-polling request failed:', error.message);
  } finally {
    // Use smart delay: if no messages yet, wait longer to reduce unnecessary requests
    const delay = messages.length > 0 ? 100 : 2000;
    setTimeout(startLongPolling, delay);
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
    renderMessages(true);

  } catch (error) {
    console.error('Error loading initial chat messages:', error);
    if (messagesList) {
      messagesList.innerHTML = '<p style="color: red;">Could not load initial chat history.</p>';
    }
  }
}

// Sends a new message to the backend via a POST request.
async function sendMessages() {
  const result = validateMessageInput();

  // If validation failed, show error and stop
  if (result.error) {
    alert(result.error);
    return;
  }

  // If validation passed, result contains text and username
  try {
    // Send a POST request to the backend's /messages endpoint.
    const response = await fetch(`${backendUrl}/messages`, {
      method: 'POST', // Specify the HTTP method as POST.
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        text: result.text, 
        username: result.username 
      })
    });

    if (response.ok) {
      clearInputs();
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

// Handles like button clicks
async function handleLike(messageId) {
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

    // Update local state immediately for better UX
    const likedMessage = messages.find(msg => msg.id === messageId);
    if (likedMessage) {
      likedMessage.likes = (likedMessage.likes || 0) + 1;
      renderMessages(false);
    }
  } catch (error) {
    console.error('Error liking message:', error);
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
    handleLike(messageId);
  }
})

async function initChatApp() {
  await fetchInitialMessages();
  startLongPolling();
}

initChatApp();