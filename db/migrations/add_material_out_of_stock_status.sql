-- Seller can hide listings from the marketplace without deleting them.
-- Safe to run multiple times.

IF NOT EXISTS (SELECT 1 FROM material_status WHERE status = 'out_of_stock')
BEGIN
  INSERT INTO material_status (status) VALUES ('out_of_stock');
END
