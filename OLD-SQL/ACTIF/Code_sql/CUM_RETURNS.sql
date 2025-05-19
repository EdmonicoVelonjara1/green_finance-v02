DROP PROCEDURE IF EXISTS calculate_cumulative_returns;
DELIMITER //

CREATE PROCEDURE calculate_cumulative_returns (
    IN p_ticker_id INT
)
BEGIN

    CREATE TABLE IF NOT EXISTS indicator_cumulative_returns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_ticker INT,
        date DATE,
        cumulative_return FLOAT,
        FOREIGN KEY (id_ticker) REFERENCES stock_data(id_ticker)
    );

    DELETE FROM indicator_cumulative_returns WHERE id_ticker = p_ticker_id;

    INSERT INTO indicator_cumulative_returns (id_ticker, date, cumulative_return)
    SELECT 
        id_ticker,
        date,
        ((close / first_close) - 1) * 100 AS cumulative_return
    FROM stock_data
    CROSS JOIN (
        SELECT close AS first_close
        FROM stock_data
        WHERE id_ticker = p_ticker_id
        AND date = (SELECT MIN(date) FROM stock_data WHERE id_ticker = p_ticker_id)
    ) first
    WHERE id_ticker = p_ticker_id
    ORDER BY date;
END;
//
DELIMITER ;
