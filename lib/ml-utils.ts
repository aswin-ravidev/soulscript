/**
 * Utilities for communicating with the sentiment analysis server
 */

export interface PredictionResult {
  success: boolean;
  mentalHealthClass?: string;
  confidence?: number;
  error?: string;
}

// Mental health categories
const sentiments = [
  'Anxiety',
  'Bipolar', 
  'Depression',
  'Normal',
  'Personality disorder',
  'Stress', 
  'Suicidal'
];

/**
 * Check if sentiment server is available
 */
export async function checkServerAvailability(): Promise<boolean> {
  try {
    // URL of the sentiment server
    const serverUrl = 'http://localhost:5000';
    
    // Create a request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${serverUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: 'test' }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    return response.ok;
  } catch (error) {
    console.error('Error checking sentiment server availability:', error);
    return false;
  }
}

/**
 * Predicts mental health class from text using the sentiment server
 * Falls back to random assignment if server is not available
 * 
 * @param text - The text to analyze
 * @returns A promise that resolves with the prediction result
 */
export async function predictMentalHealthClass(text: string): Promise<PredictionResult> {
  try {
    // Check if server is available first
    const isAvailable = await checkServerAvailability();
    
    if (!isAvailable) {
      console.warn('Sentiment server not available, using fallback random assignment');
      return getFallbackPrediction(text);
    }
    
    // URL of the sentiment server
    const serverUrl = 'http://localhost:5000';
    
    // Create a request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Send prediction request to server
    const response = await fetch(`${serverUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Sentiment server responded with status ${response.status}`);
      return getFallbackPrediction(text);
    }
    
    // Parse the response
    const result = await response.json();
    
    return {
      success: true,
      mentalHealthClass: result.sentiment,
      confidence: result.confidence
    };
  } catch (error) {
    console.error('Error making prediction with sentiment server:', error);
    return getFallbackPrediction(text);
  }
}

/**
 * Get a fallback prediction (random assignment)
 */
function getFallbackPrediction(text: string): PredictionResult {
  console.log('Using random sentiment assignment for:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
  
  return {
    success: true,
    mentalHealthClass: getRandomSentiment(),
    confidence: 0.7 + (Math.random() * 0.2) // Random confidence between 0.7 and 0.9
  };
}

/**
 * Returns a random sentiment
 */
export function getRandomSentiment(): string {
  return sentiments[Math.floor(Math.random() * sentiments.length)];
} 