-- Trigger AFTER INSERT pour insérer les rendements
DROP TRIGGER IF EXISTS after_insert_stock_market_data;

DELIMITER //
CREATE TRIGGER after_insert_stock_market_data
AFTER INSERT ON stock_market_data
FOR EACH ROW
BEGIN
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
END //
DELIMITER ;

DROP TRIGGER IF EXISTS before_insert_stock_market_data;
DELIMITER //
CREATE TRIGGER before_insert_stock_market_data
BEFORE INSERT ON stock_market_data
FOR EACH ROW
BEGIN
    IF NEW.date > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La date ne peut pas être dans le futur';
    END IF;
END //
DELIMITER ;
