-- Add hasFile column to user_books table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_books' AND column_name = 'hasFile'
    ) THEN
        ALTER TABLE user_books ADD COLUMN hasFile BOOLEAN DEFAULT FALSE;
    END IF;
END $$; 