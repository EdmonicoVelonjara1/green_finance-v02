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

// GET handler to fetch predictions for a specific company
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const model = searchParams.get('model') || 'linear';
  const trainingPeriod = searchParams.get('trainingPeriod') || '180';
  const predictionDays = searchParams.get('predictionDays') || '30';

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        prediction_date AS date,
        predicted_price AS prediction,
        confidence_lower AS lower,
        confidence_upper AS upper,
        confidence_level,
        training_period,
        prediction_horizon,
        ma_window,
        alpha,
        beta
      FROM predictions
      WHERE ticker = ? AND model_type = ?
      AND training_period = ? AND prediction_horizon = ?
      ORDER BY prediction_date ASC
      `,
      [ticker, model, parseInt(trainingPeriod), parseInt(predictionDays)]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler to insert new predictions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      ticker,
      prediction_date,
      model_type,
      predicted_price,
      confidence_lower,
      confidence_upper,
      confidence_level,
      training_period,
      prediction_horizon,
      ma_window,
      alpha,
      beta,
    } = body;

    if (!ticker || !prediction_date || !model_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await pool.query(
      `
      INSERT INTO predictions (
        ticker, prediction_date, model_type, predicted_price,
        confidence_lower, confidence_upper, confidence_level,
        training_period, prediction_horizon, ma_window, alpha, beta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        ticker,
        prediction_date,
        model_type,
        predicted_price,
        confidence_lower,
        confidence_upper,
        confidence_level,
        training_period,
        prediction_horizon,
        ma_window,
        alpha,
        beta,
      ]
    );

    return NextResponse.json({ message: 'Prediction saved successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error saving prediction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
