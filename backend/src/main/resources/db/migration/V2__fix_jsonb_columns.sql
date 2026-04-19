ALTER TABLE chat_messages ALTER COLUMN sources TYPE text USING sources::text;
