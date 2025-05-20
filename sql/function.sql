
DELETE FUNCTION IF EXISTS check_rsi_condition;
DELIMITER $$

CREATE FUNCTION check_rsi_condition(
  in_date DATE,
  in_ticker_id INT,
  in_rsi FLOAT,
  in_price FLOAT
)
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
  DECLARE old_rsi FLOAT;
  DECLARE old_price FLOAT;

  -- Récupérer RSI et prix 10 jours avant
  SELECT r.rsi_14, smd.close
  INTO old_rsi, old_price
  FROM indicator_rsi r
  JOIN stock_market_data smd ON r.id_ticker = smd.id_ticker AND r.date = smd.date
  WHERE r.id_ticker = in_ticker_id AND r.date = DATE_SUB(in_date, INTERVAL 10 DAY);

  -- Vérifier les conditions
  IF in_rsi IS NOT NULL AND old_rsi IS NOT NULL
     AND in_price < old_price
     AND in_rsi > old_rsi THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END$$

DELIMITER ;


-- Fonction pour calculer le rendement quotidien
DROP FUNCTION IF EXISTS daily_return;

DELIMITER //
CREATE FUNCTION daily_return(
    p_id_ticker INT,
    p_date DATE
)  
RETURNS FLOAT DETERMINISTIC
BEGIN
    DECLARE initial_price FLOAT DEFAULT NULL;
    DECLARE final_price FLOAT DEFAULT NULL;

    -- Récupérer le prix de clôture actuel
    SELECT close INTO final_price
    FROM stock_market_data
    WHERE id_ticker = p_id_ticker AND date = p_date
    LIMIT 1;

    -- Récupérer le prix de clôture précédent
    SELECT close INTO initial_price
    FROM stock_market_data
    WHERE id_ticker = p_id_ticker AND date < p_date
    ORDER BY date DESC
    LIMIT 1;

    -- Si pas de prix précédent ou prix nul, retourner 0
    IF initial_price IS NULL OR initial_price = 0 THEN
        RETURN 0;
    END IF;

    RETURN 100 * ((final_price - initial_price) / initial_price);
END //
DELIMITER ;

-- Fonction pour calculer les rendements cumulés
DROP FUNCTION IF EXISTS get_cum_return;

DELIMITER //

CREATE FUNCTION get_cum_return(
    p_id_ticker INT,
    p_date DATE
)
RETURNS JSON DETERMINISTIC
BEGIN
    DECLARE v_open_start, v_high_start, v_low_start, v_close_start, v_adj_start FLOAT DEFAULT NULL;
    DECLARE v_open_curr, v_high_curr, v_low_curr, v_close_curr, v_adj_curr FLOAT DEFAULT NULL;

    -- Récupérer les données actuelles
    SELECT open, high, low, close, adj_close
    INTO v_open_curr, v_high_curr, v_low_curr, v_close_curr, v_adj_curr
    FROM stock_market_data
    WHERE id_ticker = p_id_ticker AND date = p_date
    LIMIT 1;

    -- Récupérer les données précédentes
    SELECT open, high, low, close, adj_close
    INTO v_open_start, v_high_start, v_low_start, v_close_start, v_adj_start
    FROM stock_market_data
    WHERE id_ticker = p_id_ticker AND date < p_date
    ORDER BY date DESC
    LIMIT 1;

    -- Si pas de données précédentes, retourner 0
    IF v_open_start IS NULL OR v_open_start = 0 THEN
        RETURN JSON_OBJECT(
            'open', 0,
            'high', 0,
            'low', 0,
            'close', 0,
            'adj_close', 0
        );
    END IF;

    RETURN JSON_OBJECT(
        'open', (v_open_curr / v_open_start) - 1,
        'high', (v_high_curr / v_high_start) - 1,
        'low', (v_low_curr / v_low_start) - 1,
        'close', (v_close_curr / v_close_start) - 1,
        'adj_close', (v_adj_curr / v_adj_start) - 1
    );
END //
DELIMITER ;

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

-- CREATE FUNCTION median(data_type VARCHAR(2))
-- RETURNS FLOAT DETERMINISTIC
-- BEGIN
--     DECLARE median_value FLOAT DEFAULT 0;
--     DECLARE counter INT DEFAULT 0;
--     DECLARE month, year, ticker_id INT;
--     DECLARE d1 FLOAT DEFAULT 0;
--     DECLARE d2 FLOAT DEFAULT 0;
--     DECLARE pos1, pos2 INT;
--     DECLARE pos INT;  -- Moved this declaration to the top with other DECLAREs

--     -- Count the number of records for the given ticker, year, and month
--     SET ticker_id = NEW.id_ticker;
--     SET month = MONTH(NEW.date);
--     SET year = YEAR(NEW.date);

--     SELECT COUNT(*), MONTH(date) INTO counter
--     FROM stock_market_data
--     WHERE id_ticker = ticker_id
--         AND YEAR(date) = year
--         AND MONTH(date) = month;

--     IF counter = 0 THEN
--         RETURN NULL;
--     END IF;

--     SET pos1 = (counter / 2 - 1); 
--     SET pos2 = (counter / 2); 

--     IF counter % 2 = 0 THEN
--         IF data_type = 'C' THEN
--             -- Fetch the two middle closing prices
--             SELECT close INTO d1
--             FROM stock_market_data
--             WHERE id_ticker = ticker_id
--                 AND YEAR(date) = year
--                 AND MONTH(date) = month
--             ORDER BY close
--             LIMIT 1 OFFSET pos1;

--             SELECT close INTO d2
--             FROM stock_market_data
--             WHERE id_ticker = ticker_id
--                 AND YEAR(date) = year
--                 AND MONTH(date) = month
--             ORDER BY close
--             LIMIT 1 OFFSET pos2;

--         ELSEIF data_type = 'V' THEN
--             -- Fetch the two middle volumes
--             SELECT volume INTO d1
--             FROM stock_market_data
--             WHERE id_ticker = ticker_id
--                 AND YEAR(NEW.date) = year
--                 AND MONTH(NEW.date) = month
--             ORDER BY volume
--             LIMIT 1 OFFSET pos1;

--             SELECT volume INTO d2
--             FROM stock_market_data
--             WHERE id_ticker = ticker_id
--                 AND YEAR(date) = year
--                 AND MONTH(date) = month
--             ORDER BY volume
--             LIMIT 1 OFFSET pos2;
--         ELSE
--             -- Invalid data_type
--             RETURN NULL;
--         END IF;

--         -- Calculate median as average of two middle values
--         SET median_value = (d1 + d2) / 2;
--     ELSE
--         SET pos = counter / 2; -- 0-based index for middle value

--         IF data_type = 'C' THEN
--             SELECT close INTO median_value
--             FROM stock_market_data
--             WHERE id_ticker = ticker_id
--                 AND YEAR(date) = year
--                 AND MONTH(date) = month
--             ORDER BY close
--             LIMIT 1 OFFSET pos;

--         ELSEIF data_type = 'V' THEN
--             -- Fetch the middle volume
--             SELECT volume INTO median_value
--             FROM stock_market_data
--             WHERE id_ticker = ticker_id
--                 AND YEAR(date) = year
--                 AND MONTH(date) = month
--             ORDER BY volume
--             LIMIT 1 OFFSET pos;
--         ELSE
--             -- Invalid data_type
--             RETURN NULL;
--         END IF;
--     END IF;

--     RETURN median_value;
-- END //
-- DELIMITER ;

