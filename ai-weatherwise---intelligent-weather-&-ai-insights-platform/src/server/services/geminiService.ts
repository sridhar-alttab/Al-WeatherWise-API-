import { GoogleGenAI, Type } from '@google/genai';
import { AIInsight, CurrentWeather } from '../../types/index.js';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return aiClient;
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

// Resilient Fallback Insight Generator (if offline or API key absent)
export function generateFallbackInsight(current: CurrentWeather): AIInsight {
  const isCold = current.tempC < 12;
  const isHot = current.tempC > 26;
  const isRainy = current.condition.toLowerCase().includes('rain') || current.condition.toLowerCase().includes('drizzle');
  const isWindy = current.windSpeedKmh > 25;

  let outfit: string[];
  let accessories: string[];
  let advice: string;

  if (isCold) {
    outfit = ['Thermal base layer', 'Wool sweater or fleece pullover', 'Insulated winter coat', 'Warm denim or fleece trousers'];
    accessories = ['Knitted beanie', 'Cashmere scarf', 'Water-resistant gloves'];
    advice = 'Temperatures are brisk. Dressing in modular layers will allow comfort between outdoors and heated indoor environments.';
  } else if (isHot) {
    outfit = ['Breathable linen or organic cotton shirt', 'Lightweight shorts or moisture-wicking trousers', 'Comfortable walking sandals or mesh sneakers'];
    accessories = ['Polarized sunglasses', 'Wide-brim hat', 'SPF 50+ Sunscreen'];
    advice = 'Warm and sunny climate. Stay hydrated with electrolytes and seek shaded paths during midday peak solar intensity.';
  } else {
    outfit = ['Casual collared shirt or cotton t-shirt', 'Chinos or comfortable jeans', 'Light windbreaker or denim jacket'];
    accessories = ['Light scarf (optional)', 'Classic sunglasses', 'Comfortable footwear'];
    advice = 'Mild and pleasant conditions. Ideal for casual layering with versatile outerwear for evening temperature drops.';
  }

  if (isRainy) {
    accessories.push('Sturdy windproof umbrella', 'Waterproof footwear / boots');
    advice += ' Wet surface alert: watch your step on marble or tiled pedestrian walkways.';
  }

  const travelCondition: 'Optimal' | 'Caution' | 'Hazardous' = isRainy || isWindy ? 'Caution' : 'Optimal';
  const flightImpact: 'Normal' | 'Minor Delays' | 'Severe Delays' = isRainy && isWindy ? 'Minor Delays' : 'Normal';

  return {
    id: `ai_${Date.now()}_fallback`,
    city: current.city,
    country: current.country,
    generatedAt: new Date().toISOString(),
    aiModel: 'Deterministic WeatherWise Engine (Fallback)',
    summary: `${current.city} is experiencing ${current.condition.toLowerCase()} with temperatures around ${current.tempC}°C (${current.tempF}°F). Atmospheric humidity is at ${current.humidity}% with winds blowing at ${current.windSpeedKmh} km/h (${current.windDirection}). UV index is ${current.uvRating.toLowerCase()} (${current.uvIndex}) with ${current.airQualityLabel.toLowerCase()} air quality.`,
    clothing: {
      title: isCold ? 'Warm Thermal Layering' : isHot ? 'Light & Breathable Attire' : 'Comfortable Smart Casual',
      outfit,
      accessories,
      advice,
    },
    travel: {
      drivingCondition: travelCondition,
      flightImpact,
      precautions: [
        isRainy ? 'Increase following distance on wet pavement by 2-3 car lengths.' : 'Standard traffic conditions expected on major highways.',
        isWindy ? 'Exercise caution when driving high-profile vehicles on open bridges.' : 'Clear roadways and stable crosswinds.',
        'Keep vehicle windshield fluids topped up for clear visibility.',
      ],
    },
    activities: {
      recommended: [
        isRainy ? 'Museum tours and indoor art galleries' : 'Outdoor walking tours and botanical garden strolls',
        'Local café hopping and dining',
        isCold ? 'Warm tea ceremonies & indoor leisure' : 'Riverside promenade jogging in morning hours',
      ],
      avoid: [
        isRainy ? 'Open-air hilltop trekking or biking' : 'Prolonged unshaded sunbathing without UV protection',
        isWindy ? 'Drone flying or outdoor kite surfing' : 'Heavy cardio during peak midday heat',
      ],
      bestTimeOfDay: current.isDay ? 'Late afternoon (16:30 - 18:30) for ideal lighting and pleasant temperatures' : 'Early morning (07:00 - 09:00)',
    },
    severeAlerts: {
      severity: isRainy && isWindy ? 'moderate' : current.uvIndex > 8 ? 'moderate' : 'none',
      title: isRainy && isWindy ? 'Wet Roadways & Wind Advisory' : current.uvIndex > 8 ? 'High Solar Radiation Warning' : 'No Severe Weather Alerts',
      description: isRainy && isWindy
        ? 'Gusty winds coupled with localized precipitation may create reduced braking traction.'
        : current.uvIndex > 8
        ? 'Elevated UV index levels necessitate sun protection between 11:00 and 15:00.'
        : 'All meteorological indicators are within safe thresholds.',
      actionableSteps: [
        'Monitor local weather radar updates before embarking on long commutes.',
        'Ensure electronic devices are adequately charged in case of localized power fluctuations.',
      ],
    },
    isAIGenerated: false,
  };
}

// Generate Gemini AI Weather Insight
export async function generateWeatherInsight(
  current: CurrentWeather,
  forecastSummary?: string,
  userPromptCustom?: string
): Promise<AIInsight> {
  const client = getAiClient();
  if (!client) {
    return generateFallbackInsight(current);
  }

  const prompt = `You are the Lead Meteorologist and Lifestyle AI Advisor for AI WeatherWise API.
Analyze this real-time meteorological data for ${current.city}, ${current.country}:
- Temperature: ${current.tempC}°C / ${current.tempF}°F (Feels like: ${current.feelsLikeC}°C)
- Current Condition: ${current.condition}
- Humidity: ${current.humidity}%
- Wind: ${current.windSpeedKmh} km/h (${current.windDirection})
- UV Index: ${current.uvIndex} (${current.uvRating})
- Air Quality: ${current.airQualityLabel} (${current.airQualityIndex})
- Daylight: ${current.isDay ? 'Daytime' : 'Nighttime'}
- Sunrise / Sunset: ${current.sunrise} / ${current.sunset}
${forecastSummary ? `- Forecast Context: ${forecastSummary}` : ''}
${userPromptCustom ? `- Special User Request: ${userPromptCustom}` : ''}

Generate structured, actionable insights. Return strictly JSON matching the required schema.`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are AI WeatherWise, a world-class meteorological intelligence system. Provide high precision, practical, and enjoyable weather summaries, clothing advice, commute/travel impacts, activity suggestions, and severe weather warnings.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Concise 2-3 sentence overview of the current weather and how it feels.',
            },
            clothing: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                outfit: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                accessories: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                advice: { type: Type.STRING },
              },
              required: ['title', 'outfit', 'accessories', 'advice'],
            },
            travel: {
              type: Type.OBJECT,
              properties: {
                drivingCondition: {
                  type: Type.STRING,
                  description: 'Optimal, Caution, or Hazardous',
                },
                flightImpact: {
                  type: Type.STRING,
                  description: 'Normal, Minor Delays, or Severe Delays',
                },
                precautions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['drivingCondition', 'flightImpact', 'precautions'],
            },
            activities: {
              type: Type.OBJECT,
              properties: {
                recommended: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                avoid: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                bestTimeOfDay: { type: Type.STRING },
              },
              required: ['recommended', 'avoid', 'bestTimeOfDay'],
            },
            severeAlerts: {
              type: Type.OBJECT,
              properties: {
                severity: {
                  type: Type.STRING,
                  description: 'none, low, moderate, high, or severe',
                },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                actionableSteps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['severity', 'title', 'description', 'actionableSteps'],
            },
          },
          required: ['summary', 'clothing', 'travel', 'activities', 'severeAlerts'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return generateFallbackInsight(current);
    }

    const parsed = JSON.parse(text);

    return {
      id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      city: current.city,
      country: current.country,
      generatedAt: new Date().toISOString(),
      aiModel: 'Google Gemini 3.8 Flash',
      summary: parsed.summary,
      clothing: {
        title: parsed.clothing?.title || 'Appropriate Seasonal Attire',
        outfit: parsed.clothing?.outfit || ['Light jacket', 'Comfortable pants'],
        accessories: parsed.clothing?.accessories || ['Sunglasses'],
        advice: parsed.clothing?.advice || 'Dress comfortably for current conditions.',
      },
      travel: {
        drivingCondition: (parsed.travel?.drivingCondition as any) || 'Optimal',
        flightImpact: (parsed.travel?.flightImpact as any) || 'Normal',
        precautions: parsed.travel?.precautions || ['Regular commute conditions apply.'],
      },
      activities: {
        recommended: parsed.activities?.recommended || ['Outdoor walks', 'Sightseeing'],
        avoid: parsed.activities?.avoid || [],
        bestTimeOfDay: parsed.activities?.bestTimeOfDay || 'Mid-morning or late afternoon',
      },
      severeAlerts: {
        severity: (parsed.severeAlerts?.severity as any) || 'none',
        title: parsed.severeAlerts?.title || 'Normal Meteorological State',
        description: parsed.severeAlerts?.description || 'No hazardous conditions detected.',
        actionableSteps: parsed.severeAlerts?.actionableSteps || ['Continue standard daily routines.'],
      },
      isAIGenerated: true,
    };
  } catch (err) {
    console.warn('Gemini AI generation failed, falling back to local heuristic engine:', err);
    return generateFallbackInsight(current);
  }
}
