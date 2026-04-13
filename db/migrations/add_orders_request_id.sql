-- Link orders to the buyer request that triggered them (idempotent accept).
-- Safe to run multiple times.

IF COL_LENGTH('dbo.orders', 'request_id') IS NULL
BEGIN
  ALTER TABLE dbo.orders ADD request_id INT NULL;
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_orders_request' AND parent_object_id = OBJECT_ID('dbo.orders')
)
BEGIN
  ALTER TABLE dbo.orders
    ADD CONSTRAINT FK_orders_request FOREIGN KEY (request_id) REFERENCES dbo.requests(id);
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'UQ_orders_request_id' AND object_id = OBJECT_ID('dbo.orders')
)
BEGIN
  CREATE UNIQUE NONCLUSTERED INDEX UQ_orders_request_id ON dbo.orders(request_id)
  WHERE request_id IS NOT NULL;
END
GO
