DROP PROCEDURE IF EXISTS calculate_statistics;
DELIMITER //

CREATE PROCEDURE calculate_statistics (
    IN desiccation_id INT
)
BEGIN

    CREATE TABLE IF NOT EXISTS indicator_statistics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_ticker INT,
        mean FLOAT,
        median FLOAT,
        min_price FLOAT,
        max_price FLOAT,
        std_dev FLOAT,
        skewness FLOAT,
        kurtosis FLOAT,
        FOREIGN KEY (id_ticker) REFERENCES stock_data(id_ticker)
    );

    DELETE FROM indicator_statistics WHERE id_ticker = p_ticker_id;

    INSERT INTO indicator_statistics (id_ticker, mean, median, min_price, max_price, std_dev, skewness, kurtosis)
    WITH stats AS (
        SELECT 
            id_ticker,
            AVG(close) AS mean,
            MIN(close) AS min_price,
            MAX(close) AS max_price,
            STDDEV_POP(close) AS std_dev,
            COUNT(*) AS n
        FROM stock_data
        WHERE id_ticker = p_ticker_id
        GROUP BY id_ticker
    ),
    sorted AS (
        SELECT 
            close,
            ROW_NUMBER() OVER (ORDER BY close) AS row_num,
            COUNT(*) OVER () AS total_count
        FROM stock_data
        WHERE id_ticker = p_ticker_id
    ),
    median_calc AS (
        SELECT 
            AVG(close) AS median
        FROM sorted
        WHERE row_num IN (FLOOR((total_count + 1) / 2), CEIL((total_count + 1) / 2))
    ),
    moments AS (
        SELECT 
            id_ticker,
            AVG(POWER((close - stats.mean) / stats.std_dev, 3)) AS skewness,
            AVG(POWER((close - stats.mean) / stats.std_dev, 4)) - 3 AS kurtosis
        FROM stock_data
        JOIN stats ON stock_data.id_ticker = stats.id_ticker
        WHERE stock_data.id_ticker = p_ticker_id
        GROUP BY id_ticker
    )
    SELECT 
        stats.id_ticker,
        stats.mean,
        median_calc.median,
        stats.min_price,
        stats.max_price,
        stats.std_dev,
        moments.skewness,
        moments.kurtosis
    FROM stats
    CROSS JOIN median_calc
    JOIN moments ON stats.id_ticker = moments.id_ticker;
END;
//
DELIMITER ;
