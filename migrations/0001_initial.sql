-- Migration: 0001_initial
-- Tạo bảng vital_reports thay thế Firebase Firestore

CREATE TABLE IF NOT EXISTS vital_reports (
  id          TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  bpm         TEXT    NOT NULL,
  bpv1        TEXT    NOT NULL,
  bpv0        TEXT    NOT NULL,
  S2          TEXT    NOT NULL,
  LTv         TEXT    NOT NULL,
  score       INTEGER NOT NULL,
  status_key  TEXT    NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_vital_reports_created_at
  ON vital_reports(created_at DESC);
