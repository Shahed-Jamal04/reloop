-- Ensure material_status has a 'pending' row for listing approvals.
-- Safe to run multiple times.

IF NOT EXISTS (SELECT 1 FROM material_status WHERE status = 'pending')
BEGIN
  INSERT INTO material_status (status) VALUES ('pending');
END

