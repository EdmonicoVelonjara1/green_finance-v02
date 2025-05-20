CREATE VIEW IF NOT EXISTS indicator_sma AS 
    SELECT t.name, smd.date as date, smd.adj_close as price,
           calc_sma(smd.adj_close, 5) as sma_5,  
           calc_sma(smd.adj_close, 10) as sma_10,  
           calc_sma(smd.adj_close, 20) as sma_20,  
           calc_sma(smd.adj_close, 50) as sma_50,  
           calc_sma(smd.adj_close, 100) as sma_100,  
           calc_sma(smd.adj_close, 200) as sma_200

    FROM stock_market_data smd JOIN ticker t ON t.id = smd.id_ticker 
    GROUP BY t.id, smd.id_ticker ;

CREATE VIEW IF NOT EXISTS indicator_ema AS 
    SELECT t.name, smd.date as date, smd.adj_close as price,
           calc_ema(smd.adj_close, 5) as  ema_5,  
           calc_ema(smd.adj_close, 12) as ema_12,  
           calc_ema(smd.adj_close, 20) as ema_20,  
           calc_ema(smd.adj_close, 8) as  ema_8,  
           calc_ema(smd.adj_close, 26) as ema_26,  
           calc_ema(smd.adj_close, 50) as ema_50

    FROM stock_market_data smd JOIN ticker t ON t.id = smd.id_ticker 
    GROUP BY t.id, smd.id_ticker ;

CREATE VIEW IF NOT EXISTS indicator_macd AS 
    SELECT t.name, smd.date as date, smd.adj_close as price,
           calc_sma(smd.adj_close, 5) as sma_5,  
           calc_sma(smd.adj_close, 8) as sma_8,  
           calc_sma(smd.adj_close, 12) as sma_12,  
           calc_sma(smd.adj_close, 20) as sma_20,  
           calc_sma(smd.adj_close, 26) as sma_26,  
           calc_sma(smd.adj_close, 50) as sma_50

    FROM stock_market_data smd JOIN ticker t ON t.id = smd.id_ticker 
    GROUP BY t.id, smd.id_ticker ;






DELIMITER $$

CREATE FUNCTION calc_sma(
    in_price FLOAT,
    in_period INT
)
RETURNS FLOAT DETERMINISTIC
BEGIN
    DECLARE sma FLOAT DEFAULT 0;
    SET sma = (SELECT AVG(in_price) OVER (ORDER BY date ROWS BETWEEN in_period PRECEDING AND CURRENT ROW) FROM stock_market_data);
    RETURN sma;
END $$

CREATE FUNCTION calc_ema(
    in_price FLOAT,
    in_period INT
)
RETURNS FLOAT DETERMINISTIC
BEGIN
    DECLARE sma FLOAT DEFAULT 0;
    SET sma = (SELECT AVG(in_price) OVER (ORDER BY date ROWS BETWEEN in_period PRECEDING AND CURRENT ROW) FROM stock_market_data);
    RETURN sma;
END $$

