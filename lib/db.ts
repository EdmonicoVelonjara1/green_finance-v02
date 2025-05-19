import mysql from 'mysql2/promise'

export const db = mysql.createPool({
    host: 'localhost',
    user: 'venico',
    password: 'venicoisme',
    port: 3306,
    database: 'green_finance'
});