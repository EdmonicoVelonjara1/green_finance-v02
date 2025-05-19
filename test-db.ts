import { db } from './lib/db';

async function testConnection() {
  try {
    const [rows] = await db.query('SELECT 1 AS test');
    console.log('Connection successful:', rows);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();