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
    p_date DATE,
    p_id_ticker INT,
    p_id INT
)
RETURNS JSON
DETERMINISTIC
BEGIN
    DECLARE v_open_start, v_high_start, v_low_start, v_close_start, v_adj_start FLOAT DEFAULT 0;
    DECLARE v_open_curr, v_high_curr, v_low_curr, v_close_curr, v_adj_curr FLOAT DEFAULT 0;

    IF p_id > 1 THEN
        SELECT open, high, low, close, adj_close
        INTO v_open_start, v_high_start, v_low_start, v_close_start, v_adj_start
        FROM stock_market_data
        WHERE id = p_id - 1
        LIMIT 1;

        SELECT open, high, low, close, adj_close
        INTO v_open_curr, v_high_curr, v_low_curr, v_close_curr, v_adj_curr
        FROM stock_market_data
        WHERE id = p_id
        LIMIT 1;
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

    -- SET v_json = get_cum_return(ticker_id, curr_date);
    SET v_json = get_cum_return(curr_date, ticker_id, counter);

    SET v_open = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.open'));
    SET v_high = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.high'));
    SET v_low = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.low'));
    SET v_close = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.close'));
    SET v_adj_close = JSON_UNQUOTE(JSON_EXTRACT(v_json, '$.adj_close'));

    INSERT INTO cum_return (
        id_ticker, cum_return_open, cum_return_high,
        cum_return_low, cum_return_close, cum_return_adj_close, date
    )
    VALUES (
        ticker_id, v_open, v_high, v_low, v_close, v_adj_close, curr_date
    );

END //

DELIMITER ;
