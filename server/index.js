const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const attemptRoutes = require('./routes/attempt');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"]
    }
});

// Security & Optimization Middleware
app.use(helmet({ crossOriginResourcePolicy: false })); // Basic security headers
app.use(compression()); // Gzip compression
app.use(morgan('combined')); // Production logging

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Basic middleware
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// Routes
app.get('/api/status', async (req, res) => {
    try {
        const pool = require('./config/db');
        await pool.query('SELECT 1');
        res.json({ status: 'Backend & DB Online', timestamp: new Date() });
    } catch (err) {
        res.status(500).json({ status: 'Error', message: err.message });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/attempt', attemptRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

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
