import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export interface IDailyReturn {
    date: string
    return: number
}

export async function POST(req: Request) {
  if(!req) {
    return NextResponse.json({
        message:"Erreur"
    })
  }
  try {
    const body = await req.json();
    const {company, year } = body;

    const [rows]: any[] = await db.query(
        "SELECT  date, value FROM yield WHERE year = ? AND company = ? ;",
        [year, company]
    );
    console.log("RAW ROWS:", rows)

    if(!rows) {
        console.warn("Aucune donnée trouvée pour la réquête.");
        return undefined;
    }

    const daily_return: IDailyReturn[] = (rows as any[] ).map(row => ({
        date: new Date(row.date).toDateString(),
        return: row.value,
    }))

    return NextResponse.json({ 
        yield: daily_return 
    });
  } catch (error) {
    console.error("Erreur dans /api/get-year:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des données" },
      { status: 500 }
    );
  }
}

