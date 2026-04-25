const pool = require('./config/db');

async function migrate() {
    try {
        console.log("Starting migration...");
        // Update status enum
        await pool.execute("ALTER TABLE attempts MODIFY COLUMN status ENUM('active', 'blocked', 'completed', 'ongoing') DEFAULT 'active'");
        
        // Add responses column if it doesn't exist
        const [columns] = await pool.execute("SHOW COLUMNS FROM attempts LIKE 'responses'");
        if (columns.length === 0) {
            await pool.execute("ALTER TABLE attempts ADD COLUMN responses JSON AFTER tab_switches");
            console.log("Added 'responses' column.");
        }
        
        console.log("Migration successful.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit();
    }
}

migrate();
