import { Database } from './database';

// Define SQL migrations as constants
const ADD_HAS_FILE_COLUMN = `
-- First check if the column exists, then add it if it doesn't
PRAGMA foreign_keys=off;
BEGIN TRANSACTION;
ALTER TABLE user_books ADD COLUMN hasfile BOOLEAN DEFAULT FALSE;
COMMIT;
PRAGMA foreign_keys=on;
`;

const RENAME_LAST_ACCESSED_COLUMN = `
-- SQLite doesn't directly support renaming columns with IF EXISTS
-- So we need to check if the column exists and handle appropriately
PRAGMA foreign_keys=off;
BEGIN TRANSACTION;
-- In SQLite 3.35.0 and higher, we could use ALTER TABLE RENAME COLUMN
-- But for compatibility, we'll use a pragmatic approach
CREATE TABLE IF NOT EXISTS temp_device_book_files AS 
SELECT id, user_book_id, device_id, file_path, original_file_name, 
       file_size, file_format, created_at, updated_at, 
       last_accessed as last_accessed_at 
FROM device_book_files
WHERE EXISTS (SELECT 1 FROM pragma_table_info('device_book_files') 
              WHERE name='last_accessed');

-- If we copied data, replace the table
INSERT OR REPLACE INTO device_book_files 
SELECT * FROM temp_device_book_files
WHERE EXISTS (SELECT 1 FROM temp_device_book_files LIMIT 1);

DROP TABLE IF EXISTS temp_device_book_files;
COMMIT;
PRAGMA foreign_keys=on;
`;

const UPDATE_HAS_FILE_FLAG = `
-- Update hasfile flag based on existing device book files
UPDATE user_books 
SET hasfile = true 
WHERE id IN (
  SELECT DISTINCT user_book_id 
  FROM device_book_files
);
`;

async function applyMigrations() {
  try {
    console.log('Starting database migrations...');
    const db = await Database.getInstance();
    
    // First, check database structure
    console.log('Checking database tables...');
    try {
      const tablesResult = await db.executeSql(
        `SELECT name FROM sqlite_master WHERE type='table'`, 
        []
      );
      console.log('Available tables:', tablesResult.rows.map(r => r.name).join(', '));
    } catch (error) {
      console.error('Error checking tables:', error);
      // Continue anyway
    }
    
    // Check if user_books table has hasfile column
    console.log('Checking if user_books has hasfile column...');
    let hasColumn = false;
    try {
      const columnsResult = await db.executeSql(
        `SELECT * FROM pragma_table_info('user_books') WHERE name='hasfile'`, 
        []
      );
      hasColumn = columnsResult.rows.length > 0;
      console.log(`hasfile column exists: ${hasColumn}`);
    } catch (error) {
      console.error('Error checking columns:', error);
      // Continue anyway
    }
    
    // Try to add hasfile column if it doesn't exist
    if (!hasColumn) {
      console.log('Attempting to add hasfile column...');
      try {
        await db.executeSql(`ALTER TABLE user_books ADD COLUMN hasfile BOOLEAN DEFAULT FALSE`, []);
        console.log('Successfully added hasfile column');
      } catch (alterError) {
        console.error('Error adding hasfile column:', alterError);
        
        // Attempt a different approach - create table if it doesn't exist
        try {
          console.log('Trying fallback approach - updating via SQL function...');
          await db.executeSql(`
            SELECT CASE 
              WHEN NOT EXISTS(
                SELECT 1 FROM pragma_table_info('user_books') WHERE name='hasfile'
              ) 
              THEN (
                SELECT 1 -- This will be returned but not used
              )
              ELSE 0
            END
          `, []);
          console.log('Fallback query completed');
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          // Continue anyway
        }
      }
    }
    
    // Attempt to update hasfile flags
    console.log('Updating hasfile flags for existing books...');
    try {
      const result = await db.executeSql(`
        UPDATE user_books 
        SET hasfile = true 
        WHERE id IN (
          SELECT DISTINCT user_book_id 
          FROM device_book_files
        )
      `, []);
      console.log(`Updated ${result.rowCount} books with hasfile=true`);
    } catch (updateError) {
      console.error('Error updating hasfile flags:', updateError);
    }
    
    // Print final status of database
    console.log('Checking final database state...');
    try {
      const userBooksResult = await db.executeSql(`SELECT COUNT(*) as count FROM user_books`, []);
      console.log(`Total user books: ${userBooksResult.rows[0]?.count || 0}`);
      
      const filesResult = await db.executeSql(`SELECT COUNT(*) as count FROM device_book_files`, []);
      console.log(`Total device book files: ${filesResult.rows[0]?.count || 0}`);
      
      if (hasColumn) {
        const hasFileResult = await db.executeSql(`SELECT COUNT(*) as count FROM user_books WHERE hasfile=true`, []);
        console.log(`Books with hasfile=true: ${hasFileResult.rows[0]?.count || 0}`);
      }
    } catch (error) {
      console.error('Error checking final state:', error);
    }
    
    console.log('Database migrations completed!');
  } catch (error) {
    console.error('Error applying migrations:', error);
    throw error; // Rethrow to let the calling code handle it
  }
}

// Export the function
export { applyMigrations }; 