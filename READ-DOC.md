+-------------------------+
| Tables_in_green_finance |
+-------------------------+
| cum_return              |
| drawdown_results        |
| indicator_ema           |
| indicator_macd          |
| indicator_rsi           |
| indicator_sma           |
| rsi_signals             |
| stat_annual             |
| stock_market_data       |
| story_data              |
| ticker                  |
| yield                   |
+-------------------------+

mysql> SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_STATEMENT, ACTION_TIMING
    -> FROM INFORMATION_SCHEMA.TRIGGERS
    -> WHERE TRIGGER_SCHEMA = 'green_finance';
+---------------------------------+--------------------+--------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------+
| TRIGGER_NAME                    | EVENT_MANIPULATION | EVENT_OBJECT_TABLE | ACTION_STATEMENT                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ACTION_TIMING |
+---------------------------------+--------------------+--------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------+
| before_insert_stock_market_data | INSERT             | stock_market_data  | BEGIN
    IF NEW.date > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La date ne peut pas être dans le futur';
    END IF;
END                                                                                                                                                                                                                                                                                                                                                                                                                                                       | BEFORE        |
| after_delete_stock_market_data  | DELETE             | stock_market_data  | BEGIN

    DELETE FROM yield
    WHERE id_ticker = OLD.id_ticker AND date = OLD.date;


    DELETE FROM cum_return
    WHERE id_ticker = OLD.id_ticker AND date = OLD.date;
END                                                                                                                                                                                                                                                                                                                                                                                                                           | AFTER         |
| after_insert_stock_market_data  | INSERT             | stock_market_data  | BEGIN
    DECLARE prev_close FLOAT DEFAULT 0;
    DECLARE counter INT DEFAULT 0;
    DECLARE years INT;

    SET years = YEAR(NEW.date);

    SET counter = (SELECT COUNT(*) FROM stock_market_data WHERE id_ticker = NEW.id_ticker);
    SET prev_close = (SELECT close FROM stock_market_data WHERE id_ticker = NEW.id_ticker AND id < NEW.id ORDER BY date DESC LIMIT 1);

    CALL CalculateDrawdownToTable(years, NEW.id_ticker);
    CALL insert_yield(NEW.id_ticker, NEW.date);
    CALL insert_cum_return(NEW.id_ticker, NEW.date);
    CALL set_rsi(NEW.id_ticker, NEW.date, prev_close, NEW.close);
END | AFTER         |
+---------------------------------+--------------------+--------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------+
3 rows in set (0.00 sec)

mysql>
mysql> SELECT TRIGGER_NAME
    -> FROM INFORMATION_SCHEMA.TRIGGERS
    -> WHERE TRIGGER_SCHEMA = 'green_finance';
+---------------------------------+
| TRIGGER_NAME                    |
+---------------------------------+
| before_insert_stock_market_data |
| after_delete_stock_market_data  |
| after_insert_stock_market_data  |
+---------------------------------+
3 rows in set (0.00 sec)

mysql>

mysql>
mysql> SELECT TRIGGER_NAME
    -> FROM INFORMATION_SCHEMA.TRIGGERS
    -> WHERE TRIGGER_SCHEMA = 'green_finance';
+---------------------------------+
| TRIGGER_NAME                    |
+---------------------------------+
| before_insert_stock_market_data |
| after_delete_stock_market_data  |
| after_insert_stock_market_data  |
+---------------------------------+
3 rows in set (0.00 sec)

mysql> SELECT ROUTINE_NAME, ROUTINE_TYPE, DTD_IDENTIFIER, ROUTINE_DEFINITION
    -> FROM INFORMATION_SCHEMA.ROUTINES
    -> WHERE ROUTINE_SCHEMA = 'green_finance';
+--------------------------+--------------+----------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ROUTINE_NAME             | ROUTINE_TYPE | DTD_IDENTIFIER | ROUTINE_DEFINITION                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
+--------------------------+--------------+----------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| check_rsi_condition      | FUNCTION     | tinyint(1)     | BEGIN
  DECLARE old_rsi FLOAT;
  DECLARE old_price FLOAT;


  SELECT r.rsi_14, smd.close
  INTO old_rsi, old_price
  FROM indicator_rsi r
  JOIN stock_market_data smd ON r.id_ticker = smd.id_ticker AND r.date = smd.date
  WHERE r.id_ticker = in_ticker_id AND r.date = DATE_SUB(in_date, INTERVAL 10 DAY);


  IF in_rsi IS NOT NULL AND old_rsi IS NOT NULL
     AND in_price < old_price
     AND in_rsi > old_rsi THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| daily_return             | FUNCTION     | float          | BEGIN
    DECLARE initial_price FLOAT DEFAULT NULL;
    DECLARE final_price FLOAT DEFAULT NULL;


    SELECT close INTO final_price
    FROM stock_market_data
    WHERE id_ticker = p_id_ticker AND date = p_date
    LIMIT 1;


    SELECT close INTO initial_price
    FROM stock_market_data
    WHERE id_ticker = p_id_ticker AND date < p_date
    ORDER BY date DESC
    LIMIT 1;


    IF initial_price IS NULL OR initial_price = 0 THEN
        RETURN 0;
    END IF;

    RETURN 100 * ((final_price - initial_price) / initial_price);
END                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| get_cum_return           | FUNCTION     | json           | BEGIN
    DECLARE v_open_start, v_high_start, v_low_start, v_close_start, v_adj_start FLOAT DEFAULT NULL;
    DECLARE v_open_curr, v_high_curr, v_low_curr, v_close_curr, v_adj_curr FLOAT DEFAULT NULL;


    SELECT open, high, low, close, adj_close
    INTO v_open_curr, v_high_curr, v_low_curr, v_close_curr, v_adj_curr
    FROM stock_market_data
    WHERE id_ticker = p_id_ticker AND date = p_date
    LIMIT 1;


    SELECT open, high, low, close, adj_close
    INTO v_open_start, v_high_start, v_low_start, v_close_start, v_adj_start
    FROM stock_market_data
    WHERE id_ticker = p_id_ticker AND date < p_date
    ORDER BY date DESC
    LIMIT 1;


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
END |
| median_annual            | FUNCTION     | float          | BEGIN
    DECLARE median_value FLOAT DEFAULT 0;
    DECLARE counter INT DEFAULT 0;
    DECLARE d1 FLOAT DEFAULT 0;
    DECLARE d2 FLOAT DEFAULT 0;
    DECLARE pos1, pos2, pos INT;


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
END |
| skewness_annual          | FUNCTION     | float          | BEGIN
    DECLARE n INT DEFAULT 0;
    DECLARE mean_val FLOAT DEFAULT 0;
    DECLARE std_dev FLOAT DEFAULT 0;
    DECLARE skew FLOAT DEFAULT 0;


    SELECT COUNT(*) INTO n
    FROM stock_market_data
    WHERE id_ticker = ticker_id
    AND YEAR(date) = year;

    IF n = 0 THEN
        RETURN NULL;
    END IF;


    SELECT AVG(close) INTO mean_val
        FROM stock_market_data
        WHERE id_ticker = ticker_id AND YEAR(date) = year;


    SELECT STDDEV(close) INTO std_dev
        FROM stock_market_data
        WHERE id_ticker = ticker_id AND YEAR(date) = year;

    IF std_dev = 0 THEN
        RETURN 0;
    END IF;


    SELECT SUM(POWER((close - mean_val) / std_dev, 3)) / n INTO skew
    FROM stock_market_data
    WHERE id_ticker = ticker_id AND YEAR(date) = year;

    RETURN skew;
END                                                                                                                                                                                                                  |
| CalculateDrawdownToTable | PROCEDURE    | NULL           | BEGIN

    DELETE FROM drawdown_results WHERE id_ticker = input_ticker AND year = input_year;


    INSERT INTO drawdown_results (id_ticker, date, drawdown_pct, max_drawdown_pct, year)
    SELECT
        id_ticker,
        date,
        drawdown_pct,
        max_drawdown_pct_so_far AS max_drawdown_pct,
        YEAR(date) AS year
    FROM (
        SELECT
            date,
            id_ticker,
            drawdown_pct,
            MAX(drawdown_pct) OVER (
                PARTITION BY id_ticker
                ORDER BY date
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS max_drawdown_pct_so_far
        FROM (
            SELECT
                date,
                id_ticker,
                close,
                MAX(close) OVER (
                    PARTITION BY id_ticker
                    ORDER BY date
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ) AS rolling_peak,
                ROUND(100 * (MAX(close) OVER (
                    PARTITION BY id_ticker
                    ORDER BY date
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ) - close) / MAX(close) OVER (
                    PARTITION BY id_ticker
                    ORDER BY date
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ), 2) AS drawdown_pct
            FROM stock_market_data
            WHERE YEAR(date) = input_year AND id_ticker = input_ticker
        ) AS drawdowns
    ) AS max_drawdowns
    ORDER BY date;
END |
| detect_rsi_signals       | PROCEDURE    | NULL           | BEGIN
  DECLARE i INT DEFAULT 11;
  DECLARE total INT;
  DECLARE id_rsi INT;
  DECLARE rsi_curr FLOAT;
  DECLARE rsi_prev FLOAT;
  DECLARE rsi_prev10 FLOAT;
  DECLARE price_curr FLOAT;
  DECLARE price_prev FLOAT;
  DECLARE price_prev10 FLOAT;

  DELETE FROM rsi_signals
  WHERE id_rsi IN (
    SELECT id FROM indicator_rsi
    WHERE id_ticker = in_ticker_id
  );

    SET @rownum := 0;
  DROP TEMPORARY TABLE IF EXISTS temp_rsi;
  CREATE TEMPORARY TABLE temp_rsi AS
  SELECT
    @rownum := @rownum + 1 AS rownum,
    r.id AS id_rsi,
    r.date,
    CASE in_period
      WHEN 7 THEN r.rsi_7
      WHEN 14 THEN r.rsi_14
      WHEN 21 THEN r.rsi_21
    END AS rsi,
    smd.close AS close_price
  FROM indicator_rsi r
  JOIN stock_market_data smd ON r.date = smd.date AND r.id_ticker = smd.id_ticker,
  (SELECT @rownum := 0) rn
  WHERE r.id_ticker = in_ticker_id
  ORDER BY r.date;

  SELECT COUNT(*) INTO total FROM temp_rsi;

  WHILE i <= total DO
    SELECT id_rsi, rsi, close_price INTO id_rsi, rsi_curr, price_curr
    FROM temp_rsi WHERE rownum = i;

    SELECT rsi, close_price INTO rsi_prev, price_prev
    FROM temp_rsi WHERE rownum = i - 1;

    SELECT rsi, close_price INTO rsi_prev10, price_prev10
    FROM temp_rsi WHERE rownum = i - 10;

    IF rsi_prev < in_overbought AND rsi_curr >= in_overbought THEN
      INSERT INTO rsi_signals (id_rsi, signal_type, description, signal_label)
      VALUES (id_rsi, 'Surachat', CONCAT('RSI passé au-dessus de ', in_overbought), 'Vente potentielle');
    END IF;

    IF rsi_prev >= in_overbought AND rsi_curr < in_overbought THEN
      INSERT INTO rsi_signals (id_rsi, signal_type, description, signal_label)
      VALUES (id_rsi, 'Sortie de surachat', CONCAT('RSI repassé sous ', in_overbought), 'Confirmation de vente');
    END IF;

    IF rsi_prev <= in_oversold AND rsi_curr > in_oversold THEN
      INSERT INTO rsi_signals (id_rsi, signal_type, description, signal_label)
      VALUES (id_rsi, 'Sortie de survente', CONCAT('RSI remonté au-dessus de ', in_oversold), 'Confirmation d'achat');
    END IF;

    IF rsi_curr IS NOT NULL AND rsi_prev10 IS NOT NULL
       AND price_curr < price_prev10 AND rsi_curr > rsi_prev10 THEN
      INSERT INTO rsi_signals (id_rsi, signal_type, description, signal_label)
      VALUES (id_rsi, 'Divergence haussière', 'Le prix fait un plus bas, mais le RSI fait un plus bas plus haut', 'Achat potentiel');
    END IF;

    SET i = i + 1;
  END WHILE;

  DROP TEMPORARY TABLE IF EXISTS temp_rsi;
END |
| insert_cum_return        | PROCEDURE    | NULL           | BEGIN
    DECLARE v_json JSON;
    DECLARE v_open, v_high, v_low, v_close, v_adj_close FLOAT;

    SET v_json = get_cum_return(p_id_ticker, p_date);

    SET v_open = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.open'));
    SET v_high = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.high'));
    SET v_low = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.low'));
    SET v_close = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.close'));
    SET v_adj_close = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.adj_close'));

    INSERT INTO cum_return (
        id_ticker, date, open_return, high_return,
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
END                                                                                                                                 |
| insert_yield             | PROCEDURE    | NULL           | BEGIN
    DECLARE yield_val FLOAT;

    SET yield_val = daily_return(p_id_ticker, p_date);

    INSERT INTO yield (id_ticker, date, value)
    VALUES (p_id_ticker, p_date, yield_val)
    ON DUPLICATE KEY UPDATE value = yield_val;
END                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| set_rsi                  | PROCEDURE    | NULL           | BEGIN
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
            SET v_gain_7  = (p_gain_7 * 6 + delta) / 7;
            SET v_gain_14 = (p_gain_14 * 13 + delta) / 14;
            SET v_gain_21 = (p_gain_21 * 20 + delta) / 21;
            SET v_loss_7  = p_loss_7 * 6 / 7;
            SET v_loss_14 = p_loss_14 * 13 / 14;
            SET v_loss_21 = p_loss_21 * 20 / 21;
        ELSEIF delta < 0 THEN
            SET v_loss_7  = (p_loss_7 * 6 + (-delta)) / 7;
            SET v_loss_14 = (p_loss_14 * 13 + (-delta)) / 14;
            SET v_loss_21 = (p_loss_21 * 20 + (-delta)) / 21;
            SET v_gain_7  = p_gain_7 * 6 / 7;
            SET v_gain_14 = p_gain_14 * 13 / 14;
            SET v_gain_21 = p_gain_21 * 20 / 21;
        ELSE

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
END |
+--------------------------+--------------+----------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
10 rows in set (0.00 sec)

mysql>
mysql> SELECT ROUTINE_NAME
    -> FROM INFORMATION_SCHEMA.ROUTINES
    -> WHERE ROUTINE_SCHEMA = 'green_finance';
+--------------------------+
| ROUTINE_NAME             |
+--------------------------+
| check_rsi_condition      |
| daily_return             |
| get_cum_return           |
| median_annual            |
| skewness_annual          |
| CalculateDrawdownToTable |
| detect_rsi_signals       |
| insert_cum_return        |
| insert_yield             |
| set_rsi                  |
+--------------------------+
10 rows in set (0.00 sec)

mysql>