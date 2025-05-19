DROP PROCEDURE IF EXISTS calculate_standard_deviation;
DELIMITER //

CREATE PROCEDURE calculate_standard_deviation (
    IN p_ticker_id INT,
    IN p_period INT
)
BEGIN
    CREATE TABLE IF NOT EXISTS indicator_standard_deviation (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_ticker INT,
        date DATE,
        std_dev FLOAT,
        period INT,
        FOREIGN KEY (id_ticker) REFERENCES stock_data(id_ticker)
    );

    DELETE FROM indicator_standard_deviation WHERE id_ticker = p_ticker_id AND period = p_period;

    INSERT INTO indicator_standard_deviation (id_ticker, date, std_dev, period)
    SELECT 
        id_ticker,
        date,
        CASE 
            WHEN ROW_NUMBER() OVER (PARTITION BY id_ticker ORDER BY date) < p_period 
            THEN NULL
            ELSE SQRT(
                AVG(POWER(close - sub.mean, 2)) OVER (
                    PARTITION BY id_ticker 
                    ORDER BY date 
                    ROWS BETWEEN p_period - 1 PRECEDING AND CURRENT ROW
                )
            )
        END AS std_dev,
        p_period
    FROM (
        SELECT 
            id_ticker,
            date,
            close,
            AVG(close) OVER (
                PARTITION BY id_ticker 
                ORDER BY date 
                ROWS BETWEEN p_period - 1 PRECEDING AND CURRENT ROW
            ) AS mean
        FROM stock_data
        WHERE id_ticker = p_ticker_id
    ) sub
    ORDER BY date;
END;
//
DELIMITER ;
