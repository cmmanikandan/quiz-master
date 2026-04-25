const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, checkRole } = require('../middleware/auth');

// Check Current Attempt Status
router.get('/status/:code', auth, async (req, res) => {
    try {
        const [quiz] = await pool.execute('SELECT id FROM quizzes WHERE code = ?', [req.params.code]);
        if (quiz.length === 0) return res.status(404).json({ message: "Quiz not found" });

        const [attempt] = await pool.execute(
            "SELECT * FROM attempts WHERE user_id = ? AND quiz_id = ? AND (status = 'ongoing' OR status = 'blocked') ORDER BY submitted_at DESC LIMIT 1",
            [req.user.id, quiz[0].id]
        );

        res.json({
            hasActive: attempt.length > 0,
            status: attempt.length > 0 ? attempt[0].status : null,
            attempt: attempt.length > 0 ? attempt[0] : null
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Save Partial Progress
router.post('/save-progress/:code', auth, async (req, res) => {
    try {
        const { answers, tab_switches } = req.body;
        const [quiz] = await pool.execute('SELECT id FROM quizzes WHERE code = ?', [req.params.code]);
        if (quiz.length === 0) return res.status(404).json({ message: "Quiz not found" });

        const [attempt] = await pool.execute(
            "SELECT id, status FROM attempts WHERE user_id = ? AND quiz_id = ? ORDER BY id DESC LIMIT 1",
            [req.user.id, quiz[0].id]
        );

        // Don't save progress if already completed
        if (attempt.length > 0 && attempt[0].status === 'completed') {
            return res.json({ message: "Already completed" });
        }

        if (attempt.length > 0 && attempt[0].status === 'ongoing') {
            await pool.execute(
                'UPDATE attempts SET responses = ?, tab_switches = ? WHERE id = ?',
                [JSON.stringify(answers), tab_switches, attempt[0].id]
            );
        } else {
            await pool.execute(
                "INSERT INTO attempts (user_id, quiz_id, status, responses, tab_switches, started_at) VALUES (?, ?, 'ongoing', ?, ?, ?)",
                [req.user.id, quiz[0].id, JSON.stringify(answers), tab_switches, new Date()]
            );
        }
        res.json({ message: "Progress saved" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
const { calculateScore } = require('../utils/scoring');

// Submit Quiz Session (Final Submission)
router.post('/submit', auth, async (req, res) => {
    const { quiz_id, answers, time_taken, tab_switches, started_at, finished_at, student_details } = req.body;

    try {
        // 1. Idempotency Check: Prevent duplicate submissions
        const [alreadySubmitted] = await pool.execute(
            "SELECT id, score, student_name FROM attempts WHERE user_id = ? AND quiz_id = ? AND status = 'completed' LIMIT 1",
            [req.user.id, quiz_id]
        );

        if (alreadySubmitted.length > 0) {
            return res.json({
                success: true,
                message: "Quiz already submitted",
                attemptId: alreadySubmitted[0].id,
                score: alreadySubmitted[0].score,
                user_name: alreadySubmitted[0].student_name || req.user.name,
                isDuplicate: true
            });
        }

        // 2. Fetch existing attempt or find the one to update
        const [existing] = await pool.execute(
            "SELECT id FROM attempts WHERE user_id = ? AND quiz_id = ? AND status != 'completed' LIMIT 1",
            [req.user.id, quiz_id]
        );

        let attemptId;
        if (existing.length > 0) {
            attemptId = existing[0].id;
            await pool.execute(
                "UPDATE attempts SET time_taken = ?, tab_switches = ?, status = 'completed', submitted_at = ?, student_name = ?, reg_no = ?, dept = ?, year = ? WHERE id = ?",
                [time_taken, tab_switches || 0, finished_at || new Date(), student_details?.name || null, student_details?.regNo || null, student_details?.dept || null, student_details?.year || null, attemptId]
            );
        } else {
            const [attemptResult] = await pool.execute(
                "INSERT INTO attempts (user_id, quiz_id, time_taken, tab_switches, status, started_at, submitted_at, student_name, reg_no, dept, year) VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?)",
                [req.user.id, quiz_id, time_taken, tab_switches || 0, started_at || new Date(), finished_at || new Date(), student_details?.name || null, student_details?.regNo || null, student_details?.dept || null, student_details?.year || null]
            );
            attemptId = attemptResult.insertId;
        }

        // 3. Robust Scoring Calculation
        const [questions] = await pool.execute('SELECT id, correct_option, points, type FROM questions WHERE quiz_id = ?', [quiz_id]);
        const [quizzes] = await pool.execute('SELECT negative_marking FROM quizzes WHERE id = ?', [quiz_id]);
        const negMarking = quizzes[0]?.negative_marking || 0;

        const { score, reviewedAnswers } = calculateScore(questions, answers, negMarking);

        // 4. Batch Answer Insertion
        // We delete any "ongoing" progress answers to ensure a clean state for final result
        await pool.execute('DELETE FROM answers WHERE attempt_id = ?', [attemptId]);
        
        for (const ansData of reviewedAnswers) {
            try {
                await pool.execute(
                    'INSERT INTO answers (attempt_id, question_id, selected_option, is_correct) VALUES (?, ?, ?, ?)',
                    [attemptId, ansData.question_id, ansData.selected_option, ansData.is_correct ? 1 : 0]
                );
            } catch (err) {
                console.error(`Ans Insert Failed for Q:${ansData.question_id}`, err.message);
            }
        }

        // 5. Update final score
        await pool.execute('UPDATE attempts SET score = ? WHERE id = ?', [score, attemptId]);

        res.json({
            success: true,
            message: "Quiz submitted successfully",
            attemptId,
            score,
            user_name: req.user.name
        });

    } catch (err) {
        console.error("Submit Error:", err);
        res.status(500).json({
            success: false,
            message: "Critical submission error, progress saved locally",
            error: err.message
        });
    }
});

// Public Verification Route (No Auth Required)
router.get('/verify/:id', async (req, res) => {
    try {
        const [results] = await pool.execute(`
            SELECT a.id, a.user_id, a.score, a.submitted_at, a.student_name, u.name as user_name, q.title as quiz_title,
                   (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as total_questions
            FROM attempts a
            JOIN users u ON a.user_id = u.id
            JOIN quizzes q ON a.quiz_id = q.id
            WHERE a.id = ? AND a.status = 'completed'`,
            [req.params.id]
        );

        if (results.length === 0) return res.status(404).json({ message: "Invalid Certificate" });
        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ message: "Verification failed" });
    }
});
// Get Attempt Details (Result Page)
router.get('/result/:id', auth, async (req, res) => {
    try {
        const [attempts] = await pool.execute(`
            SELECT a.*, q.title, q.answer_mode, q.show_explanation, q.pass_percentage, u.name as user_name 
            FROM attempts a 
            JOIN quizzes q ON a.quiz_id = q.id 
            JOIN users u ON a.user_id = u.id 
            WHERE a.id = ? AND a.user_id = ?`,
            [req.params.id, req.user.id]
        );

        if (attempts.length === 0) return res.status(404).json({ message: "Result not found" });

        const [answers] = await pool.execute(`
            SELECT ans.*, qn.question, qn.option_a, qn.option_b, qn.option_c, qn.option_d, qn.correct_option, qn.explanation 
            FROM answers ans 
            JOIN questions qn ON ans.question_id = qn.id 
            WHERE ans.attempt_id = ?`,
            [req.params.id]
        );

        res.json({ attempt: attempts[0], answers });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Leaderboard
router.get('/leaderboard/:quizId', async (req, res) => {
    try {
        const [results] = await pool.execute(`
            SELECT u.name, a.score, a.time_taken, a.submitted_at 
            FROM attempts a 
            JOIN users u ON a.user_id = u.id 
            WHERE a.quiz_id = ? 
            ORDER BY a.score DESC, a.time_taken ASC 
            LIMIT 10`,
            [req.params.quizId]
        );
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Export results as CSV
router.get('/export/:quizId', auth, checkRole(['staff', 'admin']), async (req, res) => {
    try {
        const [results] = await pool.execute(`
            SELECT u.name, a.score, a.time_taken, a.submitted_at as finished_at, a.started_at 
            FROM attempts a 
            JOIN users u ON a.user_id = u.id 
            WHERE a.quiz_id = ? 
            ORDER BY a.score DESC`,
            [req.params.quizId]
        );

        if (results.length === 0) return res.status(404).json({ message: "No data to export" });

        const csvRows = [
            ['Name', 'Score', 'Duration (s)', 'Started At', 'Finished At'],
            ...results.map(r => [
                r.name,
                r.score,
                r.time_taken,
                new Date(r.started_at).toLocaleString(),
                new Date(r.finished_at).toLocaleString()
            ])
        ];

        const csvContent = csvRows.map(row => row.join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=results_quiz_${req.params.quizId}.csv`);
        res.send(csvContent);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get User Stats
router.get('/user-stats', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Total Score (XP) and attempts
        const [xpRes] = await pool.execute(
            'SELECT COALESCE(SUM(score), 0) as totalXP, COUNT(*) as totalAttempts FROM attempts WHERE user_id = ? AND status = "completed"',
            [userId]
        );

        // Certificates - use COALESCE to handle NULL pass_percentage safely
        let certRes = [];
        try {
            const [certs] = await pool.execute(`
                SELECT a.id, a.score, q.title as quizTitle, COALESCE(q.pass_percentage, 50) as pass_percentage,
                    (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as total_questions
                FROM attempts a 
                JOIN quizzes q ON a.quiz_id = q.id 
                WHERE a.user_id = ? AND a.status = 'completed'`,
                [userId]
            );
            certRes = certs.filter(c => c.total_questions > 0 && c.score >= (c.total_questions * c.pass_percentage / 100));
        } catch (certErr) {
            console.error('Cert query error (non-fatal):', certErr.message);
        }

        // Rank calculation
        const [rankResult] = await pool.execute(`
            SELECT COUNT(*) + 1 as user_rank 
            FROM (
                SELECT user_id, SUM(score) as total_xp 
                FROM attempts 
                GROUP BY user_id
            ) as rankings 
            WHERE total_xp > (SELECT COALESCE(SUM(score), 0) FROM attempts WHERE user_id = ?)`,
            [userId]
        );
        const rank = rankResult[0]?.user_rank || 1;

        res.json({
            xp: parseFloat(xpRes[0].totalXP) || 0,
            attempts: parseInt(xpRes[0].totalAttempts) || 0,
            certificates: certRes,
            rank: rank
        });
    } catch (err) {
        console.error('User Stats Error:', err);
        res.status(500).json({ message: 'Internal server error while fetching stats: ' + err.message });
    }
});

// Get User History
router.get('/user-history', auth, async (req, res) => {
    try {
        const [history] = await pool.execute(`
            SELECT a.*, q.title 
            FROM attempts a 
            JOIN quizzes q ON a.quiz_id = q.id 
            WHERE a.user_id = ? 
            ORDER BY a.submitted_at DESC 
            LIMIT 10`,
            [req.user.id]
        );
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Get System Stats
router.get('/system-stats', auth, checkRole(['admin']), async (req, res) => {
    try {
        const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [quizzes] = await pool.execute('SELECT COUNT(*) as count FROM quizzes');
        const [attempts] = await pool.execute('SELECT COUNT(*) as count FROM attempts');
        res.json({ users: users[0].count, quizzes: quizzes[0].count, attempts: attempts[0].count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Get All Users
router.get('/all-users', auth, checkRole(['admin']), async (req, res) => {
    try {
        const [users] = await pool.execute('SELECT id, name, email, role, created_at FROM users');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Get Suspicious Activity
router.get('/suspicious', auth, checkRole(['admin']), async (req, res) => {
    try {
        const [activity] = await pool.execute(`
            SELECT a.*, u.name, q.title 
            FROM attempts a 
            JOIN users u ON a.user_id = u.id 
            JOIN quizzes q ON a.quiz_id = q.id 
            WHERE a.tab_switches > 2 
            ORDER BY a.submitted_at DESC`);
        res.json(activity);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Update User Role
router.put('/user/:id/role', auth, checkRole(['admin']), async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'staff', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
        await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        res.json({ message: 'Role updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Delete User
router.delete('/user/:id', auth, checkRole(['admin']), async (req, res) => {
    try {
        // Prevent deleting the main admin for safety (by email)
        const [user] = await pool.execute('SELECT email FROM users WHERE id = ?', [req.params.id]);
        if (user[0]?.email === 'admin@quizmaster.com') return res.status(403).json({ message: 'Cannot delete super-admin' });

        await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
