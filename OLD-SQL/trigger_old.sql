USE stock_data_analyzis;


DROP TRIGGER IF EXISTS before_insert_stock_market_data;
DELIMITER //

CREATE TRIGGER before_insert_stock_market_data
BEFORE INSERT ON stock_market_data
FOR EACH ROW
BEGIN
    -- Vérifier que les prix sont strictement positifs
    IF NEW.open <= 0 OR NEW.high <= 0 OR NEW.low <= 0 OR NEW.close <= 0 OR NEW.adj_close <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Les prix (open, high, low, close, adj_close) doivent être strictement positifs';
    END IF;

    -- Vérifier que le volume n’est pas négatif
    IF NEW.volume < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Le volume ne peut pas être négatif';
    END IF;

    -- Vérifier la cohérence des prix : high >= low
    IF NEW.high < NEW.low THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Le prix high doit être supérieur ou égal au prix low';
    END IF;

    -- Vérifier que open et close sont entre low et high
    IF NEW.open > NEW.high OR NEW.open < NEW.low 
        OR NEW.close > NEW.high OR NEW.close < NEW.low THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Les prix open et close doivent être compris entre low et high';
    END IF;
END //

DELIMITER ;





-- Trigger 1: Vérification des valeurs positives pour les prix et le volume dans stock_market_data
-- Objectif: S'assurer que les prix (open, high, low, close, adj_close) et le volume ne sont pas négatifs avant insertion.

-- DELIMITER //
-- CREATE TRIGGER before_insert_stock_market_data
-- BEFORE INSERT ON stock_market_data
-- FOR EACH ROW
-- BEGIN
--     IF NEW.open <= 0 OR NEW.high <= 0 OR NEW.low <= 0 OR NEW.close <= 0 OR NEW.adj_close <= 0 THEN
--         SIGNAL SQLSTATE '45000'
--         SET MESSAGE_TEXT = 'Les prix (open, high, low, close, adj_close) ne peuvent pas être négatifs';
--     END IF;
--     IF NEW.volume < 0 THEN
--         SIGNAL SQLSTATE '45000'
--         SET MESSAGE_TEXT = 'Le volume ne peut pas être négatif';
--     END IF;


-- END //
-- DELIMITER ;

-- DELIMITER //
-- CREATE TRIGGER before_insert_stock_market_data_price_coherence
-- BEFORE INSERT ON stock_market_data
-- FOR EACH ROW
-- BEGIN
--     IF NEW.high < NEW.low THEN
--         SIGNAL SQLSTATE '45000'
--         SET MESSAGE_TEXT = 'Le prix haut (high) doit être supérieur ou égal au prix bas (low)';
--     END IF;
--     IF NEW.open > NEW.high OR NEW.open < NEW.low OR NEW.close > NEW.high OR NEW.close < NEW.low THEN
--         SIGNAL SQLSTATE '45000'
--         SET MESSAGE_TEXT = 'Les prix open et close doivent être compris entre low et high';
--     END IF;
-- END //
-- DELIMITER ;

DELIMITER //
CREATE TRIGGER after_insert_cumulative_return
AFTER INSERT ON stock_market_data
FOR EACH ROW
BEGIN
    DECLARE first_open, first_high, first_low, first_close, first_adj_close FLOAT;
    
    -- Récupérer les premiers prix pour ce ticker
    SELECT open, high, low, close, adj_close
    INTO first_open, first_high, first_low, first_close, first_adj_close
    FROM stock_market_data
    WHERE id_ticker = NEW.id_ticker
    ORDER BY date ASC
    LIMIT 1;
    
    -- Calculer les rendements cumulés (en %)
    INSERT INTO cumulative_return (
        id_ticker,
        cum_return_open,
        cum_return_high,
        cum_return_low,
        cum_return_close,
        cum_return_adj_close,
        date
    )
    VALUES (
        NEW.id_ticker,
        IF(first_open != 0, ((NEW.open - first_open) / first_open) * 100, 0),
        IF(first_high != 0, ((NEW.high - first_high) / first_high) * 100, 0),
        IF(first_low != 0, ((NEW.low - first_low) / first_low) * 100, 0),
        IF(first_close != 0, ((NEW.close - first_close) / first_close) * 100, 0),
        IF(first_adj_close != 0, ((NEW.adj_close - first_adj_close) / first_adj_close) * 100, 0),
        NEW.date
    )
    ON DUPLICATE KEY UPDATE
        cum_return_open = IF(first_open != 0, ((NEW.open - first_open) / first_open) * 100, 0),
        cum_return_high = IF(first_high != 0, ((NEW.high - first_high) / first_high) * 100, 0),
        cum_return_low = IF(first_low != 0, ((NEW.low - first_low) / first_low) * 100, 0),
        cum_return_close = IF(first_close != 0, ((NEW.close - first_close) / first_close) * 100, 0),
        cum_return_adj_close = IF(first_adj_close != 0, ((NEW.adj_close - first_adj_close) / first_adj_close) * 100, 0),
        date = NEW.date;
END //
DELIMITER ;

-- Trigger 4: Mise à jour de la table trending après insertion dans stock_market_data
-- Objectif: Calculer les tendances (variation en % par rapport au jour précédent).
-- Formule: Tendance = ((Prix actuel - Prix précédent) / Prix précédent) * 100
DELIMITER //
CREATE TRIGGER after_insert_trending
AFTER INSERT ON stock_market_data
FOR EACH ROW
BEGIN
    DECLARE prev_open, prev_close, prev_adj_close FLOAT;
    
    -- Récupérer les prix du jour précédent
    SELECT open, close, adj_close
    INTO prev_open, prev_close, prev_adj_close
    FROM stock_market_data
    WHERE id_ticker = NEW.id_ticker AND date < NEW.date
    ORDER BY date DESC
    LIMIT 1;
    
    -- Insérer ou mettre à jour la table trending
    INSERT INTO trending (
        id_ticker,
        trend_open,
        trend_close,
        trend_adj_close,
        date
    )
    VALUES (
        NEW.id_ticker,
        IF(prev_open IS NOT NULL AND prev_open != 0, ((NEW.open - prev_open) / prev_open) * 100, 0),
        IF(prev_close IS NOT NULL AND prev_close != 0, ((NEW.close - prev_close) / prev_close) * 100, 0),
        IF(prev_adj_close IS NOT NULL AND prev_adj_close != 0, ((NEW.adj_close - prev_adj_close) / prev_adj_close) * 100, 0),
        NEW.date
    )
    ON DUPLICATE KEY UPDATE
        trend_open = IF(prev_open IS NOT NULL AND prev_open != 0, ((NEW.open - prev_open) / prev_open) * 100, 0),
        trend_close = IF(prev_close IS NOT NULL AND prev_close != 0, ((NEW.close - prev_close) / prev_close) * 100, 0),
        trend_adj_close = IF(prev_adj_close IS NOT NULL AND prev_adj_close != 0, ((NEW.adj_close - prev_adj_close) / prev_adj_close) * 100, 0),
        date = NEW.date;
END //
DELIMITER ;

-- Trigger 5: Mise à jour de la table volatility après insertion dans stock_market_data
-- Objectif: Calculer la volatilité (écart-type des rendements journaliers sur 20 jours).
-- Formule: Volatilité = SQRT(Variance des rendements journaliers) * SQRT(252) pour annualisation
DELIMITER //
CREATE TRIGGER after_insert_volatility
AFTER INSERT ON stock_market_data
FOR EACH ROW
BEGIN
    DECLARE vol_open, vol_close, vol_adj_close FLOAT;
    
    -- Calculer l'écart-type des rendements journaliers sur 20 jours
    SET vol_open = (
        SELECT STDDEV((smd2.open - smd1.open) / smd1.open * 100)
        FROM stock_market_data smd1
        JOIN stock_market_data smd2
        ON smd1.id_ticker = smd2.id_ticker
        AND smd1.date = (SELECT MAX(date) FROM stock_market_data WHERE id_ticker = smd1.id_ticker AND date < smd2.date)
        WHERE smd2.id_ticker = NEW.id_ticker
        AND smd2.date <= NEW.date
        AND smd2.date > DATE_SUB(NEW.date, INTERVAL 20 DAY)
        LIMIT 20
    );
    SET vol_close = (
        SELECT STDDEV((smd2.close - smd1.close) / smd1.close * 100)
        FROM stock_market_data smd1
        JOIN stock_market_data smd2
        ON smd1.id_ticker = smd2.id_ticker
        AND smd1.date = (SELECT MAX(date) FROM stock_market_data WHERE id_ticker = smd1.id_ticker AND date < smd2.date)
        WHERE smd2.id_ticker = NEW.id_ticker
        AND smd2.date <= NEW.date
        AND smd2.date > DATE_SUB(NEW.date, INTERVAL 20 DAY)
        LIMIT 20
    );
    SET vol_adj_close = (
        SELECT STDDEV((smd2.adj_close - smd1.adj_close) / smd1.adj_close * 100)
        FROM stock_market_data smd1
        JOIN stock_market_data smd2
        ON smd1.id_ticker = smd2.id_ticker
        AND smd1.date = (SELECT MAX(date) FROM stock_market_data WHERE id_ticker = smd1.id_ticker AND date < smd2.date)
        WHERE smd2.id_ticker = NEW.id_ticker
        AND smd2.date <= NEW.date
        AND smd2.date > DATE_SUB(NEW.date, INTERVAL 20 DAY)
        LIMIT 20
    );
    
    -- Annualiser la volatilité (racine de 252 jours de trading par an)
    SET vol_open = IFNULL(vol_open, 0) * SQRT(252);
    SET vol_close = IFNULL(vol_close, 0) * SQRT(252);
    SET vol_adj_close = IFNULL(vol_adj_close, 0) * SQRT(252);
    
    -- Insérer ou mettre à jour la table volatility
    INSERT INTO volatility (
        id_ticker,
        volatility_open,
        volatility_close,
        volatility_adj_close,
        date
    )
    VALUES (
        NEW.id_ticker,
        vol_open,
        vol_close,
        vol_adj_close,
        NEW.date
    )
    ON DUPLICATE KEY UPDATE
        volatility_open = vol_open,
        volatility_close = vol_close,
        volatility_adj_close = vol_adj_close,
        date = NEW.date;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER after_insert_indicators_technical
AFTER INSERT ON stock_market_data
FOR EACH ROW
BEGIN
    DECLARE sma_50, sma_200, ema_50, ema_200, rsi_14, macd, macd_signal, bollinger_upper, bollinger_lower FLOAT;
    DECLARE avg_gain, avg_loss, rs FLOAT;
    DECLARE ema_12, ema_26, prev_ema_50, prev_ema_200 FLOAT;
    DECLARE count_days INT;

    -- SMA 50 et 200 (moyenne simple sur 50 et 200 jours)
    SELECT AVG(close), COUNT(*)
    INTO sma_50, count_days
    FROM stock_market_data
    WHERE id_ticker = NEW.id_ticker
    AND date <= NEW.date
    AND date > DATE_SUB(NEW.date, INTERVAL 50 DAY);
    SET sma_50 = IF(count_days >= 50, sma_50, NULL);
    
    SELECT AVG(close), COUNT(*)
    INTO sma_200, count_days
    FROM stock_market_data
    WHERE id_ticker = NEW.id_ticker
    AND date <= NEW.date
    AND date > DATE_SUB(NEW.date, INTERVAL 200 DAY);
    SET sma_200 = IF(count_days >= 200, sma_200, NULL);
    
    -- EMA 50 et 200 (moyenne exponentielle)
    -- Récupérer l'EMA précédent
    SELECT ema_50, ema_200
    INTO prev_ema_50, prev_ema_200
    FROM indicators_technical
    WHERE id_ticker = NEW.id_ticker
    AND date < NEW.date
    ORDER BY date DESC
    LIMIT 1;
    
    -- Calculer EMA (k = 2/(N+1))
    SET ema_50 = IF(prev_ema_50 IS NULL, sma_50, (NEW.close * (2.0 / (50 + 1))) + (prev_ema_50 * (1 - (2.0 / (50 + 1)))));
    SET ema_200 = IF(prev_ema_200 IS NULL, sma_200, (NEW.close * (2.0 / (200 + 1))) + (prev_ema_200 * (1 - (2.0 / (200 + 1)))));
    
    -- RSI 14 (sur 14 jours)
    SELECT 
        AVG(CASE WHEN smd2.close > smd1.close THEN (smd2.close - smd1.close) ELSE 0 END),
        AVG(CASE WHEN smd2.close < smd1.close THEN (smd1.close - smd2.close) ELSE 0 END)
    INTO avg_gain, avg_loss
    FROM stock_market_data smd1
    JOIN stock_market_data smd2
    ON smd1.id_ticker = smd2.id_ticker
    AND smd1.date = (SELECT MAX(date) FROM stock_market_data WHERE id_ticker = smd1.id_ticker AND date < smd2.date)
    WHERE smd2.id_ticker = NEW.id_ticker
    AND smd2.date <= NEW.date
    AND smd2.date > DATE_SUB(NEW.date, INTERVAL 14 DAY);
    
    SET rs = IF(avg_loss = 0, NULL, avg_gain / avg_loss);
    SET rsi_14 = IF(rs IS NULL, NULL, 100 - (100 / (1 + rs)));
    
    -- MACD (EMA12 - EMA26)
    SELECT AVG(close)
    INTO ema_12
    FROM stock_market_data
    WHERE id_ticker = NEW.id_ticker
    AND date <= NEW.date
    AND date > DATE_SUB(NEW.date, INTERVAL 12 DAY);
    SELECT AVG(close)
    INTO ema_26
    FROM stock_market_data
    WHERE id_ticker = NEW.id_ticker
    AND date <= NEW.date
    AND date > DATE_SUB(NEW.date, INTERVAL 26 DAY);
    SET macd = IF(ema_12 IS NOT NULL AND ema_26 IS NOT NULL, ema_12 - ema_26, NULL);
    
    -- MACD Signal (EMA9 du MACD, simplifié ici)
    SET macd_signal = NULL; -- Nécessite historique MACD, mieux géré par procédure
    
    -- Bollinger Bands (sur 20 jours)
    SELECT AVG(close), STDDEV(close)
    INTO bollinger_upper, bollinger_lower
    FROM stock_market_data
    WHERE id_ticker = NEW.id_ticker
    AND date <= NEW.date
    AND date > DATE_SUB(NEW.date, INTERVAL 20 DAY);
    SET bollinger_upper = IF(bollinger_upper IS NOT NULL, bollinger_upper + 2 * bollinger_lower, NULL);
    SET bollinger_lower = IF(bollinger_upper IS NOT NULL, bollinger_upper - 4 * bollinger_lower, NULL); -- -2 * écart-type
    
    -- Insérer ou mettre à jour la table indicators_technical
    INSERT INTO indicators_technical (
        id_ticker,
        sma_50,
        sma_200,
        ema_50,
        ema_200,
        rsi_14,
        macd,
        macd_signal,
        bollinger_upper,
        bollinger_lower,
        date
    )
    VALUES (
        NEW.id_ticker,
        sma_50,
        sma_200,
        ema_50,
        ema_200,
        rsi_14,
        macd,
        macd_signal,
        bollinger_upper,
        bollinger_lower,
        NEW.date
    );
END //
DELIMITER ;

-- Trigger 7: Mise à jour de la table statistic après insertion dans stock_market_data
-- Objectif: Consolider les données des autres tables dans statistic.
DELIMITER //

CREATE OR REPLACE TRIGGER after_insert_statistic
AFTER INSERT ON stock_market_data
FOR EACH ROW
BEGIN
    DECLARE ticker_id INT;
    DECLARE counter INT;
    DECLARE avg_price, avg_volume, 
            median_price, median_volume,
            min_price, min_volume,
            max_price, max_volume,
            std_price, std_volume FLOAT;
    DECLARE month_val INT;
    DECLARE year_val INT;
    
    -- Capture the ticker and date from the new row
    SET ticker_id = NEW.id_ticker;
    SET month_val = MONTH(NEW.date); -- Extract month from NEW.date
    SET year_val = YEAR(NEW.date);   -- Extract year from NEW.date
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
CREATE OR REPLACE FUNCTION calculate_trend_price(ticker_id INT, year INT, month INT, type_price VARCHAR(10))  
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
