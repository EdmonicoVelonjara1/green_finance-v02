DROP PROCEDURE IF EXISTS calculate_macd;
DELIMITER //

CREATE PROCEDURE calculate_macd (
    IN p_ticker_id INT,
    IN p_fast_period INT,
    IN p_slow_period INT,
    IN p_signal_period INT
)
BEGIN

    CREATE TABLE IF NOT EXISTS indicator_macd (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_ticker INT,
        date DATE,
        macd_line FLOAT,
        signal_line FLOAT,
        histogram FLOAT,
        fast_period INT,
        slow_period INT,
        signal_period INT,
        FOREIGN KEY (id_ticker) REFERENCES stock_data(id_ticker)
    );

    DELETE FROM indicator_macd 
    WHERE id_ticker = p_ticker_id 
    AND fast_period = p_fast_period 
    AND slow_period = p_slow_period 
    AND signal_period = p_signal_period;

    WITH RECURSIVE fast_ema AS (
        SELECT id_ticker, date, close AS ema, 1 AS row_num
        FROM stock_data
        WHERE id_ticker = p_ticker_id
        AND date = (SELECT MIN(date) FROM stock_data WHERE id_ticker = p_ticker_id)
        UNION ALL
        SELECT 
            s.id_ticker, s.date,
            CASE 
                WHEN ROW_NUMBER() OVER (PARTITION BY s.id_ticker ORDER BY s.date) < p_fast_period THEN NULL
                WHEN ROW_NUMBER() OVER (PARTITION BY s.id_ticker ORDER BY s.date) = p_fast_period THEN (
                    SELECT AVG(close) FROM stock_data s2 
                    WHERE s2.id_ticker = s.id_ticker AND s2.date <= s.date
                    AND s2.date > (SELECT MIN(date) FROM stock_data WHERE id_ticker = s.id_ticker LIMIT 1 OFFSET p_fast_period - 2)
                )
                ELSE (s.close - e.ema) * (2.0 / (p_fast_period + 1)) + e.ema
            END AS ema,
            ROW_NUMBER() OVER (PARTITION BY s.id_ticker ORDER BY s.date) + 1
        FROM stock_data s
        JOIN fast_ema e
            ON s.id_ticker = e.id_ticker
            AND s.date = (SELECT MIN(date) FROM stock_data WHERE id_ticker = s.id_ticker AND date > e.date)
        WHERE s.id_ticker = p_ticker_id
    ),
    slow_ema AS (
        SELECT id_ticker, date, close AS ema, 1 AS row_num
        FROM stock_data
        WHERE id_ticker = p_ticker_id
        AND date = (SELECT MIN(date) FROM stock_data WHERE id_ticker = p_ticker_id)
        UNION ALL
        SELECT 
            s.id_ticker, s.date,
            CASE 
                WHEN ROW_NUMBER() OVER (PARTITION BY s.id_ticker ORDER BY s.date) < p_slow_period THEN NULL
                WHEN ROW_NUMBER() OVER (PARTITION BY s.id_ticker ORDER BY s.date) = p_slow_period THEN (
                    SELECT AVG(close) FROM stock_data s2 
                    WHERE s2.id_ticker = s.id_ticker AND s2.date <= s.date
                    AND s2.date > (SELECT MIN(date) FROM stock_data WHERE id_ticker = s.id_ticker LIMIT 1 OFFSET p_slow_period - 2)
                )
                ELSE (s.close - e.ema) * (2.0 / (p_slow_period + 1)) + e.ema
            END AS ema,
            ROW_NUMBER() OVER (PARTITION BY s.id_ticker ORDER BY s.date) + 1
        FROM stock_data s
        JOIN slow_ema e
            ON s.id_ticker = e.id_ticker
            AND s.date = (SELECT MIN(date) FROM stock_data WHERE id_ticker = s.id_ticker AND date > e.date)
        WHERE s.id_ticker = p_ticker_id
    ),
    macd_line AS (
        SELECT 
            f.id_ticker,
            f.date,
            CASE 
                WHEN f.ema IS NULL OR s.ema IS NULL THEN NULL
                ELSE f.ema - s.ema
            END AS macd
        FROM fast_ema f
        JOIN slow_ema s ON f.id_ticker = s.id_ticker AND f.date = s.date
    ),
    signal_ema AS (
        SELECT id_ticker, date, macd AS close
        FROM macd_line
        WHERE id_ticker = p_ticker_id
    ),
    signal_line AS (
        SELECT id_ticker, date, close AS ema, 1 AS row_num
        FROM signal_ema
        WHERE id_ticker = p_ticker_id
        AND date = (SELECT MIN(date) FROM signal_ema WHERE id_ticker = p_ticker_id)
        UNION ALL
        SELECT 
            s.id_ticker, s.date,
            CASE 
                WHEN ROW_NUMBER() OVER (PARTITION BY s.id_ticker ORDER BY s.date) < p_signal_period THEN NULL
                WHEN ROW_NUMBER() OVER (PARTITION BY s.id_ticker ORDER BY s.date) = p_signal_period THEN (
                    SELECT AVG(close) FROM signal_ema s2 
                    WHERE s2.id_ticker = s.id_ticker AND s2.date <= s.date
                    AND s2.date > (SELECT MIN(date) FROM signal_ema WHERE id_ticker = s.id_ticker LIMIT 1 OFFSET p_signal_period - 2)
                )
                ELSE (s.close - e.ema) * (2.0 / (p_signal_period + 1)) + e.ema
            END AS ema,
            ROW_NUMBER() OVER (PARTITION BY s.id_ticker ORDER BY s.date) + 1
        FROM signal_ema s
        JOIN signal_line e
            ON s.id_ticker = e.id_ticker
            AND s.date = (SELECT MIN(date) FROM signal_ema WHERE id_ticker = s.id_ticker AND date > e.date)
        WHERE s.id_ticker = p_ticker_id
    )
    INSERT INTO indicator_macd (id_ticker, date, macd_line, signal_line, histogram, fast_period, slow_period, signal_period)
    SELECT 
        m.id_ticker,
        m.date,
        m.macd AS macd_line,
        s.ema AS signal_line,
        CASE 
            WHEN m.macd IS NULL OR s.ema IS NULL THEN NULL
            ELSE m.macd - s.ema
        END AS histogram,
        p_fast_period,
        p_slow_period,
        p_signal_period
    FROM macd_line m
    JOIN signal_line s ON m.id_ticker = s.id_ticker AND m.date = s.date
    WHERE m.id_ticker = p_ticker_id
    ORDER BY m.date;
END //
DELIMITER ;

CREATE TABLE IF NOT EXISTS indicator_macd (
    id_ticker INT,
    date DATE,
    macd_line 
)
