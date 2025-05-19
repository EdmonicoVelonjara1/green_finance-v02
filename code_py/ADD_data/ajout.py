
import mysql.connector
import csv

conn = mysql.connector.connect(
    host="localhost",
    user="venico",
    password="venicoisme",
    database="green_finance",
    ssl_disabled=True
)
cursor = conn.cursor()

try:
    cursor.execute("START TRANSACTION")

    with open("stockMarketData.csv", newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            cursor.execute("""
                INSERT INTO stock_market_data (id_ticker, date, open, high, low, close, adj_close, volume)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                int(row['id_ticker']),
                row['date'],
                float(row['open']),
                float(row['high']),
                float(row['low']),
                float(row['close']),
                float(row['adj_close']),
                int(row['volume'])
            ))

    conn.commit()
    print("Données insérées avec succès.")
except mysql.connector.Error as err:
    print("Erreur détectée, rollback...", err)
    conn.rollback()
finally:
    cursor.close()
    conn.close()
