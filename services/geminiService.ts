import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResponse, UrgencyLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DIAGNOSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    conditions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the medical condition" },
          probability: { type: Type.NUMBER, description: "Estimated percentage likelihood (0-100)" },
          description: { type: Type.STRING, description: "Brief explanation of the condition in relation to symptoms" },
          urgency: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"], description: "Urgency level of the condition" },
          symptoms_matched: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of user symptoms that match this condition" },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actionable next steps for the user" },
        },
        required: ["name", "probability", "description", "urgency", "symptoms_matched", "recommendations"],
      },
    },
    disclaimer: { type: Type.STRING, description: "A mandatory medical disclaimer stating this is AI generated and not professional advice." },
    general_advice: { type: Type.STRING, description: "General health advice based on the context." },
  },
  required: ["conditions", "disclaimer", "general_advice"],
};

export const analyzeSymptoms = async (symptoms: string): Promise<DiagnosisResponse> => {
  try {
    const modelId = 'gemini-2.5-flash'; // Using flash for speed and good reasoning on structured tasks
    
    const systemInstruction = `
      You are an advanced medical diagnostic AI assistant designed to help users understand potential health conditions based on their symptoms.
      
      Your Goal:
      1. Analyze the provided symptoms carefully.
      2. Identify the top 3-5 most likely medical conditions.
      3. Estimate a probability confidence for each.
      4. Assess the urgency level.
      5. Provide clear, concise descriptions and actionable recommendations (e.g., "See a doctor immediately", "Rest and hydrate").
      
      IMPORTANT SAFETY GUIDELINES:
      - You are NOT a doctor. You are an AI simulation.
      - Always prioritize user safety. If symptoms suggest a life-threatening emergency (heart attack, stroke, severe bleeding), mark urgency as "Critical" and advise calling emergency services immediately.
      - Be objective and empathetic.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Patient reports the following symptoms: "${symptoms}". Provide a differential diagnosis.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: DIAGNOSIS_SCHEMA,
        temperature: 0.3, // Low temperature for more deterministic/factual medical responses
      },
    });

    if (!response.text) {
      throw new Error("No response received from AI.");
    }

    const data = JSON.parse(response.text) as DiagnosisResponse;
    return data;
  } catch (error) {
    console.error("Diagnosis Error:", error);
    throw new Error("Failed to analyze symptoms. Please try again.");
  }
};