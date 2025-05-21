// Fonctions utilitaires pour le traitement des données boursières

export interface StockData {
  date: Date
  open: number
  high: number
  low: number
  close: number
  adjClose: number
  volume: number
}

// Fonction pour obtenir l'URL du dataset en fonction de l'entreprise sélectionnée
export function getDatasetUrl(company: string): string {
  // Pour l'instant, nous utilisons le même dataset pour toutes les entreprises
  // Dans une application réelle, vous auriez différentes URLs pour chaque entreprise
  const datasets: Record<string, string> = {
    MCD: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BRK-A-MzopJKjw3E8T85i5AIYQoOKdvl3vTG.csv",
    YUM: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BRK-A-MzopJKjw3E8T85i5AIYQoOKdvl3vTG.csv",
    WEN: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BRK-A-MzopJKjw3E8T85i5AIYQoOKdvl3vTG.csv",
    PZZA: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BRK-A-MzopJKjw3E8T85i5AIYQoOKdvl3vTG.csv",
    QSR: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BRK-A-MzopJKjw3E8T85i5AIYQoOKdvl3vTG.csv",
    DNKN: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BRK-A-MzopJKjw3E8T85i5AIYQoOKdvl3vTG.csv",
    SBUX: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/BRK-A-MzopJKjw3E8T85i5AIYQoOKdvl3vTG.csv",
  }

  return datasets[company] || datasets.MCD
}

export async function fetchStockData(url: string): Promise<StockData[]> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des données: ${response.status}`)
    }

    const csvText = await response.text()
    return parseCSV(csvText)
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error)
    return []
  }
}

// Fonction pour simuler des données pour une entreprise spécifique
export function getSimulatedDataForCompany(company: string): StockData[] {
  // Générer des données simulées basées sur le symbole de l'entreprise
  const basePrice =
    {
      MCD: 250,
      YUM: 130,
      WEN: 20,
      PZZA: 80,
      QSR: 70,
      DNKN: 75,
      SBUX: 95,
    }[company] || 100

  const volatility =
    {
      MCD: 0.02,
      YUM: 0.025,
      WEN: 0.03,
      PZZA: 0.035,
      QSR: 0.025,
      DNKN: 0.03,
      SBUX: 0.025,
    }[company] || 0.02

  const data: StockData[] = []
  const today = new Date()
  let price = basePrice

  // Générer 365 jours de données
  for (let i = 365; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Simuler une variation de prix
    const change = price * (Math.random() * volatility * 2 - volatility)
    const open = price
    const close = price + change
    const high = Math.max(open, close) * (1 + Math.random() * 0.01)
    const low = Math.min(open, close) * (1 - Math.random() * 0.01)
    const volume = Math.floor(Math.random() * 1000000) + 500000

    data.push({
      date,
      open,
      high,
      low,
      close,
      adjClose: close,
      volume,
    })

    price = close
  }

  return data
}

function parseCSV(csvText: string): StockData[] {
  const lines = csvText.trim().split("\n")
  const headers = lines[0].split(",")

  return lines.slice(1).map((line) => {
    const values = line.split(",")
    return {
      date: new Date(values[0]),
      open: Number.parseFloat(values[1]),
      high: Number.parseFloat(values[2]),
      low: Number.parseFloat(values[3]),
      close: Number.parseFloat(values[4]),
      adjClose: Number.parseFloat(values[5]),
      volume: Number.parseInt(values[6].replace(/"/g, ""), 10),
    }
  })
}

// Calcul des rendements journaliers
export function calculateDailyReturns(data: StockData[]): { date: Date; return: number }[] {
  if (!data || data.length <= 1) return []

  return data.slice(1).map((day, index) => ({
    date: day.date,
    return: ((day.close - data[index].close) / data[index].close) * 100,
  }))
}

// Calcul de la moyenne mobile simple
export function calculateSMA(data: StockData[], period: number): { date: Date; sma: number | null }[] {
  if (!data || data.length === 0) return []

  return data.map((day, index) => {
    if (index < period - 1) {
      return { date: day.date, sma: null }
    }

    const sum = data.slice(index - period + 1, index + 1).reduce((acc, d) => acc + d.close, 0)
    return { date: day.date, sma: sum / period }
  })
}

// Remplacer la fonction calculateEMA par cette version corrigée qui évite la récursion infinie
export function calculateEMA(data: StockData[], period: number): { date: Date; ema: number | null }[] {
  if (!data || data.length === 0) return []

  const k = 2 / (period + 1)
  const result: { date: Date; ema: number | null }[] = []

  // Initialiser les valeurs EMA
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push({ date: data[i].date, ema: data[i].close })
    } else if (i < period - 1) {
      result.push({ date: data[i].date, ema: null })
    } else if (i === period - 1) {
      // Calculer la première EMA comme une SMA
      const sum = data.slice(0, period).reduce((acc, d) => acc + d.close, 0)
      result.push({ date: data[i].date, ema: sum / period })
    } else {
      // Utiliser la formule EMA récursive avec la valeur précédente déjà calculée
      const previousEMA = result[i - 1].ema
      if (previousEMA === null) {
        result.push({ date: data[i].date, ema: null })
      } else {
        const ema = (data[i].close - previousEMA) * k + previousEMA
        result.push({ date: data[i].date, ema })
      }
    }
  }

  return result
}

// Calcul de l'écart-type (volatilité)
export function calculateStandardDeviation(data: StockData[], period: number): { date: Date; stdDev: number | null }[] {
  if (!data || data.length === 0) return []

  return data.map((day, index) => {
    if (index < period - 1) {
      return { date: day.date, stdDev: null }
    }

    const subset = data.slice(index - period + 1, index + 1)
    const mean = subset.reduce((acc, d) => acc + d.close, 0) / period
    const squaredDiffs = subset.map((d) => Math.pow(d.close - mean, 2))
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / period

    return { date: day.date, stdDev: Math.sqrt(variance) }
  })
}

// Calcul des bandes de Bollinger
export function calculateBollingerBands(
  data: StockData[],
  period: number,
  multiplier = 2,
): {
  date: Date
  middle: number | null
  upper: number | null
  lower: number | null
}[] {
  if (!data || data.length === 0) return []

  const smaValues = calculateSMA(data, period)
  const stdDevValues = calculateStandardDeviation(data, period)

  return data.map((day, index) => {
    if (index < period - 1) {
      return {
        date: day.date,
        middle: null,
        upper: null,
        lower: null,
      }
    }

    const sma = smaValues[index].sma
    const stdDev = stdDevValues[index].stdDev

    if (sma === null || stdDev === null) {
      return {
        date: day.date,
        middle: null,
        upper: null,
        lower: null,
      }
    }

    return {
      date: day.date,
      middle: sma,
      upper: sma + stdDev * multiplier,
      lower: sma - stdDev * multiplier,
    }
  })
}

// Remplacer la fonction calculateRSI par cette version corrigée
export function calculateRSI(data: StockData[], period = 14): { date: Date; rsi: number | null }[] {
  if (!data || data.length <= period) {
    return data ? data.map((day) => ({ date: day.date, rsi: null })) : []
  }

  // Calculer les variations de prix
  const deltas = []
  for (let i = 1; i < data.length; i++) {
    deltas.push({
      date: data[i].date,
      delta: data[i].close - data[i - 1].close,
    })
  }

  // Initialiser les tableaux pour les gains et les pertes
  const gains = deltas.map((d) => ({ date: d.date, gain: d.delta > 0 ? d.delta : 0 }))
  const losses = deltas.map((d) => ({ date: d.date, loss: d.delta < 0 ? -d.delta : 0 }))

  // Tableau pour stocker les résultats RSI
  const result: { date: Date; rsi: number | null }[] = []

  // Ajouter des valeurs nulles pour les premiers points
  for (let i = 0; i < period; i++) {
    result.push({ date: data[i].date, rsi: null })
  }

  // Calculer la première moyenne
  let avgGain = gains.slice(0, period).reduce((sum, g) => sum + g.gain, 0) / period
  let avgLoss = losses.slice(0, period).reduce((sum, l) => sum + l.loss, 0) / period

  // Calculer le premier RSI
  let rs = avgLoss === 0 ? Number.POSITIVE_INFINITY : avgGain / avgLoss
  let rsi = 100 - 100 / (1 + rs)
  result.push({ date: data[period].date, rsi })

  // Calculer les RSI suivants
  for (let i = period + 1; i < data.length; i++) {
    // Mettre à jour les moyennes avec la formule de lissage
    avgGain = (avgGain * (period - 1) + gains[i - 1].gain) / period
    avgLoss = (avgLoss * (period - 1) + losses[i - 1].loss) / period

    // Calculer le RSI
    rs = avgLoss === 0 ? Number.POSITIVE_INFINITY : avgGain / avgLoss
    rsi = 100 - 100 / (1 + rs)

    result.push({ date: data[i].date, rsi })
  }

  return result
}

// Calcul du MACD (Moving Average Convergence Divergence)
export function calculateMACD(
  data: StockData[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): {
  date: Date
  macd: number | null
  signal: number | null
  histogram: number | null
}[] {
  if (!data || data.length === 0) return []

  const fastEMA = calculateEMA(data, fastPeriod)
  const slowEMA = calculateEMA(data, slowPeriod)

  // Calculer la ligne MACD (différence entre EMA rapide et EMA lente)
  const macdLine = data.map((day, index) => {
    if (index < slowPeriod - 1) {
      return { date: day.date, macd: null }
    }

    const fast = fastEMA[index].ema
    const slow = slowEMA[index].ema

    if (fast === null || slow === null) {
      return { date: day.date, macd: null }
    }

    return { date: day.date, macd: fast - slow }
  })

  // Créer un tableau de données pour calculer l'EMA de la ligne MACD
  const macdData = macdLine.map((d) => ({
    date: d.date,
    close: d.macd !== null ? d.macd : 0,
  })) as StockData[]

  // Calculer la ligne de signal (EMA de la ligne MACD)
  const signalLine = calculateEMA(macdData, signalPeriod)

  // Calculer l'histogramme (différence entre MACD et signal)
  return data.map((day, index) => {
    if (index < slowPeriod + signalPeriod - 2) {
      return {
        date: day.date,
        macd: null,
        signal: null,
        histogram: null,
      }
    }

    const macd = macdLine[index].macd
    const signal = signalLine[index].ema

    if (macd === null || signal === null) {
      return {
        date: day.date,
        macd,
        signal,
        histogram: null,
      }
    }

    return {
      date: day.date,
      macd,
      signal,
      histogram: macd - signal,
    }
  })
}

// Calcul des statistiques descriptives
export function calculateStatistics(data: StockData[]): {
  mean: number
  median: number
  min: number
  max: number
  stdDev: number
  skewness: number
  kurtosis: number
} {
  // Vérifier si les données sont définies et non vides
  if (!data || data.length === 0) {
    return {
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      stdDev: 0,
      skewness: 0,
      kurtosis: 0,
    }
  }

  const prices = data.map((d) => d.close)
  const n = prices.length

  // Moyenne
  const mean = prices.reduce((acc, price) => acc + price, 0) / n

  // Médiane
  const sortedPrices = [...prices].sort((a, b) => a - b)
  const median = n % 2 === 0 ? (sortedPrices[n / 2 - 1] + sortedPrices[n / 2]) / 2 : sortedPrices[Math.floor(n / 2)]

  // Min et Max
  const min = Math.min(...prices)
  const max = Math.max(...prices)

  // Écart-type
  const squaredDiffs = prices.map((price) => Math.pow(price - mean, 2))
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / n
  const stdDev = Math.sqrt(variance)

  // Asymétrie (skewness)
  const cubedDiffs = prices.map((price) => Math.pow((price - mean) / stdDev, 3))
  const skewness = cubedDiffs.reduce((acc, val) => acc + val, 0) / n

  // Kurtosis
  const fourthPowerDiffs = prices.map((price) => Math.pow((price - mean) / stdDev, 4))
  const kurtosis = fourthPowerDiffs.reduce((acc, val) => acc + val, 0) / n - 3 // Excess kurtosis

  return {
    mean,
    median,
    min,
    max,
    stdDev,
    skewness,
    kurtosis,
  }
}

// Calcul des rendements cumulés
export function calculateCumulativeReturns(data: StockData[]): { date: Date; return: number }[] {
  if (!data || data.length === 0) return []

  const initialPrice = data[0].close

  return data.map((day) => ({
    date: day.date,
    return: (day.close / initialPrice - 1) * 100,
  }))
}

// Calcul du drawdown (baisse maximale)
export function calculateDrawdown(data: StockData[]): {
  date: Date
  drawdown: number
  maxDrawdown: number
}[] {
  if (!data || data.length === 0) return []

  let peak = data[0].close
  let maxDrawdown = 0

  return data.map((day) => {
    if (day.close > peak) {
      peak = day.close
    }

    const drawdown = ((peak - day.close) / peak) * 100
    maxDrawdown = Math.max(maxDrawdown, drawdown)

    return {
      date: day.date,
      drawdown,
      maxDrawdown,
    }
  })
}

// Formatage des données pour les graphiques
export function formatDataForCharts(data: StockData[]): any[] {
  if (!data || data.length === 0) return []

  return data.map((day) => ({
    date: new Date(day.date).toISOString().split("T")[0],
    open: day.open,
    high: day.high,
    low: day.low,
    close: day.close,
    volume: day.volume,
  }))
}
