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

