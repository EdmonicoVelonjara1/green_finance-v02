CREATE TABLE rsi_signals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_rsi INT NOT NULL,
  signal_type VARCHAR(50) NOT NULL,
  description TEXT,
  signal VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_rsi) REFERENCES indicator_rsi(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);


DELIMITER $$

CREATE PROCEDURE detect_rsi_signals(
  IN in_ticker_id INT,
  IN in_period INT,
  IN in_overbought FLOAT,
  IN in_oversold FLOAT
)
BEGIN
  DECLARE i INT DEFAULT 11;
  DECLARE total INT;
  DECLARE id_rsi INT;
  DECLARE rsi_curr FLOAT;
  DECLARE rsi_prev FLOAT;
  DECLARE rsi_prev10 FLOAT;
  DECLARE price_curr FLOAT;
  DECLARE price_prev FLOAT;
  DECLARE price_prev10 FLOAT;

  -- Supprimer anciens signaux
  DELETE FROM rsi_signals
  WHERE id_rsi IN (
    SELECT id FROM indicator_rsi
    WHERE id_ticker = in_ticker_id
  );

  -- Table temporaire
  DROP TEMPORARY TABLE IF EXISTS temp_rsi;
  CREATE TEMPORARY TABLE temp_rsi AS
    SELECT
      r.id AS id_rsi,
      r.date,
      CASE in_period
        WHEN 7 THEN r.rsi_7
        WHEN 14 THEN r.rsi_14
        WHEN 21 THEN r.rsi_21
      END AS rsi,
      smd.close AS close_price
    FROM indicator_rsi r
    JOIN stock_market_data smd ON r.date = smd.date AND r.id_ticker = smd.id_ticker
    WHERE r.id_ticker = in_ticker_id
    ORDER BY r.date;

  -- Numérotation
  ALTER TABLE temp_rsi ADD COLUMN rownum INT PRIMARY KEY AUTO_INCREMENT;

  -- Compter les lignes
  SELECT COUNT(*) INTO total FROM temp_rsi;

  -- Boucle
  WHILE i <= total DO
    -- Ligne actuelle
    SELECT id_rsi, rsi, close_price INTO id_rsi, rsi_curr, price_curr
    FROM temp_rsi WHERE rownum = i;

    -- Ligne précédente
    SELECT rsi, close_price INTO rsi_prev, price_prev
    FROM temp_rsi WHERE rownum = i - 1;

    -- Ligne -10
    SELECT rsi, close_price INTO rsi_prev10, price_prev10
    FROM temp_rsi WHERE rownum = i - 10;

    -- Surachat
    IF rsi_prev < in_overbought AND rsi_curr >= in_overbought THEN
      INSERT INTO rsi_signals (id_rsi, signal_type, description, signal_label)
      VALUES (id_rsi, 'Surachat', CONCAT('RSI passé au-dessus de ', in_overbought), 'Vente potentielle');
    END IF;

    -- Sortie de surachat
    IF rsi_prev >= in_overbought AND rsi_curr < in_overbought THEN
      INSERT INTO rsi_signals (id_rsi, signal_type, description, signal_label)
      VALUES (id_rsi, 'Sortie de surachat', CONCAT('RSI repassé sous ', in_overbought), 'Confirmation de vente');
    END IF;

    -- Sortie de survente
    IF rsi_prev <= in_oversold AND rsi_curr > in_oversold THEN
      INSERT INTO rsi_signals (id_rsi, signal_type, description, signal_label)
      VALUES (id_rsi, 'Sortie de survente', CONCAT('RSI remonté au-dessus de ', in_oversold), 'Confirmation d\'achat');
    END IF;

    -- Divergence haussière
    IF rsi_curr IS NOT NULL AND rsi_prev10 IS NOT NULL
       AND price_curr < price_prev10 AND rsi_curr > rsi_prev10 THEN
      INSERT INTO rsi_signals (id_rsi, signal_type, description, signal_label)
      VALUES (id_rsi, 'Divergence haussière', 'Le prix fait un plus bas, mais le RSI fait un plus bas plus haut', 'Achat potentiel');
    END IF;

    SET i = i + 1;
  END WHILE;

  DROP TEMPORARY TABLE IF EXISTS temp_rsi;
END$$

DELIMITER ;





CALL detect_rsi_signals(1, 14, 70, 30);
