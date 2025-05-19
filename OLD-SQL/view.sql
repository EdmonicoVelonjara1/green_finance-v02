-- Fichier views.sql
-- Ce fichier contient des vues SQL pour la base de données stock_data_analyzis.
-- Les vues simplifient l'accès aux données boursières et fournissent des perspectives analytiques pour les utilisateurs.

USE stock_data_analyzis;

-- Vue 1: Résumé des données boursières récentes
-- Objectif: Afficher les données boursières les plus récentes pour chaque ticker avec le nom du ticker.
-- Utilité: Utile pour un tableau de bord montrant les prix et volumes actuels.
CREATE OR REPLACE VIEW recent_stock_data AS
SELECT 
    t.id AS id_ticker,
    t.name AS ticker_name,
    smd.date,
    smd.open,
    smd.high,
    smd.low,
    smd.close,
    smd.adj_close,
    smd.volume
FROM ticker t
JOIN stock_market_data smd ON t.id = smd.id_ticker
WHERE smd.date = (
    SELECT MAX(date)
    FROM stock_market_data
    WHERE id_ticker = t.id
);

-- Vue 2: Rendements cumulés récents
-- Objectif: Afficher les rendements cumulés les plus récents pour chaque ticker.
-- Utilité: Permet de comparer la performance à long terme des actions.
CREATE OR REPLACE VIEW recent_cumulative_returns AS
SELECT 
    t.id AS id_ticker,
    t.name AS ticker_name,
    cr.date,
    cr.cum_return_open,
    cr.cum_return_high,
    cr.cum_return_low,
    cr.cum_return_close,
    cr.cum_return_adj_close
FROM ticker t
JOIN cumulative_return cr ON t.id = cr.id_ticker
WHERE cr.date = (
    SELECT MAX(date)
    FROM cumulative_return
    WHERE id_ticker = t.id
);

-- Vue 3: Tendances récentes
-- Objectif: Afficher les tendances journalières les plus récentes pour chaque ticker.
-- Utilité: Utile pour identifier les mouvements de prix à court terme.
CREATE OR REPLACE VIEW recent_trends AS
SELECT 
    t.id AS id_ticker,
    t.name AS ticker_name,
    tr.date,
    tr.trend_open,
    tr.trend_close,
    tr.trend_adj_close
FROM ticker t
JOIN trending tr ON t.id = tr.id_ticker
WHERE tr.date = (
    SELECT MAX(date)
    FROM trending
    WHERE id_ticker = t.id
);

-- Vue 4: Volatilité récente
-- Objectif: Afficher la volatilité annualisée la plus récente pour chaque ticker.
-- Utilité: Permet d'évaluer le risque des actions.
CREATE OR REPLACE VIEW recent_volatility AS
SELECT 
    t.id AS id_ticker,
    t.name AS ticker_name,
    v.date,
    v.volatility_open,
    v.volatility_close,
    v.volatility_adj_close
FROM ticker t
JOIN volatility v ON t.id = v.id_ticker
WHERE v.date = (
    SELECT MAX(date)
    FROM volatility
    WHERE id_ticker = t.id
);

-- Vue 5: Anomalies récentes
-- Objectif: Afficher les anomalies de prix et de volume les plus récentes pour chaque ticker.
-- Utilité: Utile pour détecter des comportements inhabituels dans les données boursières.
CREATE OR REPLACE VIEW recent_anomalies AS
SELECT 
    t.id AS id_ticker,
    t.name AS ticker_name,
    ap.date,
    ap.anomaly_price,
    ap.anomaly_volume
FROM ticker t
JOIN anomaly_prediction ap ON t.id = ap.id_ticker
WHERE ap.date = (
    SELECT MAX(date)
    FROM anomaly_prediction
    WHERE id_ticker = t.id
);

-- Vue 6: Indicateurs techniques récents
-- Objectif: Afficher les indicateurs techniques les plus récents pour chaque ticker.
-- Utilité: Fournit des métriques pour l'analyse technique (ex. : signaux d'achat/vente).
CREATE OR REPLACE VIEW recent_technical_indicators AS
SELECT 
    t.id AS id_ticker,
    t.name AS ticker_name,
    it.date,
    it.sma_50,
    it.sma_200,
    it.ema_50,
    it.ema_200,
    it.rsi_14,
    it.macd,
    it.macd_signal,
    it.bollinger_upper,
    it.bollinger_lower
FROM ticker t
JOIN indicators_technical it ON t.id = it.id_ticker
WHERE it.date = (
    SELECT MAX(date)
    FROM indicators_technical
    WHERE id_ticker = t.id
);

-- Vue 7: Statistiques consolidées récentes
-- Objectif: Afficher une vue consolidée des statistiques les plus récentes pour chaque ticker.
-- Utilité: Fournit une vue complète pour les rapports ou tableaux de bord.
CREATE OR REPLACE VIEW recent_statistics AS
SELECT 
    t.id AS id_ticker,
    t.name AS ticker_name,
    s.date,
    s.cum_return_open,
    s.cum_return_close,
    s.cum_return_adj_close,
    s.trend_open,
    s.trend_close,
    s.trend_adj_close,
    s.volatility_open,
    s.volatility_close,
    s.volatility_adj_close,
    s.anomaly_price,
    s.anomaly_volume,
    s.rsi
FROM ticker t
JOIN statistic s ON t.id = s.id_ticker
WHERE s.date = (
    SELECT MAX(date)
    FROM statistic
    WHERE id_ticker = t.id
);

-- Vue 8: Top 10 des actions par rendement cumulé
-- Objectif: Afficher les 10 actions avec les rendements cumulés les plus élevés (basé sur adj_close).
-- Utilité: Utile pour identifier les meilleures performances.
CREATE OR REPLACE VIEW top_10_cumulative_returns AS
SELECT 
    t.id AS id_ticker,
    t.name AS ticker_name,
    cr.date,
    cr.cum_return_adj_close
FROM ticker t
JOIN cumulative_return cr ON t.id = cr.id_ticker
WHERE cr.date = (
    SELECT MAX(date)
    FROM cumulative_return
    WHERE id_ticker = t.id
)
ORDER BY cr.cum_return_adj_close DESC
LIMIT 10;

-- Vue 9: Actions à forte volatilité
-- Objectif: Afficher les actions avec une volatilité annualisée élevée (basé sur adj_close, > 30%).
-- Utilité: Utile pour identifier les actions risquées.
CREATE OR REPLACE VIEW high_volatility_stocks AS
SELECT 
    t.id AS id_ticker,
    t.name AS ticker_name,
    v.date,
    v.volatility_adj_close
FROM ticker t
JOIN volatility v ON t.id = v.id_ticker
WHERE v.date = (
    SELECT MAX(date)
    FROM volatility
    WHERE id_ticker = t.id
)
AND v.volatility_adj_close > 30
ORDER BY v.volatility_adj_close DESC;

-- Vue 10: Signaux techniques basés sur RSI
-- Objectif: Identifier les actions surachetées (RSI > 70) ou survendues (RSI < 30).
-- Utilité: Fournit des signaux pour les traders techniques.
CREATE OR REPLACE VIEW rsi_signals AS
SELECT 
    t.id AS id_ticker,
    t.name AS ticker_name,
    it.date,
    it.rsi_14,
    CASE 
        WHEN it.rsi_14 > 70 THEN 'Suracheté'
        WHEN it.rsi_14 < 30 THEN 'Survendu'
        ELSE 'Neutre'
    END AS rsi_signal
FROM ticker t
JOIN indicators_technical it ON t.id = it.id_ticker
WHERE it.date = (
    SELECT MAX(date)
    FROM indicators_technical
    WHERE id_ticker = t.id
);

-- Vue 11: Historique des prix et volume sur 30 jours
-- Objectif: Afficher l'historique des prix et volumes des 30 derniers jours pour chaque ticker.
-- Utilité: Utile pour les graphiques de prix ou l'analyse des tendances récentes.
CREATE OR REPLACE VIEW price_volume_30_days AS
SELECT 
    t.id AS id_ticker,
    t.name AS ticker_name,
    smd.date,
    smd.close,
    smd.adj_close,
    smd.volume
FROM ticker t
JOIN stock_market_data smd ON t.id = smd.id_ticker
WHERE smd.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY t.id, smd.date DESC;

-- Vue 12: Comparaison SMA/EMA pour signaux de croisement
-- Objectif: Identifier les croisements entre SMA_50 et SMA_200 ou EMA_50 et EMA_200.
-- Utilité: Utile pour détecter des signaux d'achat (croisement haussier) ou de vente (croisement baissier).
CREATE OR REPLACE VIEW sma_ema_crossovers AS
SELECT 
    t.id AS id_ticker,
    t.name AS ticker_name,
    it.date,
    it.sma_50,
    it.sma_200,
    it.ema_50,
    it.ema_200,
    CASE 
        WHEN it.sma_50 > it.sma_200 THEN 'Haussier (SMA)'
        WHEN it.sma_50 < it.sma_200 THEN 'Baissier (SMA)'
        ELSE 'Neutre (SMA)'
    END AS sma_crossover_signal,
    CASE 
        WHEN it.ema_50 > it.ema_200 THEN 'Haussier (EMA)'
        WHEN it.ema_50 < it.ema_200 THEN 'Baissier (EMA)'
        ELSE 'Neutre (EMA)'
    END AS ema_crossover_signal
FROM ticker t
JOIN indicators_technical it ON t.id = it.id_ticker
WHERE it.date = (
    SELECT MAX(date)
    FROM indicators_technical
    WHERE id_ticker = t.id
);

-- Vue 13: Volume moyen par ticker
-- Objectif: Calculer le volume moyen échangé sur les 30 derniers jours pour chaque ticker.
-- Utilité: Permet d'évaluer la liquidité des actions.
CREATE OR REPLACE VIEW average_volume_30_days AS
SELECT 
    t.id AS id_ticker,
    t.name AS ticker_name,
    AVG(smd.volume) AS avg_volume,
    MAX(smd.date) AS last_date
FROM ticker t
JOIN stock_market_data smd ON t.id = smd.id_ticker
WHERE smd.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY t.id, t.name
ORDER BY avg_volume DESC;

-- Vue 14: Actions avec anomalies significatives
-- Objectif: Afficher les actions avec des anomalies de prix ou de volume élevées (|anomaly| > 50).
-- Utilité: Utile pour un suivi des comportements inhabituels.
CREATE OR REPLACE VIEW significant_anomalies AS
SELECT 
    t.id AS id_ticker,
    t.name AS ticker_name,
    ap.date,
    ap.anomaly_price,
    ap.anomaly_volume
FROM ticker t
JOIN anomaly_prediction ap ON t.id = ap.id_ticker
WHERE ap.date = (
    SELECT MAX(date)
    FROM anomaly_prediction
    WHERE id_ticker = t.id
)
AND (ABS(ap.anomaly_price) > 50 OR ABS(ap.anomaly_volume) > 50)
ORDER BY ABS(ap.anomaly_price) DESC, ABS(ap.anomaly_volume) DESC;

-- Vue 15: Résumé complet par ticker
-- Objectif: Combiner les données récentes de toutes les tables pour un résumé complet.
-- Utilité: Fournit une vue unique pour chaque ticker, idéale pour les rapports détaillés.

CREATE OR REPLACE VIEW full_ticker_summary AS
SELECT 
    t.id AS id_ticker,
    t.name AS ticker_name,
    smd.date,
    smd.close AS latest_close,
    smd.volume AS latest_volume,
    cr.cum_return_adj_close,
    tr.trend_adj_close,
    v.volatility_adj_close,
    ap.anomaly_price,
    ap.anomaly_volume,
    it.rsi_14,
    it.sma_50,
    it.sma_200
FROM ticker t
JOIN stock_market_data smd ON t.id = smd.id_ticker
JOIN cumulative_return cr ON t.id = cr.id_ticker AND cr.date = smd.date
JOIN trending tr ON t.id = tr.id_ticker AND tr.date = smd.date
JOIN volatility v ON t.id = v.id_ticker AND v.date = smd.date
LEFT JOIN anomaly_prediction ap ON t.id = ap.id_ticker AND ap.date = smd.date
JOIN indicators_technical it ON t.id = it.id_ticker AND it.date = smd.date
WHERE smd.date = (
    SELECT MAX(date)
    FROM stock_market_data
    WHERE id_ticker = t.id
);

DROP VIEW IF EXISTS story_data;
CREATE OR REPLACE VIEW story_data AS 
SELECT 
    -- t.id AS id_ticker,
    t.name AS ticker_name,
    smd.date AS date,
    smd.open AS open,
    smd.high AS high,
    smd.low AS low,
    smd.close AS close,
    smd.adj_close AS adj_close,
    smd.volume AS volume 
FROM ticker t
JOIN stock_market_data smd ON t.id = smd.id_ticker
WHERE t.id = smd.id_ticker 
ORDER BY smd.date DESC;

-- Notes:
-- 1. Les vues utilisent des sous-requêtes pour sélectionner les données les plus récentes, ce qui garantit des résultats à jour.
-- 2. Les jointures LEFT sont utilisées pour anomaly_prediction pour gérer les cas où aucune anomalie n'est enregistrée.
-- 3. Des index sur stock_market_data(id_ticker, date) et les autres tables(id_ticker, date) sont recommandés pour optimiser les performances.
-- 4. Les vues sont conçues pour être utilisées dans des tableaux de bord, des rapports, ou des analyses ad hoc.
