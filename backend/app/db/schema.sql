CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS candles (
    time        TIMESTAMPTZ NOT NULL,
    symbol      TEXT        NOT NULL,
    open        NUMERIC(12,4),
    high        NUMERIC(12,4),
    low         NUMERIC(12,4),
    close       NUMERIC(12,4),
    volume      BIGINT,
    PRIMARY KEY (time, symbol)
);

SELECT create_hypertable('candles', 'time', if_not_exists => TRUE, chunk_time_interval => INTERVAL '1 week');

CREATE TABLE IF NOT EXISTS oi_snapshots (
    time            TIMESTAMPTZ NOT NULL,
    symbol          TEXT        NOT NULL,
    long_oi         BIGINT,
    short_oi        BIGINT,
    pcr             NUMERIC(6,4),
    oi_state        TEXT,
    delivery_pct    NUMERIC(5,2),
    PRIMARY KEY (time, symbol)
);

SELECT create_hypertable('oi_snapshots', 'time', if_not_exists => TRUE, chunk_time_interval => INTERVAL '1 week');

CREATE TABLE IF NOT EXISTS predictions (
    time            TIMESTAMPTZ NOT NULL,
    symbol          TEXT        NOT NULL,
    direction       SMALLINT,
    confidence      NUMERIC(5,4),
    vix_discounted  NUMERIC(5,4),
    model_version   TEXT,
    PRIMARY KEY (time, symbol)
);

SELECT create_hypertable('predictions', 'time', if_not_exists => TRUE, chunk_time_interval => INTERVAL '1 month');

CREATE TABLE IF NOT EXISTS market_symbols (
    id              SERIAL PRIMARY KEY,
    symbol          TEXT UNIQUE NOT NULL,
    company_name    TEXT NOT NULL,
    sector          TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial symbols
INSERT INTO market_symbols (symbol, company_name, sector) VALUES
('RELIANCE', 'Reliance Industries', 'Energy'),
('HDFCBANK', 'HDFC Bank', 'Banking'),
('ICICIBANK', 'ICICI Bank', 'Banking'),
('INFY', 'Infosys', 'IT'),
('TCS', 'TCS', 'IT'),
('SBIN', 'State Bank of India', 'PSU Bank'),
('LT', 'Larsen & Toubro', 'Infrastructure'),
('TATAMOTORS', 'Tata Motors', 'Auto')
ON CONFLICT (symbol) DO NOTHING;
