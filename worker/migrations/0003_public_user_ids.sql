-- Give each registered user an opaque, stable profile URL identifier.
-- Telegram numeric IDs remain server-side and are never returned by the public directory.
ALTER TABLE users ADD COLUMN public_id TEXT;

UPDATE users
SET public_id = lower(hex(randomblob(16)))
WHERE public_id IS NULL OR public_id = '';

CREATE UNIQUE INDEX idx_users_public_id ON users (public_id);
