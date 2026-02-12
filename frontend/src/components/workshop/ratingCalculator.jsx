/**
 * Sistema di calcolo rating semplificato per officine
 * 
 * Usa direttamente il rating a stelle del cliente (1-5)
 * senza calcoli complessi che distorcono la media reale
 */

// Soglia per ottenere il badge oro (5 stelle con almeno 50 feedback)
const GOLD_BADGE_THRESHOLD = {
  MIN_REVIEWS: 50,
  MIN_RATING: 4.9
};

/**
 * Analizza il sentiment del commento (semplificato)
 * In produzione si userebbe un modello NLP
 */
export function analyzeCommentSentiment(comment) {
  if (!comment) return 0.5; // Neutro se non c'è commento

  const positiveWords = [
    'ottimo', 'eccellente', 'perfetto', 'bravo', 'professionale', 'consiglio',
    'veloce', 'preciso', 'onesto', 'gentile', 'disponibile', 'fantastico',
    'super', 'top', 'magnifico', 'impeccabile', 'soddisfatto', 'raccomando',
    'cortese', 'competente', 'affidabile', 'puntuale', 'economico', 'qualità'
  ];
  
  const negativeWords = [
    'pessimo', 'terribile', 'sconsiglio', 'lento', 'caro', 'costoso',
    'incompetente', 'maleducato', 'disonesto', 'truffa', 'deluso', 'mai più',
    'scarso', 'inadeguato', 'sbagliato', 'errore', 'problema', 'rotto',
    'peggiorato', 'incapace', 'scortese', 'ritardo', 'sporco'
  ];

  const lowerComment = comment.toLowerCase();
  let score = 0;
  let wordCount = 0;

  positiveWords.forEach(word => {
    if (lowerComment.includes(word)) {
      score += 1;
      wordCount++;
    }
  });

  negativeWords.forEach(word => {
    if (lowerComment.includes(word)) {
      score -= 1;
      wordCount++;
    }
  });

  if (wordCount === 0) return 0.5;
  
  // Normalizza tra 0 e 1
  const normalized = (score / wordCount + 1) / 2;
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Calcola il punteggio di corrispondenza categoria
 */
export function calculateCategoryMatch(serviceRequested, workshopServices) {
  if (!serviceRequested || !workshopServices || workshopServices.length === 0) {
    return 0.5; // Neutro se non ci sono dati
  }
  
  // Controlla se il servizio richiesto è tra i servizi dell'officina
  const isMatch = workshopServices.some(service => 
    service.toLowerCase().includes(serviceRequested.toLowerCase()) ||
    serviceRequested.toLowerCase().includes(service.toLowerCase())
  );
  
  return isMatch ? 1 : 0.5;
}

/**
 * Calcola il rating per una singola recensione
 * Usa direttamente il rating del cliente
 */
export function calculateReviewScore(params) {
  const {
    customerRating,        // 1-5 stelle dal cliente
  } = params;

  // Ritorna semplicemente il rating del cliente
  return customerRating;
}

/**
 * Aggiorna i rating per categoria dell'officina
 */
export function updateCategoryRatings(currentRatings, category, newScore) {
  const ratings = { ...currentRatings } || {};
  
  if (!category) return ratings;

  if (!ratings[category]) {
    ratings[category] = {
      rating: newScore,
      count: 1,
      total_score: newScore,
      gold_badge: false
    };
  } else {
    const cat = ratings[category];
    cat.count += 1;
    cat.total_score = (cat.total_score || cat.rating * (cat.count - 1)) + newScore;
    cat.rating = cat.total_score / cat.count;
    
    // Controlla se merita il badge oro (ogni 50 feedback)
    if (cat.count >= GOLD_BADGE_THRESHOLD.MIN_REVIEWS && 
        cat.count % 50 === 0 && 
        cat.rating >= GOLD_BADGE_THRESHOLD.MIN_RATING) {
      cat.gold_badge = true;
    }
  }

  return ratings;
}

/**
 * Calcola il rating complessivo dell'officina
 */
export function calculateOverallRating(categoryRatings) {
  if (!categoryRatings || Object.keys(categoryRatings).length === 0) {
    return 0;
  }

  let totalWeightedScore = 0;
  let totalCount = 0;

  Object.values(categoryRatings).forEach(cat => {
    totalWeightedScore += cat.rating * cat.count;
    totalCount += cat.count;
  });

  if (totalCount === 0) return 0;
  
  return totalWeightedScore / totalCount;
}

/**
 * Aggiorna l'accuratezza AI dell'officina
 */
export function updateAIAccuracy(currentScore, currentCount, wasCorrect) {
  const newCount = currentCount + 1;
  const correctValue = wasCorrect ? 1 : 0;
  const newScore = ((currentScore * currentCount) + correctValue) / newCount;
  
  return {
    score: newScore,
    count: newCount
  };
}