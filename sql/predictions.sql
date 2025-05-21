-- Creating the predictions table to store prediction data
CREATE TABLE predictions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ticker VARCHAR(10) NOT NULL, -- Company ticker symbol (e.g., AAPL)
    prediction_date DATE NOT NULL, -- Date of the prediction
    model_type ENUM('linear', 'ma', 'exp') NOT NULL, -- Type of prediction model
    predicted_price DECIMAL(10, 2), -- Predicted stock price
    confidence_lower DECIMAL(10, 2), -- Lower bound of confidence interval
    confidence_upper DECIMAL(10, 2), -- Upper bound of confidence interval
    confidence_level DECIMAL(5, 4), -- Confidence level (e.g., 0.95)
    training_period INT, -- Number of days used for training
    prediction_horizon INT, -- Number of days for prediction horizon
    ma_window INT, -- Moving average window (if applicable)
    alpha DECIMAL(5, 4), -- Alpha parameter for exponential smoothing
    beta DECIMAL(5, 4), -- Beta parameter for exponential smoothing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Creation timestamp
    FOREIGN KEY (ticker) REFERENCES companies(ticker) -- Assuming a companies table exists
);

-- Index for faster queries on ticker and prediction_date
CREATE INDEX idx_predictions_ticker_date ON predictions (ticker, prediction_date);
