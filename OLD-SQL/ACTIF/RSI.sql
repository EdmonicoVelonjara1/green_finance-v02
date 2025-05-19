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
        SET p_gain_7  = (SELECT gain_7 FROM indicator_rsi WHERE id = p_rsi_id);
        SET p_loss_7  = (SELECT loss_7 FROM indicator_rsi WHERE id = p_rsi_id);
        SET p_gain_14 = (SELECT gain_14 FROM indicator_rsi WHERE id = p_rsi_id);
        SET p_loss_14 = (SELECT loss_14 FROM indicator_rsi WHERE id = p_rsi_id);
        SET p_gain_21 = (SELECT gain_21 FROM indicator_rsi WHERE id = p_rsi_id);
        SET p_loss_21 = (SELECT loss_21 FROM indicator_rsi WHERE id = p_rsi_id);

        IF delta > 0 THEN
            SET v_gain_7  = (delta * 6 + p_gain_7) / 7;
            SET v_gain_14 = (delta * 13 + p_gain_14) / 14;
            SET v_gain_21 = (delta * 20 + p_gain_21) / 21;
        ELSEIF delta < 0 THEN
            SET v_loss_7  = (-delta * 6 + p_loss_7) / 7;
            SET v_loss_14 = (-delta * 13 + p_loss_14) / 14;
            SET v_loss_21 = (-delta * 20 + p_loss_21) / 21;
        END IF;

        SET avg_gain_7 = v_gain_7;
        SET avg_loss_7 = v_loss_7;
        SET avg_gain_14 = v_gain_14;
        SET avg_loss_14 = v_loss_14;
        SET avg_gain_21 = v_gain_21;
        SET avg_loss_21 = v_loss_21;
    END IF;

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

    SET v_rsi_7 = 100 - 100 / (1 + rs_7);
    SET v_rsi_14 = 100 - 100 / (1 + rs_14);
    SET v_rsi_21 = 100 - 100 / (1 + rs_21);

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
END;
//
DELIMITER ;


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


