-- Store ImageKit file IDs so replaced profile media can be deleted safely.
ALTER TABLE users ADD COLUMN avatar_file_id TEXT;
ALTER TABLE users ADD COLUMN banner_file_id TEXT;
