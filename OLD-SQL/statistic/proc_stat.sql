DELIMITER //
CREATE OR REPLACE FUNCTION med_stat(
    IN data_type VARCHAR(2),
    IN ticker_id INT,
    IN year INT DEFAULT 2024
)
RETURNS FLOAT DETERMINISTIC
BEGIN
    DECLARE median_value FLOAT DEFAULT 0;
    DECLARE counter INT DEFAULT 0;
    DECLARE ticker_id INT;
    DECLARE d1 FLOAT DEFAULT 0;
    DECLARE d2 FLOAT DEFAULT 0;
    DECLARE pos1, pos2 INT;
    DECLARE pos INT;  

    SELECT COUNT(*) INTO counter
    FROM statistic s
    WHERE s.id_ticker = ticker_id AND s.year = year;

    IF counter = 0 THEN
        RETURN NULL;
    END IF;

    SET pos1 = (counter / 2 - 1); 
    SET pos2 = (counter / 2); 

    IF counter % 2 = 0 THEN
        IF data_type = 'C' THEN
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