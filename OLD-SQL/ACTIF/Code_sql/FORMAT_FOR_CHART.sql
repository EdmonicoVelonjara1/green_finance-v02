DROP PROCEDURE IF EXISTS format_data_for_charts;
DELIMITER //

CREATE PROCEDURE format_data_for_charts (
    IN p_ticker_id INT
)
BEGIN

    CREATE TABLE IF NOT EXISTS indicator_chart_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_ticker INT,
        date VARCHAR(10),
        open_price FLOAT,
        high_price FLOAT,
        low_price FLOAT,
        close_price FLOAT,
        volume FLOAT,
        FOREIGN KEY (id_ticker) REFERENCES stock_data(id_ticker)
    );

    DELETE FROM indicator_chart_data WHERE id_ticker = p_ticker_id;

    INSERT INTO indicator_chart_data (id_ticker, date, open_price, high_price, low_price, close_price, volume)
    SELECT 
        id_ticker,
        DATE_FORMAT(date, '%Y-%m-%d') AS date,
        open AS open_price,
        high AS high_price,
        low AS low_price,
        close AS close_price,
        volume
    FROM stock_data
    WHERE id_ticker = p_ticker_id
    ORDER BY date;
END;
//
DELIMITER ;
