-- Kullanım istatistikleri: her yükleme, görüntüleme ve geri bildirim bir satır
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,        -- milisaniye cinsinden zaman
  type TEXT NOT NULL,         -- 'upload' | 'view' | 'feedback'
  album TEXT,
  images INTEGER DEFAULT 0,
  bytes INTEGER DEFAULT 0,
  country TEXT
);
CREATE INDEX events_type_ts ON events (type, ts);
CREATE INDEX events_album ON events (album);
