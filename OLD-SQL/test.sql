-- Création de la base de données
CREATE DATABASE IF NOT EXISTS green_finance;
USE green_finance;

-- Table des tickers
DROP TABLE IF EXISTS ticker;
CREATE TABLE IF NOT EXISTS ticker (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(100),
    UNIQUE (name)
) ENGINE=InnoDB;


-- Table des données boursières
DROP TABLE IF EXISTS stock_market_data;

CREATE TABLE IF NOT EXISTS stock_market_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_ticker INT NOT NULL,
    date DATE NOT NULL,
    open FLOAT NOT NULL,
    high FLOAT NOT NULL,
    low FLOAT NOT NULL,
    close FLOAT NOT NULL,
    adj_close FLOAT NOT NULL,
    volume BIGINT NOT NULL,
    FOREIGN KEY (id_ticker) REFERENCES ticker(id) ON DELETE RESTRICT,
    UNIQUE (id_ticker, date),
    CHECK (open > 0 AND high > 0 AND low > 0 AND close > 0 AND adj_close > 0),
    CHECK (volume >= 0),
    CHECK (high >= low),
    CHECK (open <= high AND open >= low AND close <= high AND close >= low)
) ENGINE=InnoDB;

-- Index pour optimiser les requêtes
CREATE INDEX idx_stock_market_data_ticker_date ON stock_market_data (id_ticker, date);

-- Table des rendements quotidiens
DROP TABLE IF EXISTS yield;

CREATE TABLE IF NOT EXISTS yield (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_ticker INT NOT NULL,
    date DATE NOT NULL,
    value FLOAT NOT NULL,
    FOREIGN KEY (id_ticker) REFERENCES ticker(id) ON DELETE CASCADE,
    UNIQUE (id_ticker, date)
) ENGINE=InnoDB;

-- Table des rendements cumulés
DROP TABLE IF EXISTS cum_return;
CREATE TABLE IF NOT EXISTS cum_return (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_ticker INT NOT NULL,
    date DATE NOT NULL,
    open_return FLOAT NOT NULL,
    high_return FLOAT NOT NULL,
    low_return FLOAT NOT NULL,
    close_return FLOAT NOT NULL,
    adj_close_return FLOAT NOT NULL,
    FOREIGN KEY (id_ticker) REFERENCES ticker(id) ON DELETE CASCADE,
    UNIQUE (id_ticker, date)
) ENGINE=InnoDB;

-- Trigger BEFORE INSERT pour valider les données
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

-- Fonction pour calculer le rendement quotidien
DROP FUNCTION IF EXISTS daily_return;

DELIMITER //
CREATE FUNCTION daily_return(
    p_id_ticker INT,
    p_date DATE
)  
RETURNS FLOAT DETERMINISTIC
BEGIN
    DECLARE initial_price FLOAT DEFAULT NULL;
    DECLARE final_price FLOAT DEFAULT NULL;

    -- Récupérer le prix de clôture actuel
    SELECT close INTO final_price
    FROM stock_market_data
    WHERE id_ticker = p_id_ticker AND date = p_date
    LIMIT 1;

    -- Récupérer le prix de clôture précédent
    SELECT close INTO initial_price
    FROM stock_market_data
    WHERE id_ticker = p_id_ticker AND date < p_date
    ORDER BY date DESC
    LIMIT 1;

    -- Si pas de prix précédent ou prix nul, retourner 0
    IF initial_price IS NULL OR initial_price = 0 THEN
        RETURN 0;
    END IF;

    RETURN 100 * ((final_price - initial_price) / initial_price);
END //
DELIMITER ;

-- Fonction pour calculer les rendements cumulés
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
END //
DELIMITER ;

-- Trigger AFTER INSERT pour insérer les rendements
DROP TRIGGER IF EXISTS after_insert_stock_market_data;

DELIMITER //
CREATE TRIGGER after_insert_stock_market_data
AFTER INSERT ON stock_market_data
FOR EACH ROW
BEGIN
    DECLARE prev_close FLOAT DEFAULT 0;
    DECLARE counter INT DEFAULT 0;

    SET counter = (SELECT COUNT(*) FROM stock_market_data WHERE id_ticker = NEW.id_ticker);
    SET prev_close = (SELECT close FROM stock_market_data WHERE id_ticker = NEW.id_ticker AND id < NEW.id ORDER BY date DESC LIMIT 1);


    CALL insert_yield(NEW.id_ticker, NEW.date);
    CALL insert_cum_return(NEW.id_ticker, NEW.date);
    CALL set_rsi(NEW.id_ticker, NEW.date, prev_close, NEW.close);
END //
DELIMITER ;

-- Trigger AFTER INSERT pour supprimer les rendements

DROP TRIGGER IF EXISTS after_delete_stock_market_data;
DELIMITER //
CREATE TRIGGER after_delete_stock_market_data
AFTER DELETE ON stock_market_data
FOR EACH ROW
BEGIN
    -- Supprimer les lignes correspondantes dans yield
    DELETE FROM yield
    WHERE id_ticker = OLD.id_ticker AND date = OLD.date;

    -- Supprimer les lignes correspondantes dans cum_return
    DELETE FROM cum_return
    WHERE id_ticker = OLD.id_ticker AND date = OLD.date;
END //
DELIMITER ;