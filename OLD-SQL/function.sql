-- Calcul de la tendance: Hebdomadaire

DELIMITER //
CREATE OR REPLACE FUNCTION weekly_trend(
    ticker_id INT, 
    year INT, 
    month INT, 
    day_begin INT DEFAULT 1,
    day_end INT DEFAULT 7,
    price_type VARCHAR(10) DEFAULT 'close',
    is_cumulative BOOLEAN DEFAULT FALSE
)
RETURNS FLOAT DETERMINISTIC
BEGIN
    DECLARE week_end_price FLOAT DEFAULT 0;
    DECLARE cum_return FLOAT DEFAULT 0;
    DECLARE i INT DEFAULT 0;
    DECLARE current_price FLOAT DEFAULT 0;
    DECLARE previous_price FLOAT DEFAULT 0;
    DECLARE nb_days INT DEFAULT 0;

    SELECT COUNT(*) INTO nb_days 
    FROM stock_market_data 
    WHERE id_ticker = ticker_id 
        AND YEAR(date) = year 
        AND MONTH(date) = month;
        AND DAY(date) <= day_end
        AND DAY(date) >= day_begin;

    IF nb_days = 0 THEN
        RETURN NULL;
    END IF;

    IF is_cumulative THEN
        IF price_type = 'close' THEN
            WHILE i < nb_days DO
                SET current_price  = (SELECT close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) = year AND MONTH(date) = month AND DAY(date) <= day_end AND DAY(date) >= day_start ORDER BY date DESC LIMIT 1 OFFSET i);
                SET previous_price = (SELECT close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) = year AND MONTH(date) = month AND DAY(date) <= day_end AND DAY(date) >= day_start ORDER BY date DESC LIMIT 1 OFFSET i + 1);

                IF previous_price IS NOT NULL THEN
                    SET cum_return = cum_return + ((current_price - previous_price) / previous_price);

                END IF;

                SET i = i + 1;
            END WHILE;
            SET cum_return = 100 * cum_return / nb_days;
        ELSEIF price_type = 'open' THEN
            WHILE i < nb_days DO
                SET current_price  = (SELECT open FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) = year AND MONTH(date) = month AND DAY(date) <= day_end AND DAY(date) >= day_start ORDER BY date DESC LIMIT 1 OFFSET i);
                SET previous_price = (SELECT open FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) = year AND MONTH(date) = month AND DAY(date) <= day_end AND DAY(date) >= day_start ORDER BY date DESC LIMIT 1 OFFSET i + 1);

                IF previous_price IS NOT NULL THEN
                    SET cum_return = cum_return + ((current_price - previous_price) / previous_price);

                END IF;

                SET i = i + 1;
            END WHILE;
            SET cum_return = 100 * cum_return / nb_days;
        ELSEIF price_type = 'adj_close' THEN
            WHILE i < nb_days DO
                SET current_price  = (SELECT adj_close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) = year AND MONTH(date) = month AND DAY(date) <= day_end AND DAY(date) >= day_start ORDER BY date DESC LIMIT 1 OFFSET i);
                SET previous_price = (SELECT adj_close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) = year AND MONTH(date) = month AND DAY(date) <= day_end AND DAY(date) >= day_start ORDER BY date DESC LIMIT 1 OFFSET i + 1);

                IF previous_price IS NOT NULL THEN
                    SET cum_return = cum_return + ((current_price - previous_price) / previous_price);

                END IF;

                SET i = i + 1;
            END WHILE;
            SET cum_return = 100 * cum_return / nb_days;
        END IF;
    ELSE
        IF price_type = 'close' THEN
            SET current_price = (SELECT close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) = year AND MONTH(date) = month AND DAY(date) <= day_end AND DAY(date) >= day_begin ORDER BY date DESC LIMIT 1);
            SET previous_price = (SELECT close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) = year AND MONTH(date) = month AND DAY(date) <= day_end AND DAY(date) >= day_begin ORDER BY date ASC LIMIT 1);
        ELSEIF price_type = 'open' THEN
            SET current_price = (SELECT open FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) = year AND MONTH(date) = month AND DAY(date) <= day_end AND DAY(date) >= day_begin ORDER BY date DESC LIMIT 1);
            SET previous_price = (SELECT open FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) = year AND MONTH(date) = month AND DAY(date) <= day_end AND DAY(date) >= day_begin ORDER BY date ASC LIMIT 1);
        ELSEIF price_type = 'adj_close' THEN
            SET current_price  = (SELECT adj_close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) = year AND MONTH(date) = month AND DAY(date) <= day_end AND DAY(date) >= day_begin ORDER BY date DESC LIMIT 1);
            SET previous_price = (SELECT adj_close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) = year AND MONTH(date) = month AND DAY(date) <= day_end AND DAY(date) >= day_begin ORDER BY date ASC LIMIT 1);
        END IF;
        IF previous_price IS NOT NULL THEN
            SET cum_return = 100 * ((current_price - previous_price) / previous_price);
        END IF;
    END IF;

    RETURN cum_return;

END //
DELIMITER ;

CREATE OR REPLACE FUNCTION get_week_number(
    date DATE
)
RETURNS INT DETERMINISTIC
BEGIN
    DECLARE week_number INT DEFAULT 0;
    SET week_number = WEEK(date, 1);
    RETURN week_number;
END //
DELIMITER ;

DELIMITER //
CREATE OR REPLACE FUNCTION calculate_trend_price(
    ticker_id INT, 
    year INT, month INT, 
    type_price VARCHAR(10)
)  
RETURNS FLOAT DETERMINISTIC 
BEGIN
    DECLARE trend FLOAT DEFAULT 0;
    DECLARE i INT DEFAULT 0;
    DECLARE current_price FLOAT DEFAULT 0;
    DECLARE previous_price FLOAT DEFAULT 0;

    IF type_price = 'open' THEN
        
        SET current_price  = (SELECT open FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) = month ORDER BY date ASC LIMIT 1 OFFSET i);
        SET previous_price = (SELECT open FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) = month ORDER BY date DESC LIMIT 1 OFFSET i + 1);
        IF previous_price IS NOT NULL THEN
            SET trend = 100 * ((current_price - previous_price) / previous_price);
            
        END IF;

    ELSEIF type_price = 'close' THEN
        SET current_price  = (SELECT close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i);
        SET previous_price = (SELECT close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i + 1);
        IF previous_price IS NOT NULL THEN
            SET trend = 100 * ((current_price - previous_price) / previous_price);
            
        END IF;

    ELSEIF type_price = 'adj_close' THEN
        SET current_price  = (SELECT adj_close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i);
        SET previous_price = (SELECT adj_close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i + 1);
        IF previous_price IS NOT NULL THEN
            SET trend = 100 * ((current_price - previous_price) / previous_price);
            
        END IF;

    END IF;
    RETURN trend;
END //
DELIMITER ;


CREATE OR REPLACE FUNCTION calculate_volatility(ticker_id INT, year INT, month INT, type_price VARCHAR(10))
RETURNS FLOAT DETERMINISTIC
BEGIN
    DECLARE volatility FLOAT DEFAULT 0;
    DECLARE i INT DEFAULT 0;
    DECLARE current_price FLOAT DEFAULT 0;
    DECLARE previous_price FLOAT DEFAULT 0;

    IF type_price = 'open' THEN
        SET current_price  = (SELECT open FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date ASC LIMIT 1 OFFSET i);
        SET previous_price = (SELECT open FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i + 1);
        IF previous_price IS NOT NULL THEN
            SET volatility = 100 * ((current_price - previous_price) / previous_price);
            
        END IF;

    ELSEIF type_price = 'close' THEN
        SET current_price  = (SELECT close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i);
        SET previous_price = (SELECT close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i + 1);
        IF previous_price IS NOT NULL THEN
            SET volatility = 100 * ((current_price - previous_price) / previous_price);
            
        END IF;

    ELSEIF type_price = 'adj_close' THEN
        SET current_price  = (SELECT adj_close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i);
        SET previous_price = (SELECT adj_close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i + 1);
        IF previous_price IS NOT NULL THEN
            SET volatility = 100 * ((current_price - previous_price) / previous_price);
            
        END IF;

    END IF;
    RETURN volatility;
END //
DELIMITER ;


DELIMITER //
CREATE OR REPLACE FUNCTION calculate_anomaly(ticker_id INT, year INT, month INT, type_price VARCHAR(10))
RETURNS FLOAT DETERMINISTIC
BEGIN
    DECLARE anomaly FLOAT DEFAULT 0;
    DECLARE i INT DEFAULT 0;
    DECLARE current_price FLOAT DEFAULT 0;
    DECLARE previous_price FLOAT DEFAULT 0;

    IF type_price = 'open' THEN
        SET current_price  = (SELECT open FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date ASC LIMIT 1 OFFSET i);
        SET previous_price = (SELECT open FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i + 1);
        IF previous_price IS NOT NULL THEN
            SET anomaly = 100 * ((current_price - previous_price) / previous_price);
            
        END IF;

    ELSEIF type_price = 'close' THEN
        SET current_price  = (SELECT close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i);
        SET previous_price = (SELECT close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i + 1);
        IF previous_price IS NOT NULL THEN
            SET anomaly = 100 * ((current_price - previous_price) / previous_price);
            
        END IF;

    ELSEIF type_price = 'adj_close' THEN
        SET current_price  = (SELECT adj_close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i);
        SET previous_price = (SELECT adj_close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i + 1);
        IF previous_price IS NOT NULL THEN
            SET anomaly = 100 * ((current_price - previous_price) / previous_price);
            
        END IF;

    END IF;
    RETURN anomaly;
END //
DELIMITER ;
DELIMITER //
CREATE OR REPLACE FUNCTION calculate_anomaly_volume(ticker_id VARCHAR(191), year INT, month INT)
RETURNS FLOAT DETERMINISTIC
BEGIN
    DECLARE anomaly_volume FLOAT DEFAULT 0;
    DECLARE i INT DEFAULT 0;
    DECLARE current_volume BIGINT DEFAULT 0;
    DECLARE previous_volume BIGINT DEFAULT 0;

    SET current_volume  = (SELECT volume FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date ASC LIMIT 1 OFFSET i);
    SET previous_volume = (SELECT volume FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) <= year AND MONTH(date) <= month ORDER BY date DESC LIMIT 1 OFFSET i + 1);
    
    IF previous_volume IS NOT NULL THEN
        SET anomaly_volume = 100 * ((current_volume - previous_volume) / previous_volume);
        
    END IF;

    RETURN anomaly_volume;
END //
DELIMITER ;

DELIMITER //

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


DELIMITER //
CREATE FUNCTION med_stat(
    data_type VARCHAR(2),
    ticker_id INT,
    year INT DEFAULT 2024
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

    -- Count the number of records for the given ticker, year, and month
    SET ticker_id = NEW.id_ticker;
    -- SET month = MONTH(NEW.date);
    -- SET year = YEAR(NEW.date);

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