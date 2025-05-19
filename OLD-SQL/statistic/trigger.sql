CREATE OR REPLACE PROCEDURE add_statistic
(
    IN ticker_id INT,
    IN month_val INT,
    IN year_val INT
)
BEGIN
    -- DECLARE ticker_id INT;
    DECLARE counter INT;
    DECLARE avg_price, avg_volume, 
            median_price, median_volume,
            min_price, min_volume,
            max_price, max_volume,
            std_price, std_volume FLOAT;

    SET counter = (SELECT count(*) FROM statistic WHERE id_ticker = ticker_id);
    -- Compute statistics for the same ticker, month, and year
    SELECT 
        AVG(close), 
        AVG(volume), 
        median(ticker_id, 'C', month_val, year_val), 
        median(ticker_id, 'V', month_val, year_val),
        MIN(close), 
        MIN(volume),
        MAX(close), 
        MAX(volume),
        STDDEV(close), 
        STDDEV(volume)
    INTO 
        avg_price, 
        avg_volume,
        median_price, 
        median_volume,
        min_price, 
        min_volume,
        max_price, 
        max_volume,
        std_price, 
        std_volume
    FROM stock_market_data
    WHERE id_ticker = ticker_id
      AND MONTH(date) = month_val
      AND YEAR(date) = year_val;

    IF counter = 0 THEN
    -- Insert statistics into the statistic table
        INSERT INTO statistic (
            id_ticker,
            avg_price,
            avg_volume,
            median_price,
            median_volume,
            min_price,
            min_volume,
            max_price,
            max_volume,
            std_price,
            std_volume,
            month, 
            year
        )
        VALUES (
            NEW.id_ticker,
            IFNULL(avg_price, 0),
            IFNULL(avg_volume, 0),
            IFNULL(median_price, 0),
            IFNULL(median_volume, 0),        
            IFNULL(min_price, 0),
            IFNULL(min_volume, 0),
            IFNULL(max_price, 0),
            IFNULL(max_volume, 0),
            IFNULL(std_price, 0),
            IFNULL(std_volume, 0),
            month_val,
            year_val
        );

    ELSE
        UPDATE statistic
        SET
            avg_price = IFNULL(avg_price, 0),
            avg_volume = IFNULL(avg_volume, 0),
            median_price = IFNULL(median_price, 0),
            median_volume = IFNULL(median_volume, 0),
            min_price = IFNULL(min_price, 0),
            min_volume = IFNULL(min_volume, 0),
            max_price = IFNULL(max_price, 0),
            max_volume = IFNULL(max_volume, 0),
            std_price = IFNULL(std_price, 0),
            std_volume = IFNULL(std_volume, 0)
        WHERE
            id_ticker = NEW.id_ticker AND
            month = month_val AND
            year = year_val;
        
    END IF
END //

DELIMITER ;