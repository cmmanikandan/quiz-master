const pool = require('./config/db');

async function fix() {
    try {
        // Add pass_percentage if missing
        const [cols] = await pool.execute('SHOW COLUMNS FROM quizzes LIKE "pass_percentage"');
        if (cols.length === 0) {
            await pool.execute('ALTER TABLE quizzes ADD COLUMN pass_percentage FLOAT DEFAULT 50');
            console.log('✅ Added pass_percentage column to quizzes');
        } else {
            console.log('✅ pass_percentage already exists');
        }

        // Add quiz_type if missing
        const [qtCols] = await pool.execute('SHOW COLUMNS FROM quizzes LIKE "quiz_type"');
        if (qtCols.length === 0) {
            await pool.execute('ALTER TABLE quizzes ADD COLUMN quiz_type VARCHAR(20) DEFAULT "async"');
            console.log('✅ Added quiz_type column');
        }

        // Show attempts columns
        const [aCols] = await pool.execute('SHOW COLUMNS FROM attempts');
        console.log('Attempts columns:', aCols.map(c => c.Field).join(', '));

        // Add student_name etc if missing
        const aColNames = aCols.map(c => c.Field);
        if (!aColNames.includes('student_name')) {
            await pool.execute('ALTER TABLE attempts ADD COLUMN student_name VARCHAR(255) DEFAULT NULL');
            await pool.execute('ALTER TABLE attempts ADD COLUMN reg_no VARCHAR(100) DEFAULT NULL');
            await pool.execute('ALTER TABLE attempts ADD COLUMN dept VARCHAR(100) DEFAULT NULL');
            await pool.execute('ALTER TABLE attempts ADD COLUMN year VARCHAR(20) DEFAULT NULL');
            console.log('✅ Added student detail columns to attempts');
        }

        if (!aColNames.includes('responses')) {
            await pool.execute('ALTER TABLE attempts ADD COLUMN responses TEXT DEFAULT NULL');
            console.log('✅ Added responses column to attempts');
        }

        console.log('✅ DB fix complete');
        process.exit(0);
    } catch(e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
}
fix();
