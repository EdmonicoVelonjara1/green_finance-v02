import { NextResponse } from 'next/server';
import { Pool, createPool } from 'mysql2/promise';

// Database connection configuration
const pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// GET handler to fetch moving averages and crossover signals
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const smaPeriods = searchParams.get('smaPeriods')?.split(',').map(Number) || [20, 50, 200];
  const emaPeriods = searchParams.get('emaPeriods')?.split(',').map(Number) || [12, 26];

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        calculation_date AS date,
        price,
        sma_period,
        sma_value,
        ema_period,
        ema_value,
        crossover_type,
        crossover_description,
        signal_type
      FROM moving_averages
      WHERE ticker = ? 
        AND (sma_period IN (?) OR ema_period IN (?))
      ORDER BY calculation_date ASC
      `,
      [ticker, smaPeriods, emaPeriods]
    );

    // Transform data to match chartData structure
    const chartData = rows.map((row: any) => ({
      date: new Date(row.date).toISOString().split('T')[0],
      price: row.price,
      sma1: row.sma_period === smaPeriods[0] ? row.sma_value : null,
      sma2: row.sma_period === smaPeriods[1] ? row.sma_value : null,
      sma3: row.sma_period === smaPeriods[2] ? row.sma_value : null,
      ema1: row.ema_period === emaPeriods[0] ? row.ema_value : null,
      ema2: row.ema_period === emaPeriods[1] ? row.ema_value : null,
    }));

    // Aggregate crossover signals
    const crossovers = rows
      .filter((row: any) => row.crossover_type !== 'none')
      .map((row: any) => ({
        date: new Date(row.date).toLocaleDateString(),
        type: row.crossover_type.includes('bullish') ? `Croisement ${row.crossover_type.includes('sma') ? 'haussier' : 'EMA haussier'}` : `Croisement ${row.crossover_type.includes('sma') ? 'baissier' : 'EMA baissier'}`,
        description: row.crossover_description,
        signal: row.signal_type === 'buy' ? 'Achat' : row.signal_type === 'sell' ? 'Vente' : 'Aucun',
      }))
      .slice(-5)
      .reverse();

    return NextResponse.json({ chartData, crossovers });
  } catch (error) {
    console.error('Error fetching moving averages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler to insert new moving average data
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      ticker,
      calculation_date,
      price,
      sma_period,
      sma_value,
      ema_period,
      ema_value,
      crossover_type,
      crossover_description,
      signal_type,
    } = body;

    if (!ticker || !calculation_date || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await pool.query(
      `
      INSERT INTO moving_averages (
        ticker, calculation_date, price, sma_period, sma_value,
        ema_period, ema_value, crossover_type, crossover_description, signal_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        ticker,
        calculation_date,
        price,
        sma_period,
        sma_value,
        ema_period,
        ema_value,
        crossover_type || 'none',
        crossover_description || null,
        signal_type || 'none',
      ]
    );

    return NextResponse.json({ message: 'Moving average data saved successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error saving moving average data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
