INSERT INTO ticker (id, name, full_name) VALUES
(1, 'YUM', 'Yum! Brands, Inc.'),
(2, 'WEN', 'The Wendy''s Company'),
(3, 'SBUX', 'Starbucks Corporation'),
(4, 'QSR', 'Restaurant Brands International Inc.'),
(5, 'PZZA', 'Papa John''s International, Inc.'),
(6, 'MCD', 'McDonald''s Corporation'),
(7, 'LKNCY', 'Luckin Coffee Inc.'),
(8, 'DPZ', 'Domino''s Pizza, Inc.'),
(9, 'DNUT', 'Krispy Kreme, Inc.');


LOAD DATA INFILE '/var/lib/mysql-files/stockMarketData.csv'
INTO TABLE stock_market_data
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\n' 
IGNORE 1 LINES
(id_ticker, date, open, high, low, close, adj_close, volume);



DROP PROCEDURE IF EXISTS regenerate_all_returns;
DELIMITER //
CREATE PROCEDURE regenerate_all_returns()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_id, v_id_ticker INT;
    DECLARE v_date DATE;
    DECLARE cur CURSOR FOR 
        SELECT id, id_ticker, date FROM stock_market_data ORDER BY id_ticker, date;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_id, v_id_ticker, v_date;
        IF done THEN
            LEAVE read_loop;
        END IF;

        CALL insert_yield(v_date, v_id_ticker, v_id);
        CALL insert_cum_return(v_id_ticker, v_date, v_id);
    END LOOP;
    CLOSE cur;
END //
DELIMITER ;

CALL regenerate_all_returns();

