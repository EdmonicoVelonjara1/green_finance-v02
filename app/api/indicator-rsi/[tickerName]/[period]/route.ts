import { db } from "@/lib/db";

export interface IRsiSignal {
  date: string
  type: string
  description: string
  signal: string
}


export async function GET(
  req: Request,
  { params }: { params: { tickerName: string; period: string } }
) {
  const { tickerName, period } = params;

  if (!["7", "14", "21"].includes(period)) {
    return Response.json({ error: "Période invalide" }, { status: 400 });
  }

  try {
    const tickerResult = await db.query(
      "SELECT id FROM ticker WHERE name = ?",
      [tickerName]
    );
    type TickerRow = { id: number };
    const tickerRows: TickerRow[] = Array.isArray(tickerResult[0]) ? tickerResult[0] as TickerRow[] : [];
    if (!tickerRows.length) {
      console.warn("Aucun ticker trouvé pour la requête.");
      return Response.json({ error: "Ticker introuvable" }, { status: 404 });
    }
 
    const tickerId = tickerRows[0].id;

    const [rows] = await db.query(`
      SELECT 
        r.date,
        r.rsi_14,
        smd.close,
        check_rsi_condition(r.date, ?, r.rsi_14, smd.close) AS isSignal
      FROM indicator_rsi r
      JOIN stock_market_data smd ON r.id_ticker = smd.id_ticker AND r.date = smd.date
      WHERE r.id_ticker = ?
      ORDER BY r.date ASC
    `, [tickerId, tickerId]);

    return Response.json(rows, { status: 200 });
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}