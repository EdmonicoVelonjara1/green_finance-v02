import type { StockData } from "./data-utils"

// Fonction pour générer une prédiction basée sur la régression linéaire
export function generateLinearPrediction(
  data: StockData[],
  predictionDays: number,
): { date: Date; prediction: number }[] {
  // Extraire les données pour la régression
  const x: number[] = []
  const y: number[] = []

  data.forEach((day, index) => {
    x.push(index)
    y.push(day.close)
  })

  // Calculer les coefficients de la régression linéaire (y = mx + b)
  const n = x.length
  const sumX = x.reduce((acc, val) => acc + val, 0)
  const sumY = y.reduce((acc, val) => acc + val, 0)
  const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0)
  const sumXX = x.reduce((acc, val) => acc + val * val, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Générer les prédictions
  const predictions: { date: Date; prediction: number }[] = []

  for (let i = 0; i < predictionDays; i++) {
    const predictedIndex = x.length + i
    const predictedValue = slope * predictedIndex + intercept

    // Calculer la date pour cette prédiction
    const lastDate = new Date(data[data.length - 1].date)
    const predictionDate = new Date(lastDate)
    predictionDate.setDate(predictionDate.getDate() + i + 1)

    predictions.push({
      date: predictionDate,
      prediction: predictedValue,
    })
  }

  return predictions
}

// Fonction pour générer une prédiction basée sur la moyenne mobile
export function generateMovingAveragePrediction(
  data: StockData[],
  window: number,
  predictionDays: number,
): { date: Date; prediction: number }[] {
  const prices = data.map((day) => day.close)
  const predictions: { date: Date; prediction: number }[] = []

  // Générer les prédictions
  for (let i = 0; i < predictionDays; i++) {
    let startIdx = prices.length - window + i
    if (startIdx < 0) startIdx = 0

    let endIdx = prices.length + i
    if (endIdx > prices.length) {
      // Utiliser les valeurs prédites précédemment
      endIdx = prices.length
      for (let j = 0; j < i - (prices.length - startIdx); j++) {
        prices.push(predictions[j].prediction)
      }
    }

    const windowPrices = prices.slice(startIdx, endIdx)
    const average = windowPrices.reduce((acc, val) => acc + val, 0) / windowPrices.length

    // Calculer la date pour cette prédiction
    const lastDate = new Date(data[data.length - 1].date)
    const predictionDate = new Date(lastDate)
    predictionDate.setDate(predictionDate.getDate() + i + 1)

    predictions.push({
      date: predictionDate,
      prediction: average,
    })
  }

  return predictions
}

// Fonction pour générer une prédiction basée sur le lissage exponentiel double (Holt-Winters)
export function generateExponentialSmoothingPrediction(
  data: StockData[],
  alpha: number,
  beta: number,
  predictionDays: number,
): { date: Date; prediction: number }[] {
  const prices = data.map((day) => day.close)
  const predictions: { date: Date; prediction: number }[] = []

  // Initialiser le niveau et la tendance
  let level = prices[0]
  let trend = prices[1] - prices[0]

  // Mettre à jour le niveau et la tendance avec les données historiques
  for (let i = 1; i < prices.length; i++) {
    const oldLevel = level
    level = alpha * prices[i] + (1 - alpha) * (level + trend)
    trend = beta * (level - oldLevel) + (1 - beta) * trend
  }

  // Générer les prédictions
  for (let i = 0; i < predictionDays; i++) {
    const prediction = level + (i + 1) * trend

    // Calculer la date pour cette prédiction
    const lastDate = new Date(data[data.length - 1].date)
    const predictionDate = new Date(lastDate)
    predictionDate.setDate(predictionDate.getDate() + i + 1)

    predictions.push({
      date: predictionDate,
      prediction: prediction,
    })
  }

  return predictions
}

// Fonction pour évaluer la qualité des prédictions
export function evaluatePrediction(
  predictions: { date: Date; prediction: number }[],
  actualData: StockData[],
): { mae: number; rmse: number; accuracy: number } {
  if (predictions.length === 0 || actualData.length === 0) {
    return { mae: 0, rmse: 0, accuracy: 0 }
  }

  // S'assurer que nous avons le même nombre de points de données
  const n = Math.min(predictions.length, actualData.length)

  let sumAbsError = 0
  let sumSquaredError = 0
  let correctDirections = 0

  for (let i = 0; i < n; i++) {
    const predicted = predictions[i].prediction
    const actual = actualData[i].close

    // Calculer l'erreur absolue et l'erreur quadratique
    const absError = Math.abs(predicted - actual)
    sumAbsError += absError
    sumSquaredError += absError * absError

    // Vérifier si la direction du mouvement est correcte
    if (i > 0) {
      const predictedDirection = predicted > predictions[i - 1].prediction
      const actualDirection = actual > actualData[i - 1].close

      if (predictedDirection === actualDirection) {
        correctDirections++
      }
    }
  }

  // Calculer les métriques
  const mae = sumAbsError / n
  const rmse = Math.sqrt(sumSquaredError / n)
  const accuracy = n > 1 ? (correctDirections / (n - 1)) * 100 : 0

  return { mae, rmse, accuracy }
}

// Fonction pour calculer l'intervalle de confiance
export function calculateConfidenceInterval(
  predictions: { date: Date; prediction: number }[],
  stdDev: number,
  confidenceLevel = 0.95,
): { date: Date; prediction: number; lower: number; upper: number }[] {
  // Calculer le z-score pour le niveau de confiance donné
  // Pour 95%, z = 1.96
  const z = 1.96

  return predictions.map((pred) => ({
    date: pred.date,
    prediction: pred.prediction,
    lower: pred.prediction - z * stdDev,
    upper: pred.prediction + z * stdDev,
  }))
}
