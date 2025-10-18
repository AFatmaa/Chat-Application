# Chat Application

A simple real-time chat application with two different ways to communicate: **Long Polling** and **WebSocket**.

## What is this?

This is a chat app where people can send messages and like them. It shows two different ways computers can talk to each other in real-time.

## Project Structure

```
Chat Application/
├── backend/        # Server code
│   ├── server.js   # Main server file
│   └── package.json
│   └── package-lock.json
└── frontend/       # Client code
    ├── index.html              # Landing page
    ├── index-polling.html      # Long polling chat
    ├── index-websocket.html    # WebSocket chat
    ├── app-polling.js          # Long polling code
    ├── app-websocket.js        # WebSocket code
    └── style.css               # Styles
```

## Features

- ✉️ Send text messages
- ❤️ Like messages
- 🔄 Two communication methods:
  - **Long Polling**: Traditional HTTP requests
  - **WebSocket**: Real-time connection

## How to Run

### Backend (Server)

1. Go to the backend folder:
```
cd backend
```

2. Install packages:
```
npm install
```

3. Start the server:
```
node server.js
```

The server will run on `http://localhost:3000`

### Frontend (Client)

1. Open the frontend folder
2. Open `index.html` in your web browser
3. Choose Long Polling or WebSocket
4. Start chatting!

## Live Demo

You can try the live version here:

- **Backend Server**: [https://afatmaa-my-chat-app-backend.hosting.codeyourfuture.io/](https://afatmaa-my-chat-app-backend.hosting.codeyourfuture.io/)
- **Frontend App**: [https://afatmaa-my-chat-app-frontend.hosting.codeyourfuture.io/](https://afatmaa-my-chat-app-frontend.hosting.codeyourfuture.io/)

## Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web server framework
- **WebSocket (ws)** - Real-time communication
- **CORS** - Allow cross-origin requests

### Frontend
- **HTML** - Page structure
- **CSS** - Styling
- **JavaScript** - Application logic

## What is Long Polling?

Long polling is when the client asks the server "Do you have new messages?" and waits. If there are no new messages, the server keeps the connection open until a message arrives or time runs out.

## What is WebSocket?

WebSocket is like a phone call between client and server. Once connected, both can send messages anytime without asking permission first. This is faster and more efficient.

## API Endpoints

### GET /messages
- Get all messages or wait for new ones
- Query parameter: `since` (timestamp)

### POST /messages
- Send a new message
- Body: `{ "text": "your message" }`

## WebSocket Commands

### Client to Server
- `send-message`: Send a new chat message
- `like-message`: Like a message

### Server to Client
- `initial-messages`: All existing messages
- `new-message`: A new message arrived
- `like-update`: Someone liked a message

## License

Free and open source - Created as part of Code Your Future training program