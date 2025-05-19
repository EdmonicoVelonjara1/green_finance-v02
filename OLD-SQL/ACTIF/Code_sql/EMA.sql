DROP PROCEDURE IF EXISTS calculate_ema;
DELIMITER //

CREATE PROCEDURE calculate_ema (
    IN p_ticker_id INT,
    IN p_period INT
)
BEGIN

    CREATE TABLE IF NOT EXISTS indicator_ema (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_ticker INT,
        date DATE,
        ema FLOAT,
        period INT,
        FOREIGN KEY (id_ticker) REFERENCES stock_data(id_ticker)
    );

    DELETE FROM indicator_ema WHERE id_ticker = p_ticker_id AND period = p_period;

    WITH RECURSIVE ema_calc AS (
        SELECT 
            id_ticker,
            date,
            close AS ema,
            1 AS row_num
        FROM stock_data
        WHERE id_ticker = p_ticker_id
        AND date = (SELECT MIN(date) FROM stock_data WHERE/ag id_ticker = p_ticker_id)
        
        UNION ALL
        
        SELECT 
            s.id_ticker,
            s.date,
            CASE 
                WHEN ROW_NUMBER() OVER (PARTITION BY s.id_ticker ORDER BY s.date) < p_period
                THEN NULL
                WHEN ROW_NUMBER() OVER (PARTITION BY s.id_ticker ORDER BY s.date) = p_period
                THEN (
                    SELECT AVG(close)
                    FROM stock_data s2
                    WHERE s2.id_ticker = s.id_ticker
                    AND s2.date <= s.date
                    AND s2.date > (
                        SELECT MIN(date)
                        FROM stock_data
                        WHERE id_ticker = s.id_ticker
                        LIMIT 1 OFFSET p_period - 2
                    )
                )
                ELSE 
                    (s.close - e.ema) * (2.0 / (p_period + 1)) + e.ema
            END AS ema,
            ROW_NUMBER() OVER (PARTITION BY s.id_ticker ORDER BY s.date) + 1 AS row_num
        FROM stock_data s
        JOIN ema_calc e
            ON s.id_ticker = e.id_ticker
            AND s.date = (
                SELECT MIN(date)
                FROM stock_data
                WHERE id_ticker = s.id_ticker
                AND date > e.date
            )
        WHERE s.id_ticker = p_ticker_id
    )
    INSERT INTO indicator_ema (id_ticker, date, ema, period)
    SELECT 
        id_ticker,
        date,
        ema,
        p_period
    FROM ema_calc
    ORDER BY date;
END;
//
DELIMITER ;
