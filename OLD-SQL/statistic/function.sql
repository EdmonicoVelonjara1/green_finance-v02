DROP FUNCTION IF EXISTS median_annual;
DELIMITER //

CREATE FUNCTION median_annual(
    data_type VARCHAR(10),
    ticker_id INT,
    year INT
)
RETURNS FLOAT DETERMINISTIC
BEGIN
    DECLARE median_value FLOAT DEFAULT 0;
    DECLARE counter INT DEFAULT 0;
    DECLARE d1 FLOAT DEFAULT 0;
    DECLARE d2 FLOAT DEFAULT 0;
    DECLARE pos1, pos2, pos INT;

    -- Compter le nombre de valeurs disponibles
    SELECT COUNT(*) INTO counter
    FROM stock_market_data
    WHERE id_ticker = ticker_id AND YEAR(date) = year;

    IF counter = 0 THEN
        RETURN NULL;
    END IF;

    IF counter % 2 = 0 THEN
        SET pos1 = counter / 2 - 1;
        SET pos2 = counter / 2;

        IF data_type = 'price' THEN
            SELECT close INTO d1
            FROM stock_market_data
            WHERE id_ticker = ticker_id AND YEAR(date) = year
            ORDER BY close
            LIMIT 1 OFFSET pos1;

            SELECT close INTO d2
            FROM stock_market_data
            WHERE id_ticker = ticker_id AND YEAR(date) = year
            ORDER BY close
            LIMIT 1 OFFSET pos2;

        ELSEIF data_type = 'volume' THEN
            SELECT volume INTO d1
            FROM stock_market_data
            WHERE id_ticker = ticker_id AND YEAR(date) = year
            ORDER BY volume
            LIMIT 1 OFFSET pos1;

            SELECT volume INTO d2
            FROM stock_market_data
            WHERE id_ticker = ticker_id AND YEAR(date) = year
            ORDER BY volume
            LIMIT 1 OFFSET pos2;
        ELSE
            RETURN NULL;
        END IF;

        SET median_value = (d1 + d2) / 2;
    ELSE
        SET pos = FLOOR(counter / 2);

        IF data_type = 'price' THEN
            SELECT close INTO median_value
            FROM stock_market_data
            WHERE id_ticker = ticker_id AND YEAR(date) = year
            ORDER BY close
            LIMIT 1 OFFSET pos;

        ELSEIF data_type = 'volume' THEN
            SELECT volume INTO median_value
            FROM stock_market_data
            WHERE id_ticker = ticker_id AND YEAR(date) = year
            ORDER BY volume
            LIMIT 1 OFFSET pos;
        ELSE
            RETURN NULL;
        END IF;
    END IF;

    RETURN median_value;
END //
DELIMITER ;

DELIMITER //

CREATE FUNCTION skewness_annual(
    ticker_id INT, 
    year INT
)
RETURNS FLOAT DETERMINISTIC
BEGIN
    DECLARE n INT DEFAULT 0;
    DECLARE mean_val FLOAT DEFAULT 0;
    DECLARE std_dev FLOAT DEFAULT 0;
    DECLARE skew FLOAT DEFAULT 0;

    -- Nombre total de valeurs
    SELECT COUNT(*) INTO n
    FROM stock_market_data
    WHERE id_ticker = ticker_id 
    AND YEAR(date) = year;

    IF n = 0 THEN
        RETURN NULL;
    END IF;

    -- Moyenne des prix
    SELECT AVG(close) INTO mean_val
        FROM stock_market_data
        WHERE id_ticker = ticker_id AND YEAR(date) = year;

    -- Écart-type
    SELECT STDDEV(close) INTO std_dev
        FROM stock_market_data
        WHERE id_ticker = ticker_id AND YEAR(date) = year;

    IF std_dev = 0 THEN
        RETURN 0;
    END IF;

    -- Calcul de l'asymétrie
    SELECT SUM(POWER((close - mean_val) / std_dev, 3)) / n INTO skew
    FROM stock_market_data
    WHERE id_ticker = ticker_id AND YEAR(date) = year;

    RETURN skew;
END //

DELIMITER ;

CREATE FUNCTION median(data_type VARCHAR(2))
RETURNS FLOAT DETERMINISTIC
BEGIN
    DECLARE median_value FLOAT DEFAULT 0;
    DECLARE counter INT DEFAULT 0;
    DECLARE month, year, ticker_id INT;
    DECLARE d1 FLOAT DEFAULT 0;
    DECLARE d2 FLOAT DEFAULT 0;
    DECLARE pos1, pos2 INT;
    DECLARE pos INT;  -- Moved this declaration to the top with other DECLAREs

    -- Count the number of records for the given ticker, year, and month
    SET ticker_id = NEW.id_ticker;
    SET month = MONTH(NEW.date);
    SET year = YEAR(NEW.date);

    SELECT COUNT(*), MONTH(date) INTO counter
    FROM stock_market_data
    WHERE id_ticker = ticker_id
        AND YEAR(date) = year
        AND MONTH(date) = month;

    IF counter = 0 THEN
        RETURN NULL;
    END IF;

    SET pos1 = (counter / 2 - 1); 
    SET pos2 = (counter / 2); 

    IF counter % 2 = 0 THEN
        IF data_type = 'C' THEN
            -- Fetch the two middle closing prices
            SELECT close INTO d1
            FROM stock_market_data
            WHERE id_ticker = ticker_id
                AND YEAR(date) = year
                AND MONTH(date) = month
            ORDER BY close
            LIMIT 1 OFFSET pos1;

            SELECT close INTO d2
            FROM stock_market_data
            WHERE id_ticker = ticker_id
                AND YEAR(date) = year
                AND MONTH(date) = month
            ORDER BY close
            LIMIT 1 OFFSET pos2;

        ELSEIF data_type = 'V' THEN
            -- Fetch the two middle volumes
            SELECT volume INTO d1
            FROM stock_market_data
            WHERE id_ticker = ticker_id
                AND YEAR(NEW.date) = year
                AND MONTH(NEW.date) = month
            ORDER BY volume
            LIMIT 1 OFFSET pos1;

            SELECT volume INTO d2
            FROM stock_market_data
            WHERE id_ticker = ticker_id
                AND YEAR(date) = year
                AND MONTH(date) = month
            ORDER BY volume
            LIMIT 1 OFFSET pos2;
        ELSE
            -- Invalid data_type
            RETURN NULL;
        END IF;

        -- Calculate median as average of two middle values
        SET median_value = (d1 + d2) / 2;
    ELSE
        SET pos = counter / 2; -- 0-based index for middle value

        IF data_type = 'C' THEN
            SELECT close INTO median_value
            FROM stock_market_data
            WHERE id_ticker = ticker_id
                AND YEAR(date) = year
                AND MONTH(date) = month
            ORDER BY close
            LIMIT 1 OFFSET pos;

        ELSEIF data_type = 'V' THEN
            -- Fetch the middle volume
            SELECT volume INTO median_value
            FROM stock_market_data
            WHERE id_ticker = ticker_id
                AND YEAR(date) = year
                AND MONTH(date) = month
            ORDER BY volume
            LIMIT 1 OFFSET pos;
        ELSE
            -- Invalid data_type
            RETURN NULL;
        END IF;
    END IF;

    RETURN median_value;
END //
DELIMITER ;



DROP FUNCTION IF EXISTS cum_return;

DELIMITER //
CREATE OR REPLACE FUNCTION cum_return(
    ticker_id INT, 
    year INT, 
    month INT
)  
RETURNS FLOAT DETERMINISTIC 
BEGIN
    DECLARE trend FLOAT DEFAULT 0;
    DECLARE i INT DEFAULT 0;
    DECLARE initial_price FLOAT DEFAULT 0;
    DECLARE final_price FLOAT DEFAULT 0;

    SET final_price  = (SELECT close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i);
    SET initial_price = (SELECT close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i + 1);
    IF initial_price IS NOT NULL THEN
        SET trend = 100 * ((final_price - initial_price) / initial_price);
    END IF;

    RETURN trend;
END //


