import { io } from 'socket.io-client';

// Determine base URL, assuming backend runs on root of API URL.
const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

const socket = io(socketUrl, {
    autoConnect: false
});

export default socket;
