# Whisper Wave

Whisper Wave is a real-time chat application built with the MERN (MongoDB, Express.js, React, Node.js) stack. It offers a seamless and interactive messaging experience with advanced features.

![Whisper Wave Demo](https://github.com/user-attachments/assets/bf702e36-9f82-4596-9655-b7c56f57e696)

## Features

- Real-time messaging using Socket.IO
- User authentication with JWT
- Friend request system
- Emoji reactions
- File uploads
- Real-time notifications for new messages and friend requests
- Responsive design for mobile and desktop
- Anonymous `/whisper` flow: no account, get matched with a stranger, chat ephemerally (nothing saved), and mutually like to turn it into a real DM

## Tech Stack

- Frontend: React, TanStack Query, Zustand, React Router
- Backend: Node.js, Express.js
- Database: MongoDB (permanent data), Redis (ephemeral anonymous matching)
- Real-time Communication: Socket.IO
- Authentication: JSON Web Tokens, bcrypt
- File Processing: Jimp, FFmpeg
- Styling: TailwindCSS

## Screenshots

### Chat Interface

![Chat Interface](https://github.com/user-attachments/assets/862127af-7575-4466-8ffa-a8368935e00f)

### Friend Requests

![Friend Requests](https://github.com/user-attachments/assets/4abfb7f5-ea01-445f-8a2b-2e62f03c9a61)

### Notifications

![Notifications](https://github.com/user-attachments/assets/9f6df81e-87e1-4a8f-99e9-b2ef201e88df)

## Installation Guide

### Requirements

- [Nodejs](https://nodejs.org/en/download)
- [Mongodb](https://www.mongodb.com/docs/manual/administration/install-community/)
- Redis — local, or the [Upstash](https://upstash.com) free tier (required for the anonymous `/whisper` flow)

Make sure MongoDB and Redis are running.

### Installation

```shell
git clone https://github.com/An525ish/Whisper-wave.git
cd Whisper-wave
```

Set up environment variables:
Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env`, then fill them in. Beyond MongoDB and the JWT secrets, the anonymous flow needs `REDIS_URL`, `ANON_JWT_SECRET` and (optional) `ANON_TOKEN_TTL_MIN` on the server. `VITE_ANALYTICS_ENDPOINT` on the client is optional — leave it empty to disable funnel analytics.

Now install the dependencies

```shell
cd client
npm install
cd ..
cd server
npm install
```

We are almost done, Now just start the development server.

For Frontend.

```shell
cd client
npm run dev
```

For Backend.

Open another terminal in folder, Also make sure mongodb is running in background.

```shell
cd server
npm run server
```

```
Done! Now open localhost:5173 in your browser.
```

### Tests

```shell
cd server
npm test
```

The Redis integration tests skip automatically when no Redis is reachable.
