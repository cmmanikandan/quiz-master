const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function seed() {
    try {
        console.log('--- Seeding Sample Data ---');

        // 1. Register Staff
        await axios.post(`${API_URL}/auth/register`, {
            name: 'Quiz Master',
            email: 'staff@example.com',
            password: 'password123',
            role: 'staff'
        });
        console.log('✓ Staff account created');

        // 2. Login Staff
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'staff@example.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };
        console.log('✓ Staff logged in');

        // 3. Create Quiz
        const quizRes = await axios.post(`${API_URL}/quiz/create`, {
            title: 'Fullstack JS Challenge',
            description: 'Test your knowledge on React, Node, and more!',
            answer_mode: 'after_submit',
            timer: 300,
            show_explanation: true,
            allow_review: true
        }, authHeader);
        const quizId = quizRes.data.quizId;
        const quizCode = quizRes.data.code;
        console.log(`✓ Quiz created: ${quizRes.data.title} (${quizCode})`);

        // 4. Add Questions
        await axios.post(`${API_URL}/quiz/${quizId}/questions`, {
            questions: [
                {
                    question: 'What does the "virtual DOM" in React primarily improve?',
                    option_a: 'Directly modifying the browser DOM',
                    option_b: 'Performance by minimizing expensive DOM operations',
                    option_c: 'Server-side rendering only',
                    option_d: 'Storage of large datasets',
                    correct_option: 'b',
                    explanation: 'The virtual DOM allows React to calculate the difference between states and update only what is necessary, improving performance.'
                },
                {
                    question: 'Which Node.js module is used for handling file paths?',
                    option_a: 'fs',
                    option_b: 'http',
                    option_c: 'path',
                    option_d: 'os',
                    correct_option: 'c',
                    explanation: 'The path module provides utilities for working with file and directory paths.'
                }
            ]
        }, authHeader);
        console.log('✓ Questions added');

        console.log('\n--- Seed Complete ---');
        console.log('Staff Email: staff@example.com');
        console.log('Password: password123');
        console.log(`Join Code: ${quizCode}`);

    } catch (err) {
        console.error('Seed failed:', err.response?.data || err.message);
    }
}

seed();
