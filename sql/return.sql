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

