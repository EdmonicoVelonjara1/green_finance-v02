DELIMITER //
CREATE OR REPLACE PROCEDURE insert_overall_stat(
    IN data_type VARCHAR(2),
    IN ticker_id INT,
    IN year INT DEFAULT 2024
)
BEGIN
    DECLARE avg_p, avg_v FLOAT;
    DECLARE med_p, med_v FLOAT;
    DECLARE min_p, min_v FLOAT;
    DECLARE max_p, max_v FLOAT;
    DECLARE std_p, std_v FLOAT;

   
END //
DELIMITER ;





