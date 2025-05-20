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
