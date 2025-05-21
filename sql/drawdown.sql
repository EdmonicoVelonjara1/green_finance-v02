-- Drawdown quotidien
CREATE VIEW daily_drawdon AS
SELECT
    t.name,
    smd.date,
    smd.close,
    MAX(smd.close) OVER (PARTITION BY t.id ORDER BY date ROWS BETWEEN 
    UNBOUNDED PRECEDING AND CURRENT ROW) AS max_price_so_far,
    ROUND(100 * ((close / MAX(close) OVER 
    (PARTITION BY id_ticker ORDER BY date ROWS BETWEEN 
    UNBOUNDED PRECEDING AND CURRENT ROW)) - 1), 2) AS drawdown_pct
FROM
    stock_market_data
WHERE id_ticker = 1
ORDER BY date;


-- MAX DRAWDOWN DE L'ANNEE
SELECT
    id_ticker,
    MIN(ROUND(100 * ((close / MAX(close) OVER (PARTITION BY id_ticker 
    ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING 
    AND CURRENT ROW)) - 1), 2)) AS max_drawdown_pct
FROM
    prices
WHERE YEAR(date) = 2024
GROUP BY id_ticker;

DROP TABLE IF EXISTS drawdown_results;
CREATE TABLE IF NOT EXISTS drawdown_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_ticker INT NOT NULL,
    date DATE NOT NULL,
    drawdown_pct DECIMAL(10, 2) NOT NULL,
    max_drawdown_pct DECIMAL(10, 2) NOT NULL,
    year INT NOT NULL
);


DROP PROCEDURE IF EXISTS CalculateDrawdownToTable;
DELIMITER $$

CREATE PROCEDURE CalculateDrawdownToTable(
    IN input_year INT,
    IN input_ticker INT
)
BEGIN
    -- Supprimer les anciennes données pour ce ticker et cette année
    DELETE FROM drawdown_results WHERE id_ticker = input_ticker AND year = input_year;

    -- Insérer les nouveaux résultats calculés
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
END$$

DELIMITER ;

SELECT * FROM drawdown_results WHERE id_ticker = 1 AND year = 2024 ORDER BY date;
