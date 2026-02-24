-- Migration: thêm short_id cho display tại triển lãm (format VS-XXXX)
ALTER TABLE vital_reports ADD COLUMN short_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_vital_reports_short_id ON vital_reports(short_id);
