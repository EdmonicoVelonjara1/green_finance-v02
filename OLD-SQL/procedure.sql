ELIMITER //
CREATE OR REPLACE PROCEDURE weekly_statistic(
    IN ticker_id INT, 
    IN year YEAR, 
    IN month MONTH, 
    IN price_type VARCHAR(10),
    IN filter_type VARCHAR(10)
)
BEGIN
    DECLARE yield_week_1 FLOAT DEFAULT 0;
    DECLARE yield_week_2 FLOAT DEFAULT 0;
    DECLARE yield_week_3 FLOAT DEFAULT 0;
    DECLARE yield_week_4 FLOAT DEFAULT 0;

    DECLARE cum_return_week_1 FLOAT DEFAULT 0;
    DECLARE cum_return_week_2 FLOAT DEFAULT 0;
    DECLARE cum_return_week_3 FLOAT DEFAULT 0;
    DECLARE cum_return_week_4 FLOAT DEFAULT 0;

    SET yield_week_1 = weekly_cumulative_return(ticker_id, year, month, price_type, 1,  7,  FALSE);
    SET yield_week_2 = weekly_cumulative_return(ticker_id, year, month, price_type, 1,  7,  FALSE);
    SET yield_week_3 = weekly_cumulative_return(ticker_id, year, month, price_type, 8,  14, FALSE);
    SET yield_week_4 = weekly_cumulative_return(ticker_id, year, month, price_type, 15, 21, FALSE);

    SET cum_return_week_1 = weekly_cumulative_return(ticker_id, year, month, price_type, 1, 7,  TRUE);
    SET cum_return_week_2 = weekly_cumulative_return(ticker_id, year, month, price_type, 1, 7,  TRUE);
    SET cum_return_week_3 = weekly_cumulative_return(ticker_id, year, month, price_type, 8, 14, TRUE);
    SET cum_return_week_4 = weekly_cumulative_return(ticker_id, year, month, price_type, 8, 14, TRUE);



END //
DELIMITER ;

DELIMITER //
CREATE OR REPLACE PROCEDURE set_statistic(
    IN ticker_id INT, 
    IN year YEAR, 
    IN month MONTH, 
    IN price_type VARCHAR(10),
    IN filter_type VARCHAR(10)
)
BEGIN
    DECLARE yield_month_1 FLOAT DEFAULT 0;
    DECLARE yield_month_2 FLOAT DEFAULT 0;
    DECLARE yield_month_3 FLOAT DEFAULT 0;
    DECLARE yield_month_4 FLOAT DEFAULT 0;

    DECLARE cum_return_month_1 FLOAT DEFAULT 0;
    DECLARE cum_return_month_2 FLOAT DEFAULT 0;
    DECLARE cum_return_month_3 FLOAT DEFAULT 0;
    DECLARE cum_return_month_4 FLOAT DEFAULT 0;

    SET yield_month_1 = monthly_cumulative_return(ticker_id, year, month, price_type, 1, 7, FALSE);
    SET yield_month_2 = monthly_cumulative_return(ticker_id, year, month, price_type, 8, 14, FALSE);
    SET yield_month_3 = monthly_cumulative_return(ticker_id, year, month, price_type, 15, 21, FALSE);
    SET yield_month_4 = monthly_cumulative_return(ticker_id, year, month, price_type, 22, 31, FALSE);

    SET cum_return_month_1 = monthly_cumulative_return(ticker_id, year, month, price_type, 1, 7, TRUE);
    SET cum_return_month_2 = monthly_cumulative_return(ticker_id, year, month, price_type, 8, 14, TRUE);
    SET cum_return_month_3 = monthly_cumulative_return(ticker_id, year, month, price_type, 15, 21, TRUE);
    SET cum_return_month_4 = monthly_cumulative_return(ticker_id, year, month, price_type, 22 ,31 ,TRUE);

END //


DELIMITER ;
DELIMITER //
CREATE OR REPLACE PROCEDURE set_anomaly(
    IN ticker_id INT, 
    IN year YEAR, 
    IN month MONTH, 
    IN price_type VARCHAR(10),
    IN filter_type VARCHAR(10)
)
BEGIN
    DECLARE anomaly_price FLOAT DEFAULT 0;
    DECLARE anomaly_volume FLOAT DEFAULT 0;

    SET anomaly_price = anomaly(ticker_id, year, month, price_type, filter_type);
    SET anomaly_volume = anomaly(ticker_id, year, month, price_type, filter_type);

    INSERT INTO anomaly_prediction (id_ticker, anomaly_price, anomaly_volume, date)
    VALUES (ticker_id, anomaly_price, anomaly_volume, CURDATE());
END //
DELIMITER ;
DELIMITER //
CREATE OR REPLACE PROCEDURE get_all_price(
    IN ticker_id INT, 
    IN year YEAR, 
    IN month MONTH, 
    IN price_type VARCHAR(10),
    IN filter_type VARCHAR(10)
)
BEGIN
    DECLARE price FLOAT DEFAULT 0;
    DECLARE volume FLOAT DEFAULT 0;

    SET price = get_price(ticker_id, year, month, price_type, filter_type);
    SET volume = get_volume(ticker_id, year, month, price_type, filter_type);

    INSERT INTO statistic (
        id_ticker, 
        cum_return_open, 
        cum_return_close, 
        cum_return_adj_close,
        trend_open, 
        trend_close, 
        trend_adj_close,
        volatility_open, 
        volatility_close, 
        volatility_adj_close,
        anomaly_price, 
        anomaly_volume,
        rsi)
    VALUES (ticker_id, price, volume);
END //



mysql -u root -p -e "SHOW PROCESSLIST" | awk '{print $1}' | grep -E '^[0-9]+$' | while read id; do
  mysql -u root -pYourPassword -e "KILL $id;"
done
