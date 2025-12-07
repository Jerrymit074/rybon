import { GoogleGenAI } from "@google/genai";
import { ChannelParams, SimulationResult } from '../types';

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateBusinessInsight = async (
  result: SimulationResult,
  channels: ChannelParams[],
  focusedChannelId: string | null
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "API Key missing. Cannot generate AI insights.";

  const channelDataStr = result.channelResults.map(r => {
    const name = channels.find(c => c.id === r.id)?.name;
    return `${name}: Spend $${Math.round(result.totalSpend * (channels.find(c => c.id === r.id) ? 1 : 0))} (Logic limitation in prompt gen, simplified), Revenue $${Math.round(r.revenue)}, ROI ${r.roi.toFixed(2)}x, Marginal ROI (Next $100): $${r.marginalRoi.toFixed(2)}`;
  }).join('\n');

  const context = `
    You are a commercially minded senior data strategist explaining MMM (Marketing Mix Modeling) results to a non-technical CEO.
    
    Current Simulation State:
    Total Spend: $${Math.round(result.totalSpend)}
    Total Revenue: $${Math.round(result.totalRevenue)}
    Total ROI: ${result.totalROI.toFixed(2)}x

    Channel Details:
    ${channelDataStr}

    ${focusedChannelId 
      ? `The user is specifically asking about "${channels.find(c => c.id === focusedChannelId)?.name}". Explain why its performance looks the way it does (mention saturation or diminishing returns if applicable).` 
      : "Provide a high-level executive summary. Where is the waste? Where is the opportunity? Keep it brief (max 3 sentences)."}

    Style Guide:
    - No academic jargon (avoid "hill function", "coefficients").
    - Use business terms: "Diminishing returns", "Sweet spot", "Saturated", "Efficiency".
    - Be direct and actionable.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: context,
    });
    return response.text || "Could not generate insight.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating insight. Please check API configuration.";
  }
};
