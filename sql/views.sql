DROP VIEW IF EXISTS stat_annual;

CREATE VIEW stat_annual AS 
SELECT 
    c.name AS company, 
    year_data.year,
    AVG(s.close) AS mean_price,
    AVG(s.volume) AS mean_volume,
    STDDEV(s.close) AS std_price,
    STDDEV(s.volume) AS std_volume,
    MIN(s.close) AS min_price,
    MIN(s.volume) AS min_volume,
    MAX(s.close) AS max_price,
    MAX(s.volume) AS max_volume,
    median_annual('price', c.id, year_data.year) AS median_price,
    median_annual('volume', c.id, year_data.year) AS median_volume,
    skewness_annual(c.id, year_data.year) AS skewness
FROM (
    SELECT DISTINCT id_ticker, YEAR(date) AS year
    FROM stock_market_data
) AS year_data
JOIN ticker c ON c.id = year_data.id_ticker
JOIN stock_market_data s ON s.id_ticker = c.id AND YEAR(s.date) = year_data.year
GROUP BY c.name, c.id, year_data.year ORDER BY year_data.year;


CREATE OR REPLACE VIEW indicator_macd AS
SELECT 
    t.name,
    e12.date,
    e12.ema_value AS ema_12,
    e26.ema_value AS ema_26,
    e12.ema_value - e26.ema_value AS macd
FROM indicator_ema e12
JOIN indicator_ema e26 ON e12.id_ticker = e26.id_ticker AND e12.date = e26.date
JOIN ticker t ON t.id = e12.id_ticker
WHERE e12.ema_period = 12 AND e26.ema_period = 26;

CREATE OR REPLACE VIEW indicator_sma AS 
SELECT 
    t.name, 
    smd.date, 
    smd.adj_close as price,
    AVG(smd.adj_close) OVER (PARTITION BY smd.id_ticker ORDER BY smd.date ROWS BETWEEN 4 PRECEDING AND CURRENT ROW) AS sma_5,
    AVG(smd.adj_close) OVER (PARTITION BY smd.id_ticker ORDER BY smd.date ROWS BETWEEN 9 PRECEDING AND CURRENT ROW) AS sma_10,
    AVG(smd.adj_close) OVER (PARTITION BY smd.id_ticker ORDER BY smd.date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) AS sma_20,
    AVG(smd.adj_close) OVER (PARTITION BY smd.id_ticker ORDER BY smd.date ROWS BETWEEN 49 PRECEDING AND CURRENT ROW) AS sma_50,
    AVG(smd.adj_close) OVER (PARTITION BY smd.id_ticker ORDER BY smd.date ROWS BETWEEN 99 PRECEDING AND CURRENT ROW) AS sma_100,
    AVG(smd.adj_close) OVER (PARTITION BY smd.id_ticker ORDER BY smd.date ROWS BETWEEN 199 PRECEDING AND CURRENT ROW) AS sma_200
FROM stock_market_data smd 
JOIN ticker t ON t.id = smd.id_ticker;

