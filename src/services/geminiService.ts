import { GoogleGenAI, Modality } from "@google/genai";
import { StockData, SearchResult, MarketTrends, MarketOverview } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getMarketOverview(): Promise<MarketOverview> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `Current Date: ${new Date().toISOString()}.
          Fetch a COMPREHENSIVE overview of the Nigerian Stock Market (NGX).
          
          DATA FETCHING (CRITICAL):
          You MUST use the Google Search tool to fetch the LATEST real-time data.
          Look for:
          1. The overall NGX All-Share Index (ASI) value and its daily change.
          2. Performance of key sectors: Banking, Telecommunications, Consumer Goods, Industrial Goods, Oil & Gas.
          3. For each sector, find the top 2-3 performing stocks today.
          
          JSON STRUCTURE:
          Return strictly valid JSON:
          {
            "overallIndex": "...",
            "indexChange": "...",
            "indexChangePercent": "...",
            "sectors": [
              {
                "name": "...",
                "change": "...",
                "changePercent": "...",
                "trend": "up" | "down" | "neutral",
                "topStocks": [ { "symbol": "...", "change": "..." } ],
                "description": "A brief, 1-sentence summary of why this sector is moving."
              }
            ],
            "lastUpdated": "..."
          }
          
          Ensure 'lastUpdated' is a human-readable timestamp (e.g., "2024-03-20 14:30 WAT").` }]
        }
      ],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as MarketOverview;
  } catch (error) {
    console.error("Gemini Market Overview Error:", error);
    return {
      overallIndex: "N/A",
      indexChange: "0.00",
      indexChangePercent: "0.00%",
      sectors: [],
      lastUpdated: "Error fetching data"
    };
  }
}

export async function textToSpeech(text: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read this stock analysis summary clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
}

export async function getMarketTrends(): Promise<MarketTrends> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `Current Date: ${new Date().toISOString()}.
          Fetch the LATEST real-time Top 5 Gainers and Top 5 Losers for the Nigerian Stock Market (NGX).
          
          DATA FETCHING (CRITICAL):
          You MUST use the Google Search tool to fetch the LATEST real-time data from today's market session. 
          Look for data from reliable sources like the NGX website (ngxgroup.com), Proshare Nigeria, or major Nigerian financial news outlets.
          
          JSON STRUCTURE:
          Return strictly valid JSON: 
          { 
            "gainers": [ { "name": "...", "symbol": "...", "price": "₦...", "change": "+...%" }, ... ],
            "losers": [ { "name": "...", "symbol": "...", "price": "₦...", "change": "-...%" }, ... ],
            "lastUpdated": "..." 
          }
          
          Ensure 'lastUpdated' is a human-readable timestamp of when the data was retrieved (e.g., "2024-03-20 14:30 WAT").` }]
        }
      ],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as MarketTrends;
  } catch (error) {
    console.error("Gemini Market Trends Error:", error);
    return { gainers: [], losers: [], lastUpdated: "Error fetching data" };
  }
}

export async function analyzeQuery(query: string): Promise<SearchResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `Current Date: ${new Date().toISOString()}.
          Analyze the following query about the Nigerian Stock Market (NGX): "${query}". 
          
          INTENT DETECTION:
          - If the user mentions two or more companies (e.g., "GTCO vs Zenith"), set type to 'comparison'.
          - If the user asks for a list or category (e.g., "Best banking stocks", "Top gainers"), set type to 'discovery'.
          - Otherwise, set type to 'analysis' for a single company.
          
          DATA FETCHING (CRITICAL):
          You MUST use the Google Search tool to fetch the LATEST real-time data for NGX stocks. 
          Do NOT rely on your internal knowledge for current prices, market caps, or recent news.
          Look for data from reliable sources like the NGX website, Proshare, or major Nigerian financial news outlets.
          
          JSON STRUCTURE:
          Return strictly valid JSON matching these rules:
          1. For 'analysis': { "type": "analysis", "data": { ...StockData } }
          2. For 'comparison': { 
               "type": "comparison", 
               "data": [ { ...StockData }, { ...StockData } ], 
               "message": "A detailed, beginner-friendly comparison in Markdown. Explain why one might be better than the other for different types of investors (e.g., growth seekers vs. dividend hunters). Explain any complex financial jargon used." 
             }
          3. For 'discovery': { 
               "type": "discovery", 
               "data": [ { ...StockData }, ... ],
               "message": "A brief, beginner-friendly explanation of why these stocks were selected based on the user's query."
             }
          
          STOCK DATA RULES:
          - Always include currency symbol (₦).
          - Generate 30 days of historical price points in 'chartData' for the main view.
          - Provide 'historicalData' with keys '1D', '1M', '1Y' containing at least 10 points each.
          - Include 'splits' array if any stock splits or reverse splits have occurred. Each split should have 'date', 'ratio', 'type' ('split' or 'reverse'), and 'description'.
          - Include 'news' array with 3-5 latest news items. Each item should have 'headline', 'source', 'date', and 'url'.
          - 'aiSummary' MUST be a detailed, beginner-friendly analysis in Markdown. 
            - Use headers (###) for sections like "Market Position", "Financial Health", and "Investor Outlook".
            - Explain complex terms in parentheses, e.g., "P/E Ratio (Price-to-Earnings Ratio, which shows how much investors are willing to pay for every ₦1 of profit)".
            - Use bullet points for key takeaways.
            - Keep the tone professional yet accessible.
          - 'investmentScore' (0-100) based on stability, dividends, and growth.
          - 'metrics' should include 3 key indicators (e.g., Growth, Dividends, Risk).
          - 'lastUpdated': The timestamp of the data you found (e.g., "2024-03-20 14:30 WAT").
          - 'source': The URL or name of the source you used for the real-time data.
          
          If the query is invalid or not about NGX, return { "type": "error", "message": "..." }.` }]
        }
      ],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as SearchResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      type: 'error',
      message: "I couldn't process that request right now. Please try searching for a specific NGX ticker like 'GTCO' or 'DANGCEM'."
    };
  }
}

export async function refreshStocks(symbols: string[]): Promise<StockData[]> {
  if (symbols.length === 0) return [];
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `Current Date: ${new Date().toISOString()}.
          Refresh the LATEST real-time data for these NGX stock symbols: ${symbols.join(', ')}.
          
          DATA FETCHING (CRITICAL):
          You MUST use the Google Search tool to fetch the LATEST real-time data for these stocks. 
          Look for data from reliable sources like the NGX website, Proshare, or major Nigerian financial news outlets.
          
          JSON STRUCTURE:
          Return strictly valid JSON: { "data": [ { ...StockData }, ... ] }
          
          STOCK DATA RULES:
          - Always include currency symbol (₦).
          - Include current price, change, changePercent, and lastUpdated.
          - Also include updated chartData (30 days) and historicalData (1D, 1M, 1Y).
          - 'lastUpdated': The timestamp of the data you found (e.g., "2024-03-20 14:30 WAT").
          - 'source': The URL or name of the source you used for the real-time data.` }]
        }
      ],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result.data || [];
  } catch (error) {
    console.error("Gemini Refresh Error:", error);
    return [];
  }
}
