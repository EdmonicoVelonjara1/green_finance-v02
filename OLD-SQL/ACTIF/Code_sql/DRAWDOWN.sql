DROP PROCEDURE IF EXISTS calculate_drawdown;
DELIMITER //

CREATE PROCEDURE calculate_drawdown (
    IN p_ticker_id INT
)
BEGIN

    CREATE TABLE IF NOT EXISTS indicator_drawdown (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_ticker INT,
        date DATE,
        drawdown FLOAT,
        max_drawdown FLOAT,
        FOREIGN KEY (id_ticker) REFERENCES stock_data(id_ticker)
    );

    DELETE FROM indicator_drawdown WHERE id_ticker = p_ticker_id;

    WITH RECURSIVE peaks AS (
        SELECT 
            id_ticker,
            date,
            close,
            close AS peak,
            0 AS drawdown,
            0 AS max_drawdown,
            1 AS row_num
        FROM stock_data
        WHERE id_ticker = p_ticker_id
        AND date = (SELECT MIN(date) FROM stock_data WHERE id_ticker = p_ticker_id)
        UNION ALL
        SELECT 
            s.id_ticker,
            s.date,
            s.close,
            GREATEST(p.peak, s.close) AS peak,
            ((GREATEST(p.peak, s.close) - s.close) / GREATEST(p.peak, s.close)) * 100 AS drawdown,
            GREATEST(p.max_drawdown, ((GREATEST(p.peak, s.close) - s.close) / GREATEST(p.peak, s.close)) * 100) AS max_drawdown,
            p.row_num + 1
        FROM stock_data s
        JOIN peaks p
            ON s.id_ticker = p.id_ticker
            AND s.date = (SELECT MIN(date) FROM stock_data WHERE id_ticker = s.id_ticker AND date > p.date)
        WHERE s.id_ticker = p_ticker_id
    )
    INSERT INTO indicator_drawdown (id_ticker, date, drawdown, max_drawdown)
    SELECT 
        id_ticker,
        date,
        drawdown,
        max_drawdown
    FROM peaks
    ORDER BY date;
END;
//
DELIMITER ;
