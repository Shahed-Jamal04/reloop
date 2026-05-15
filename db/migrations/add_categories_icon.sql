/*
  Add Bootstrap Icons name per category (glyph after "bi-", e.g. tree, egg-fried).
  Run against an existing RecycleX database (SQL Server).
*/
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.categories') AND name = N'icon'
)
BEGIN
  ALTER TABLE dbo.categories ADD icon NVARCHAR(64) NULL;
END
GO

-- Seed icons for default category names (adjust names if your data differs)
UPDATE dbo.categories SET icon = N'egg-fried' WHERE name = N'Food Overproduction' AND (icon IS NULL OR LTRIM(RTRIM(icon)) = N'');
UPDATE dbo.categories SET icon = N'handbag' WHERE name = N'Clothing Overruns' AND (icon IS NULL OR LTRIM(RTRIM(icon)) = N'');
UPDATE dbo.categories SET icon = N'box-seam' WHERE name = N'Packaging Surplus' AND (icon IS NULL OR LTRIM(RTRIM(icon)) = N'');
UPDATE dbo.categories SET icon = N'house' WHERE name = N'Household Goods' AND (icon IS NULL OR LTRIM(RTRIM(icon)) = N'');
UPDATE dbo.categories SET icon = N'tools' WHERE name = N'Industrial Materials' AND (icon IS NULL OR LTRIM(RTRIM(icon)) = N'');
GO
