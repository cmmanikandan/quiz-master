const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const attemptRoutes = require('./routes/attempt');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/attempt', attemptRoutes);

// Socket.io logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_proctor', (quizId) => {
        socket.join(`proctor_${quizId}`);
        console.log(`Staff joined proctoring for quiz: ${quizId}`);
    });

    socket.on('student_update', (data) => {
        // data: { quizId, userId, userName, progress, tabSwitches }
        io.to(`proctor_${data.quizId}`).emit('user_status_update', data);
    });

    socket.on('start_quiz', (data) => {
        // data: { quizId, quizCode }
        console.log(`Live Quiz Started: ${data.quizCode}`);
        io.to(`quiz_${data.quizCode}`).emit('quiz_started');
    });

    socket.on('new_submission', (data) => {
        // Broadcast to quiz room for real-time leaderboard
        io.to(data.quizCode).emit('leaderboard_update', data);
        // Also notify proctor
        io.to(`proctor_${data.quizId}`).emit('student_finished', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
