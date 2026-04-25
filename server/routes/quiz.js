const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, checkRole } = require('../middleware/auth');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });

// Get Public Quizzes (Discovery) - Filter out Live/Scheduled
router.get('/public', async (req, res) => {
    const { category, search } = req.query;
    try {
        let query = `
            SELECT q.*, u.name as creator 
            FROM quizzes q 
            LEFT JOIN users u ON q.created_by = u.id 
            WHERE q.is_public = TRUE AND q.quiz_type = 'async'`;
        let params = [];

        if (category && category !== 'All') {
            query += ' AND q.category = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND (q.title LIKE ? OR q.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY q.created_at DESC LIMIT 20';

        const [quizzes] = await pool.execute(query, params);
        res.json(quizzes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Quiz (Staff/Admin)
router.post('/create', auth, checkRole(['staff', 'admin']), async (req, res) => {
    const { title, description, answer_mode, timer, show_explanation, allow_review, is_team, shuffle_questions, shuffle_options, negative_marking, require_details } = req.body;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        const [result] = await pool.execute(
            'INSERT INTO quizzes (title, description, code, answer_mode, timer, show_explanation, allow_review, is_team, shuffle_questions, shuffle_options, negative_marking, require_details, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, code, answer_mode, timer || 0, show_explanation ? 1 : 0, allow_review ? 1 : 0, is_team ? 1 : 0, shuffle_questions ? 1 : 0, shuffle_options ? 1 : 0, negative_marking || 0, require_details ? 1 : 0, req.user.id]
        );
        res.status(201).json({ message: "Quiz created", quizId: result.insertId, code });
    } catch (err) {
        console.error("Quiz Create Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get Quiz by Code
router.get('/join/:code', auth, async (req, res) => {
    try {
        const [quizzes] = await pool.execute('SELECT * FROM quizzes WHERE code = ?', [req.params.code]);
        if (quizzes.length === 0) return res.status(404).json({ message: "Quiz not found" });

        const quiz = quizzes[0];

        // Check if user is blocked
        const [attempts] = await pool.execute('SELECT status FROM attempts WHERE quiz_id = ? AND user_id = ? ORDER BY started_at DESC LIMIT 1', [quiz.id, req.user.id]);
        if (attempts.length > 0 && attempts[0].status === 'blocked') {
            return res.status(403).json({ message: "You are blocked from this assessment due to security violations." });
        }

        const [questions] = await pool.execute('SELECT id, question, option_a, option_b, option_c, option_d, type FROM questions WHERE quiz_id = ?', [quiz.id]);

        res.json({ quiz, questions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Get Quiz Details for Editing (Staff)
router.get('/:id/edit-details', auth, checkRole(['staff', 'admin']), async (req, res) => {
    try {
        const [quizzes] = await pool.execute('SELECT * FROM quizzes WHERE id = ?', [req.params.id]);
        const [questions] = await pool.execute('SELECT * FROM questions WHERE quiz_id = ?', [req.params.id]);
        const quiz = quizzes[0];
        if (quiz) quiz.total_questions = questions.length;
        res.json({ quiz, questions });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.post('/:id/questions', auth, checkRole(['staff', 'admin']), async (req, res) => {
    const { questions } = req.body; // array of objects
    const quizId = req.params.id;
    try {
        for (let q of questions) {
            await pool.execute(
                'INSERT INTO questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_option, explanation, type, points, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [quizId, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.explanation, q.type || 'mcq', q.points || 1, q.image_url || null]
            );
        }
        res.json({ message: "Questions added successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Single Question Add
router.post('/:id/add-question', auth, checkRole(['staff', 'admin']), async (req, res) => {
    const { question, option_a, option_b, option_c, option_d, correct_option, explanation, type, points, image_url } = req.body;
    const quizId = req.params.id;
    try {
        await pool.execute(
            "INSERT INTO questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_option, explanation, type, points, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [quizId, question, option_a, option_b, option_c, option_d, correct_option, explanation, type || 'mcq', points || 1, image_url || null]
        );
        res.json({ message: "Question added successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// CSV Upload
router.post('/:id/upload-csv', auth, checkRole(['staff', 'admin']), upload.single('file'), async (req, res) => {
    const quizId = req.params.id;
    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv({
            mapHeaders: ({ header }) => header.trim().toLowerCase()
        }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                if (results.length === 0) throw new Error("CSV file is empty or headers are incorrect");

                for (let q of results) {
                    const questionText = q.question || q.text || q.q || q['question text'] || q.title || 'New Question';
                    const optA = q.option_a || q.a || q.option1 || '';
                    const optB = q.option_b || q.b || q.option2 || '';
                    const optC = q.option_c || q.c || q.option3 || '';
                    const optD = q.option_d || q.d || q.option4 || '';
                    const correctChoice = q.correct_answer || q.correct_option || q.answer || q.correct || 'a';

                    await pool.execute(
                        'INSERT INTO questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_option, explanation, type, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [
                            quizId,
                            questionText,
                            optA,
                            optB,
                            optC,
                            optD,
                            correctChoice.toString().toLowerCase(),
                            q.explanation || '',
                            q.type || 'mcq',
                            q.points || 1
                        ]
                    );
                }
                if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                res.json({ message: "CSV processed successfully" });
            } catch (err) {
                console.error("CSV Upload Error:", err);
                res.status(500).json({ message: "Upload failed: " + err.message });
            }
        });
});

// Get Staff Quizzes
router.get('/my-quizzes', auth, checkRole(['staff', 'admin']), async (req, res) => {
    try {
        const [quizzes] = await pool.execute('SELECT * FROM quizzes WHERE created_by = ?', [req.user.id]);
        res.json(quizzes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Delete Quiz (Owner Only)
router.delete('/:id', auth, checkRole(['staff', 'admin']), async (req, res) => {
    try {
        await pool.execute('DELETE FROM quizzes WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
        res.json({ message: "Quiz deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin Delete Quiz (Any)
router.delete('/:id/admin', auth, checkRole(['admin']), async (req, res) => {
    try {
        await pool.execute('DELETE FROM quizzes WHERE id = ?', [req.params.id]);
        res.json({ message: "Quiz deleted by admin" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get All Attempts for a Quiz (Staff Only)
router.get('/:id/attempts', auth, checkRole(['staff', 'admin']), async (req, res) => {
    try {
        const [attempts] = await pool.execute(`
            SELECT a.*, u.name, u.email 
            FROM attempts a 
            JOIN users u ON a.user_id = u.id 
            WHERE a.quiz_id = ? 
            ORDER BY a.submitted_at DESC`,
            [req.params.id]
        );
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.put('/:id', auth, checkRole(['staff', 'admin']), async (req, res) => {
    const { title, description, answer_mode, timer, show_explanation, allow_review, is_team, shuffle_questions, shuffle_options, negative_marking, is_public, require_details, quiz_type, scheduled_start, scheduled_end } = req.body;
    try {
        await pool.execute(
            'UPDATE quizzes SET title = ?, description = ?, answer_mode = ?, timer = ?, show_explanation = ?, allow_review = ?, is_team = ?, shuffle_questions = ?, shuffle_options = ?, negative_marking = ?, is_public = ?, require_details = ?, quiz_type = ?, scheduled_start = ?, scheduled_end = ? WHERE id = ?',
            [title, description, answer_mode, timer, show_explanation, allow_review, is_team, shuffle_questions, shuffle_options, negative_marking, is_public || false, require_details || false, quiz_type || 'async', scheduled_start || null, scheduled_end || null, req.params.id]
        );
        res.json({ message: 'Quiz settings updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.put('/question/:id', auth, checkRole(['staff', 'admin']), async (req, res) => {
    const { question, option_a, option_b, option_c, option_d, correct_option, explanation, type, points, image_url } = req.body;
    try {
        await pool.execute(
            'UPDATE questions SET question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_option = ?, explanation = ?, type = ?, points = ?, image_url = ? WHERE id = ?',
            [question, option_a, option_b, option_c, option_d, correct_option, explanation, type, points, image_url, req.params.id]
        );
        res.json({ message: 'Question updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete Single Question
router.delete('/question/:id', auth, checkRole(['staff', 'admin']), async (req, res) => {
    try {
        await pool.execute('DELETE FROM questions WHERE id = ?', [req.params.id]);
        res.json({ message: 'Question deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Self-block attempt on cheat detection
router.post('/block-my-attempt/:code', auth, async (req, res) => {
    try {
        const [quizzes] = await pool.execute('SELECT id FROM quizzes WHERE code = ?', [req.params.code]);
        if (quizzes.length === 0) return res.status(404).json({ message: "Quiz not found" });

        await pool.execute(
            'UPDATE attempts SET status = "blocked" WHERE user_id = ? AND quiz_id = ? AND status = "active"',
            [req.user.id, quizzes[0].id]
        );
        res.json({ message: "Attempt blocked" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Start Live Quiz
router.post('/:id/start-live', auth, checkRole(['staff', 'admin']), async (req, res) => {
    try {
        await pool.execute('UPDATE quizzes SET is_live = TRUE WHERE id = ?', [req.params.id]);
        res.json({ message: "Quiz started live" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Unblock Student Attempt
router.post('/unblock/:attemptId', auth, checkRole(['staff', 'admin']), async (req, res) => {
    try {
        await pool.execute('UPDATE attempts SET status = "active", tab_switches = 0 WHERE id = ?', [req.params.attemptId]);
        res.json({ message: "Student unblocked successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Bulk Invite Students via CSV
router.post('/:id/invite', auth, checkRole(['staff', 'admin']), upload.single('csv'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const emails = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
            const email = Object.values(row)[0];
            if (email && email.includes('@')) emails.push(email);
        })
        .on('end', async () => {
            try {
                // In a production app, you would use Nodemailer here to send actual emails.
                // We'll log them to the console for this demonstration.
                console.log(`Sending invites for Quiz ID ${req.params.id} to:`, emails);

                // Cleanup
                fs.unlinkSync(req.file.path);
                res.json({ message: `Invitations queued for ${emails.length} students` });
            } catch (err) {
                res.status(500).json({ message: err.message });
            }
        });
});

module.exports = router;
