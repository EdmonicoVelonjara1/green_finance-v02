DROP PROCEDURE IF EXISTS calculate_bollinger_bands;
DELIMITER //

CREATE PROCEDURE calculate_bollinger_bands (
    IN p_ticker_id INT,
    IN p_period INT,
    IN p_multiplier FLOAT
)
BEGIN

    CREATE TABLE IF NOT EXISTS indicator_bollinger_bands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_ticker INT,
        date DATE,
        middle_band FLOAT,
        upper_band FLOAT,
        lower_band FLOAT,
        period INT,
        multiplier FLOAT,
        FOREIGN KEY (id_ticker) REFERENCES stock_data(id_ticker)
    );

    DELETE FROM indicator_bollinger_bands 
    WHERE id_ticker = p_ticker_id AND period = p_period AND multiplier = p_multiplier;

    INSERT INTO indicator_bollinger_bands (id_ticker, date, middle_band, upper_band, lower_band, period, multiplier)
    SELECT 
        id_ticker,
        date,
        CASE 
            WHEN ROW_NUMBER() OVER (PARTITION BY id_ticker ORDER BY date) < p_period 
            THEN NULL
            ELSE AVG(close) OVER (
                PARTITION BY id_ticker 
                ORDER BY date 
                ROWS BETWEEN p_period - 1 PRECEDING AND CURRENT ROW
            )
        END AS middle_band,
        CASE 
            WHEN ROW_NUMBER() OVER (PARTITION BY id_ticker ORDER BY date) < p_period 
            THEN NULL
            ELSE AVG(close) OVER (
                PARTITION BY id_ticker 
                ORDER BY date 
                ROWS BETWEEN p_period - 1 PRECEDING AND CURRENT ROW
            ) + p_multiplier * SQRT(
                AVG(POWER(close - sub.mean, 2)) OVER (
                    PARTITION BY id_ticker 
                    ORDER BY date 
                    ROWS BETWEEN p_period - 1 PRECEDING AND CURRENT ROW
                )
            )
        END AS upper_band,
        CASE 
            WHEN ROW_NUMBER() OVER (PARTITION BY id_ticker ORDER BY date) < p_period 
            THEN NULL
            ELSE AVG(close) OVER (
                PARTITION BY id_ticker 
                ORDER BY date 
                ROWS BETWEEN p_period - 1 PRECEDING AND CURRENT ROW
            ) - p_multiplier * SQRT(
                AVG(POWER(close - sub.mean, 2)) OVER (
                    PARTITION BY id_ticker 
                    ORDER BY date 
                    ROWS BETWEEN p_period - 1 PRECEDING AND CURRENT ROW
                )
            )
        END AS lower_band,
        p_period,
        p_multiplier
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
