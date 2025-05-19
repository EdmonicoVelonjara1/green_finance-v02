CREATE DATABASE IF NOT EXISTS green_finance;
USE green_finance;

CREATE TABLE IF NOT EXISTS ticker (
    id INT PRIMARY KEY NOT NULL,    
    name VARCHAR(100),
    full_name VARCHAR(100)
);

-- Table de données boursières
CREATE TABLE IF NOT EXISTS stock_market_data(
    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    id_ticker INT NOT NULL,
    date DATE,
    open FLOAT NOT NULL,
    high FLOAT NOT NULL,
    low FLOAT NOT NULL,
    close FLOAT NOT NULL,
    adj_close FLOAT NOT NULL,
    volume BIGINT NOT NULL,
    FOREIGN KEY (id_ticker) REFERENCES ticker(id)
);

DROP TRIGGER IF EXISTS before_insert_stock_market_data;
DELIMITER //

CREATE TRIGGER before_insert_stock_market_data
BEFORE INSERT ON stock_market_data
FOR EACH ROW
BEGIN
    IF NEW.open <= 0 OR NEW.high <= 0 OR NEW.low <= 0 OR NEW.close <= 0 OR NEW.adj_close <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Les prix (open, high, low, close, adj_close) doivent être strictement positifs';
    END IF;
    IF NEW.volume < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Le volume ne peut pas être négatif';
    END IF;
    IF NEW.high < NEW.low THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Le prix high doit être supérieur ou égal au prix low';
    END IF;

    IF NEW.open > NEW.high OR NEW.open < NEW.low 
        OR NEW.close > NEW.high OR NEW.close < NEW.low THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Les prix open et close doivent être compris entre low et high';
    END IF;
END //

DELIMITER ;


DROP TRIGGER IF EXISTS after_insert_stock_market_data;

DELIMITER //

CREATE TRIGGER after_insert_stock_market_data
AFTER INSERT ON stock_market_data
FOR EACH ROW
BEGIN

    CALL insert_yield(NEW.date, NEW.id_ticker,NEW.id);
    CALL insert_cum_return(NEW.date, NEW.id_ticker,NEW.id);

END //

DELIMITER ;

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


DROP TABLE IF EXISTS yield;

CREATE TABLE yield (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    id_ticker INT NOT NULL,
    date DATE NOT NULL,
    value FLOAT NOT NULL,
    FOREIGN KEY (id_ticker) REFERENCES ticker(id) ON DELETE CASCADE
);


DELIMITER ;

DROP FUNCTION IF EXISTS daily_return;

DELIMITER //
CREATE FUNCTION daily_return(
    ticker_id INT,
    counter INT, 
    date_x DATE, 
    p_id INT
)  
RETURNS FLOAT DETERMINISTIC 
BEGIN
    DECLARE trend FLOAT DEFAULT 0;
    DECLARE i INT DEFAULT 0;
    DECLARE initial_price FLOAT DEFAULT 0;
    DECLARE final_price FLOAT DEFAULT 0;

    IF counter > 1 THEN 
        SET final_price   = (SELECT close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) = YEAR(date_x) AND id = p_id);
        SET initial_price = (SELECT close FROM stock_market_data WHERE id_ticker = ticker_id AND YEAR(date) = YEAR(date_x) AND id = p_id-1);
    
        IF initial_price IS NOT NULL THEN
            SET trend = 100 * ((final_price - initial_price) / initial_price);
        END IF;
    END IF;

    RETURN trend;
END //

DELIMITER ;



DROP PROCEDURE IF EXISTS insert_yield;
DELIMITER //

CREATE PROCEDURE insert_yield (
    IN curr_date DATE,
    IN ticker_id INT,
    IN p_id INT
) 
BEGIN 
    DECLARE counter INT;
    DECLARE yield FLOAT;

    SELECT count(*) INTO counter 
        FROM stock_market_data 
        WHERE YEAR(date) = YEAR(curr_date) 
        AND id_ticker = ticker_id
        AND id <= p_id;

    -- Appel direct à la fonction (corrigé ici)
    SET yield = daily_return(ticker_id, counter, curr_date, p_id);

    INSERT INTO yield (id_ticker, date, value) 
    VALUES (ticker_id, curr_date, yield); 

END //
DELIMITER ;


DELIMITER ;
DROP PROCEDURE IF EXISTS insert_yield;

DELIMITER //

CREATE PROCEDURE insert_yield (
    IN curr_date DATE,
    IN ticker_id INT,
    IN p_id INT
) 
BEGIN 
    DECLARE counter INT;
    DECLARE yield FLOAT;

    SELECT count(*) INTO counter 
        FROM stock_market_data 
        WHERE YEAR(date) = YEAR(curr_date) 
        AND id_ticker = ticker_id
        AND id <= p_id;

    SET yield = (SELECT daily_return(ticker_id, counter, curr_date, p_id) FROM stock_market_data);

    INSERT INTO yield (id_ticker, date, value) VALUES (ticker_id, curr_date, yield); 

END //

DELIMITER ;

