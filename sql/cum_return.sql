DROP TABLE IF EXISTS cum_return;

CREATE TABLE cum_return (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    id_ticker INT NOT NULL,
    date DATE NOT NULL,
    value FLOAT NOT NULL,
    FOREIGN KEY (id_ticker) REFERENCES ticker(id) ON DELETE CASCADE
);

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



DROP PROCEDURE IF EXISTS insert_cum_return;

DELIMITER //

CREATE PROCEDURE insert_cum_return(
    IN ticker_id INT,
    IN curr_date DATE,
    IN p_id INT
)
BEGIN
    DECLARE counter INT; 
    DECLARE v_json JSON;
    DECLARE v_open, v_high, v_low, v_close, v_adj_close FLOAT DEFAULT 0;

    SELECT count(*) INTO counter 
        FROM stock_market_data 
        WHERE id_ticker = ticker_id
        AND YEAR(date) = YEAR(curr_date)
        AND id = p_id;

    SET v_json = get_cum_return(ticker_id, curr_date);
    SET v_open = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.open'));
    SET v_high = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.high'));
    SET v_low = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.low'));
    SET v_close = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.close'));
    SET v_adj_close = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.adj_close'));

    INSERT INTO cumulative_return (
        id_ticker, cum_return_open, cum_return_high,
        cum_return_low, cum_return_close, cum_return_adj_close, date
    )
    VALUES (
        ticker_id, v_open, v_high, v_low, v_close, v_adj_close, curr_date
    );

END //

DELIMITER ;
