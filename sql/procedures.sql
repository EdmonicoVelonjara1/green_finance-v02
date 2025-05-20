DROP PROCEDURE IF EXISTS set_rsi;
DELIMITER //

CREATE PROCEDURE set_rsi (
    IN ticker_id INT,
    IN smd_date DATE,
    IN v_init_price FLOAT,
    IN v_final_price FLOAT
)
BEGIN 
    DECLARE delta, sum FLOAT DEFAULT 0;
    DECLARE v_gain_7, v_loss_7 FLOAT DEFAULT 0;
    DECLARE v_gain_14, v_loss_14 FLOAT DEFAULT 0;
    DECLARE v_gain_21, v_loss_21 FLOAT DEFAULT 0;

    DECLARE avg_gain_7, avg_loss_7 FLOAT DEFAULT 0;
    DECLARE avg_gain_14, avg_loss_14 FLOAT DEFAULT 0;
    DECLARE avg_gain_21, avg_loss_21 FLOAT DEFAULT 0;

    DECLARE rs_7, rs_14, rs_21 FLOAT DEFAULT 0;
    DECLARE v_rsi_7, v_rsi_14, v_rsi_21 FLOAT DEFAULT 0;

    DECLARE p_gain_7, p_loss_7 FLOAT DEFAULT 0;
    DECLARE p_gain_14, p_loss_14 FLOAT DEFAULT 0;
    DECLARE p_gain_21, p_loss_21 FLOAT DEFAULT 0;

    DECLARE counter INT DEFAULT 0;
    DECLARE p_rsi_id INT DEFAULT 1;

    SET counter = (SELECT COUNT(*) FROM indicator_rsi WHERE id_ticker = ticker_id);    
    SET p_rsi_id = (SELECT MAX(id) FROM indicator_rsi WHERE id_ticker = ticker_id);

    SET delta = v_final_price - v_init_price;
    SET sum = v_final_price + v_init_price;

    IF counter = 2 THEN
        -- Calcul initial des moyennes sur la base de deux données (à améliorer si possible)
        IF delta > 0 THEN
            SET v_gain_7 = delta;
            SET v_gain_14 = delta;
            SET v_gain_21 = delta;
        ELSEIF delta < 0 THEN
            SET v_loss_7 = -delta;
            SET v_loss_14 = -delta;
            SET v_loss_21 = -delta;
        END IF;

        SET avg_gain_7 = (sum + v_gain_7) / 7;
        SET avg_loss_7 = (sum + v_loss_7) / 7;
        SET avg_gain_14 = (sum + v_gain_14) / 14;
        SET avg_loss_14 = (sum + v_loss_14) / 14;
        SET avg_gain_21 = (sum + v_gain_21) / 21;
        SET avg_loss_21 = (sum + v_loss_21) / 21;

    ELSEIF counter > 2 THEN
        -- Récupérer les gains/pertes précédents
        SET p_gain_7  = (SELECT gain_7 FROM indicator_rsi WHERE id = p_rsi_id);
        SET p_loss_7  = (SELECT loss_7 FROM indicator_rsi WHERE id = p_rsi_id);
        SET p_gain_14 = (SELECT gain_14 FROM indicator_rsi WHERE id = p_rsi_id);
        SET p_loss_14 = (SELECT loss_14 FROM indicator_rsi WHERE id = p_rsi_id);
        SET p_gain_21 = (SELECT gain_21 FROM indicator_rsi WHERE id = p_rsi_id);
        SET p_loss_21 = (SELECT loss_21 FROM indicator_rsi WHERE id = p_rsi_id);

        IF delta > 0 THEN
            SET v_gain_7  = (p_gain_7 * 6 + delta) / 7;
            SET v_gain_14 = (p_gain_14 * 13 + delta) / 14;
            SET v_gain_21 = (p_gain_21 * 20 + delta) / 21;
            SET v_loss_7  = p_loss_7 * 6 / 7;    -- perte lissée sans nouvelle perte
            SET v_loss_14 = p_loss_14 * 13 / 14;
            SET v_loss_21 = p_loss_21 * 20 / 21;
        ELSEIF delta < 0 THEN
            SET v_loss_7  = (p_loss_7 * 6 + (-delta)) / 7;
            SET v_loss_14 = (p_loss_14 * 13 + (-delta)) / 14;
            SET v_loss_21 = (p_loss_21 * 20 + (-delta)) / 21;
            SET v_gain_7  = p_gain_7 * 6 / 7;   -- gain lissé sans nouveau gain
            SET v_gain_14 = p_gain_14 * 13 / 14;
            SET v_gain_21 = p_gain_21 * 20 / 21;
        ELSE
            -- Pas de changement
            SET v_gain_7  = p_gain_7;
            SET v_loss_7  = p_loss_7;
            SET v_gain_14 = p_gain_14;
            SET v_loss_14 = p_loss_14;
            SET v_gain_21 = p_gain_21;
            SET v_loss_21 = p_loss_21;
        END IF;

        SET avg_gain_7 = v_gain_7;
        SET avg_loss_7 = v_loss_7;
        SET avg_gain_14 = v_gain_14;
        SET avg_loss_14 = v_loss_14;
        SET avg_gain_21 = v_gain_21;
        SET avg_loss_21 = v_loss_21;
    END IF;

    -- Calcul du RS avec gestion de la division par zéro
    IF avg_loss_7 = 0 THEN
        SET rs_7 = 1e10;
    ELSE
        SET rs_7 = avg_gain_7 / avg_loss_7;
    END IF;

    IF avg_loss_14 = 0 THEN
        SET rs_14 = 1e10;
    ELSE
        SET rs_14 = avg_gain_14 / avg_loss_14;
    END IF;

    IF avg_loss_21 = 0 THEN
        SET rs_21 = 1e10;
    ELSE
        SET rs_21 = avg_gain_21 / avg_loss_21;
    END IF;

    -- Calcul RSI
    SET v_rsi_7 = 100 - 100 / (1 + rs_7);
    SET v_rsi_14 = 100 - 100 / (1 + rs_14);
    SET v_rsi_21 = 100 - 100 / (1 + rs_21);

    -- Insertion dans la table indicator_rsi
    INSERT INTO indicator_rsi (
        id_ticker,
        loss_7, gain_7, rsi_7,
        loss_14, gain_14, rsi_14,
        loss_21, gain_21, rsi_21,
        date
    ) VALUES (
        ticker_id,
        v_loss_7, v_gain_7, v_rsi_7,
        v_loss_14, v_gain_14, v_rsi_14,
        v_loss_21, v_gain_21, v_rsi_21,
        smd_date
    );
END //
DELIMITER ;

-- Procédure pour insérer le rendement quotidien
DROP PROCEDURE IF EXISTS insert_yield;

DELIMITER //
CREATE PROCEDURE insert_yield(
    IN p_id_ticker INT,
    IN p_date DATE
)
BEGIN
    DECLARE yield_val FLOAT;

    SET yield_val = daily_return(p_id_ticker, p_date);

    INSERT INTO yield (id_ticker, date, value)
    VALUES (p_id_ticker, p_date, yield_val)
    ON DUPLICATE KEY UPDATE value = yield_val;
END //
DELIMITER ;

-- Procédure pour insérer les rendements cumulés
DROP PROCEDURE IF EXISTS insert_cum_return;
DELIMITER //
CREATE PROCEDURE insert_cum_return(
    IN p_id_ticker INT,
    IN p_date DATE
)
BEGIN
    DECLARE v_json JSON;
    DECLARE v_open, v_high, v_low, v_close, v_adj_close FLOAT;

    SET v_json = get_cum_return(p_id_ticker, p_date);

    SET v_open = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.open'));
    SET v_high = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.high'));
    SET v_low = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.low'));
    SET v_close = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.close'));
    SET v_adj_close = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.adj_close'));

    INSERT INTO cum_return (
        id_ticker, date, high_return,
        low_return, close_return, adj_close_return
    )
    VALUES (
        p_id_ticker, p_date, v_open, v_high, v_low, v_close, v_adj_close
    )
    ON DUPLICATE KEY UPDATE
        open_return = v_open,
        high_return = v_high,
        low_return = v_low,
        close_return = v_close,
        adj_close_return = v_adj_close;
END //
DELIMITER ;


DROP PROCEDURE IF EXISTS calculate_ema;
DELIMITER $$

CREATE PROCEDURE calculate_ema (
    IN in_ticker INT,
    IN in_period INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE curr_date DATE;
    DECLARE prev_ema FLOAT DEFAULT NULL;
    DECLARE alpha FLOAT;
    DECLARE curr_price FLOAT;

    -- Curseur pour parcourir les dates dans l'ordre
    DECLARE cur_dates CURSOR FOR 
        SELECT date, adj_close FROM stock_market_data 
        WHERE id_ticker = in_ticker ORDER BY date ASC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Calcul du coefficient de lissage alpha
    SET alpha = 2 / (in_period + 1);

    OPEN cur_dates;

    read_loop: LOOP
        FETCH cur_dates INTO curr_date, curr_price;
        IF done THEN
            LEAVE read_loop;
        END IF;

        IF prev_ema IS NULL THEN
            -- Première valeur EMA = SMA de la période (ou juste la première valeur ici)
            SET prev_ema = curr_price;
        ELSE
            -- Calcul EMA récursif
            SET prev_ema = alpha * curr_price + (1 - alpha) * prev_ema;
        END IF;

        -- Insérer ou mettre à jour la table avec la valeur EMA calculée pour curr_date
        INSERT INTO indicator_ema (id_ticker, date, ema_period, ema_value)
        VALUES (in_ticker, curr_date, in_period, prev_ema)
        ON DUPLICATE KEY UPDATE ema_value = prev_ema;

    END LOOP;

    CLOSE cur_dates;
END$$

DELIMITER ;

