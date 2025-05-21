-- Table ticker des companies
DROP TABLE IF EXISTS ticker;
CREATE TABLE IF NOT EXISTS ticker (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(100),
    UNIQUE (name)
) ENGINE=InnoDB;

-- Table des données boursières
DROP TABLE IF EXISTS stock_market_data;

CREATE TABLE IF NOT EXISTS stock_market_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_ticker INT NOT NULL,
    date DATE NOT NULL,
    open FLOAT NOT NULL,
    high FLOAT NOT NULL,
    low FLOAT NOT NULL,
    close FLOAT NOT NULL,
    adj_close FLOAT NOT NULL,
    volume BIGINT NOT NULL,
    FOREIGN KEY (id_ticker) REFERENCES ticker(id) ON DELETE RESTRICT,
    UNIQUE (id_ticker, date),
    CHECK (open > 0 AND high > 0 AND low > 0 AND close > 0 AND adj_close > 0),
    CHECK (volume >= 0),
    CHECK (high >= low),
    CHECK (open <= high AND open >= low AND close <= high AND close >= low)
) ENGINE=InnoDB;

-- Index pour optimiser les requêtes
CREATE INDEX idx_stock_market_data_ticker_date ON stock_market_data (id_ticker, date);

CREATE TABLE indicator_rsi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_ticker INT NOT NULL,
    loss_7 FLOAT NOT NULL DEFAULT 0,
    gain_7 FLOAT NOT NULL DEFAULT 0,
    rsi_7 FLOAT NOT NULL DEFAULT 0,
    loss_14 FLOAT NOT NULL DEFAULT 0,
    gain_14 FLOAT NOT NULL DEFAULT 0,
    rsi_14 FLOAT NOT NULL DEFAULT 0,
    loss_21 FLOAT NOT NULL DEFAULT 0,
    gain_21 FLOAT NOT NULL DEFAULT 0,
    rsi_21 FLOAT NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    -- Optionnel : index pour accélérer les recherches par ticker et date
    UNIQUE KEY uq_ticker_date (id_ticker, date),
    INDEX idx_ticker (id_ticker),
    INDEX idx_date (date)
);

DROP TABLE IF EXISTS indicator_ema;
CREATE TABLE indicator_ema (
    id_ticker INT NOT NULL,
    date DATE NOT NULL,
    ema_period INT NOT NULL,
    ema_value FLOAT NOT NULL,
    PRIMARY KEY (id_ticker, date, ema_period),
    FOREIGN KEY (id_ticker) REFERENCES ticker(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE rsi_signals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_rsi INT NOT NULL, -- Référence vers indicator_rsi
  signal_type VARCHAR(50) NOT NULL,
  description TEXT,
  signal_label VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_rsi) REFERENCES indicator_rsi(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE 
)ENGINE=InnoDB;

-- CREATE TABLE ema_signals (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   id_ema INT NOT NULL, -- Référence vers indicator_ema
--   signal_type VARCHAR(50) NOT NULL,
--   description TEXT,
--   signal VARCHAR(50),
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (id_ema) REFERENCES indicator_ema(id_ticker)
--     ON DELETE CASCADE
--     ON UPDATE CASCADE
-- )ENGINE=InnoDB;

