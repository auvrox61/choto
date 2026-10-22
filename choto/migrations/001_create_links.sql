CREATE TABLE links (
  code       VARCHAR(7)  PRIMARY KEY,
  long_url   TEXT        NOT NULL CHECK (char_length(long_url) <= 2048),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
