-- Creating the moving_averages table to store SMA and EMA data
CREATE TABLE moving_averages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ticker VARCHAR(10) NOT NULL, -- Company ticker symbol (e.g., AAPL)
    calculation_date DATE NOT NULL, -- Date of the moving average calculation
    price DECIMAL(10, 2) NOT NULL, -- Closing price for the day
    sma_period INT, -- Period for SMA (e.g., 20, 50, 200)
    sma_value DECIMAL(10, 2), -- SMA value
    ema_period INT, -- Period for EMA (e.g., 12, 26)
    ema_value DECIMAL(10, 2), -- EMA value
    crossover_type ENUM('bullish_sma', 'bearish_sma', 'bullish_ema', 'bearish_ema', 'none') DEFAULT 'none', -- Type of crossover
    crossover_description VARCHAR(255), -- Description of crossover event
    signal_type ENUM('buy', 'sell', 'none') DEFAULT 'none', -- Signal generated (buy/sell)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Creation timestamp
    FOREIGN KEY (ticker) REFERENCES companies(ticker) -- Assumes a companies table exists
);

-- Index for faster queries on ticker and calculation_date
CREATE INDEX idx_moving_averages_ticker_date ON moving_averages (ticker, calculation_date);

-- Index for crossover queries
CREATE INDEX idx_moving_averages_crossover ON moving_averages (ticker, crossover_type, signal_type);
