DROP PROCEDURE IF EXISTS calculate_daily_returns;
DELIMITER //

CREATE PROCEDURE calculate_daily_returns (
    IN p_ticker_id INT
)
BEGIN
  
    CREATE TABLE IF NOT EXISTS indicator_daily_returns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_ticker INT,
        date DATE,
        daily_return FLOAT,
        FOREIGN KEY (id_ticker) REFERENCES stock_data(id_ticker)
    );

    DELETE FROM indicator_daily_returns WHERE id_ticker = p_ticker_id;

    INSERT INTO indicator_daily_returns (id_ticker, date, daily_return)
    SELECT 
        s1.id_ticker,
        s1.date,
        ((s1.close - s2.close) / s2.close) * 100 AS daily_return
    FROM stock_data s1
    JOIN stock_data s2
        ON s1.id_ticker = s2.id_ticker
        AND s2.date = (
            SELECT MAX(date)
            FROM stock_data
            WHERE id_ticker = s1.id_ticker
            AND date < s1.date
        )
    WHERE s1.id_ticker = p_ticker_id
    AND s2.close IS NOT NULL
    ORDER BY s1.date;
END;
//
DELIMITER ;
