import { pool } from './pool.js';
async function run() {
    try {
        console.log("Adding is_deleted column...");
        await pool.query('ALTER TABLE coffeepos.products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;');
        console.log("Successfully added is_deleted column!");
    }
    catch (err) {
        console.error("Error modifying database:", err);
    }
    finally {
        process.exit(0);
    }
}
run();
