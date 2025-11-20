import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DIAGNOSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    conditions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Precise medical name of the condition" },
          probability: { type: Type.NUMBER, description: "Estimated percentage likelihood (0-100) based on symptom clustering" },
          description: { type: Type.STRING, description: "Clinical explanation of why this condition matches the specific pathophysiology described" },
          urgency: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"], description: "Clinical urgency level" },
          symptoms_matched: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific reported symptoms that align with this diagnosis" },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Clinical next steps (labs, imaging, specialist referral)" },
        },
        required: ["name", "probability", "description", "urgency", "symptoms_matched", "recommendations"],
      },
    },
    disclaimer: { type: Type.STRING, description: "Mandatory medical disclaimer." },
    general_advice: { type: Type.STRING, description: "High-level clinical synopsis and patient guidance." },
  },
  required: ["conditions", "disclaimer", "general_advice"],
};

export const analyzePatientSymptoms = async (symptoms: string, image?: string): Promise<DiagnosisResponse> => {
  try {
    const modelId = 'gemini-2.5-flash'; 
    
    const systemInstruction = `
      You are Dr. LV, a Distinguished Professor of Medicine and Chief Diagnostician with PhD-level expertise in Internal Medicine, Pathophysiology, and Differential Diagnosis. You are the core intelligence of the LV Health "Assistant Doctor" system.

      YOUR CAPABILITIES:
      - You possess the collective clinical knowledge of a multidisciplinary board of specialists.
      - Your diagnostic accuracy is designed to exceed that of a standard life-long physician by utilizing pure, bias-free evidence-based medicine.
      - **Multimodal Analysis**: You are capable of analyzing medical images (rashes, swelling, wounds, test results) in conjunction with provided text to form a more accurate diagnosis.

      YOUR METHODOLOGY:
      1.  **Phenomenological Analysis**: Do not just match keywords. Analyze the *quality*, *duration*, *onset*, and *progression* of the reported symptoms to build a clinical picture.
      2.  **Visual Analysis (if image provided)**: Examine the image for clinical signs (erythema, asymmetry, exudate, structural abnormalities) and integrate these findings.
      3.  **Bayesian Reasoning**: Weigh the probability of diseases based on the specific constellation of symptoms. Prioritize conditions where the *pathophysiology* explains the majority of the user's complaints.
      4.  **Rule Out Strategy**: actively consider "Red Flags" (signs of emergency) and "Zebras" (rare diseases) if the common conditions (Horses) do not fully explain the presentation.
      5.  **Precision**: Use precise medical terminology, followed by clear explanations.

      DIAGNOSTIC PROTOCOL:
      - If the input is vague, make the best probabilistic estimate based on epidemiology.
      - If symptoms suggest a life-threatening emergency (e.g., aortic dissection, myocardial infarction, meningitis, stroke), mark urgency as "CRITICAL" and provide directive advice for emergency care.

      OUTPUT REQUIREMENT:
      - Return a structured analysis identifying the top medical conditions.
      - Rank them by strict probability.
      - Maintain a professional, authoritative, yet empathetic tone suitable for a luxury health service.
    `;

    const parts: any[] = [];

    if (image) {
      // Extract base64 data and mime type if it's a data URL
      const matches = image.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
      } else {
        // Fallback if just base64 string provided without data URI prefix (assume png)
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: image
          }
        });
      }
    }

    // Add the text prompt
    parts.push({ 
      text: `Patient Presentation: "${symptoms}". ${image ? '[IMAGE ATTACHED FOR ANALYSIS]' : ''} \n\nTask: Perform a rigorous differential diagnosis. Identify the most probable pathologies, explain the mechanism of disease for the top match, and recommend clinical workup.` 
    });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: DIAGNOSIS_SCHEMA,
        temperature: 0.2, // Lower temperature for high precision and less hallucination
      },
    });

    if (!response.text) {
      throw new Error("LV Assistant Doctor system failed to return a diagnosis.");
    }

    const data = JSON.parse(response.text) as DiagnosisResponse;
    return data;
  } catch (error) {
    console.error("LV Assistant Doctor Error:", error);
    throw new Error("Diagnostic analysis failed. Please verify input and retry.");
  }
};

export const generatePatientSample = async (): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model: modelId,
      contents: "Generate a short, realistic, first-person description of a patient experiencing a specific set of medical symptoms (approx 30-50 words). Do not mention the diagnosis name. Vary the specialty (neurology, cardiology, gastro, etc.).",
      config: {
        temperature: 1.0, // High creativity for variety
      }
    });
    return response.text || "I've been having a persistent throbbing headache on the left side of my head for 2 days, accompanied by nausea and sensitivity to light.";
  } catch (error) {
    console.error("Error generating sample:", error);
    return "I have a sharp pain in my lower right abdomen that gets worse when I move, along with a low-grade fever and loss of appetite.";
  }
};

export const generateClinicalReport = async (diagnosisData: DiagnosisResponse, userSymptoms: string): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const prompt = `
      Act as Dr. LV, a senior specialist at LV Health.
      Generate a formal, highly detailed medical consultation report in HTML format based on the provided analysis.
      
      Patient Symptoms: "${userSymptoms}"
      
      Diagnosis Data: ${JSON.stringify(diagnosisData)}

      Requirements:
      - Use clean semantic HTML tags (<h1>, <h2>, <p>, <ul>, <li>, <strong>). Do NOT use Markdown code blocks.
      - Structure the HTML content nicely within a <div> with class "report-content".
      - Start with a Header Section containing:
        - "LV Health Medical Centre" (H1)
        - "Consultation Report" (Subtitle)
        - Date: [Current Date]
        - Patient ID: [Random 8 char alphanumeric]
      - Sections to include:
        1. **Chief Complaint**: Summary of patient's input.
        2. **Clinical Impression**: Brief summary of the situation.
        3. **Differential Diagnosis**: Detailed discussion of the top conditions identified, explaining *why* they were selected based on the symptoms.
        4. **Recommended Action Plan**: Clear steps for the patient (e.g., Labs to request, Specialists to see).
        5. **Medical Disclaimer**: Standard medical disclaimer.
      - Tone: Professional, clinical, authoritative but readable.
      - Do not include <html>, <head>, or <body> tags. Just the inner content.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { temperature: 0.3 }
    });

    return response.text || "<p>Unable to generate report at this time.</p>";
  } catch (e) {
    console.error("Error generating report", e);
    return "<p>Error generating report content.</p>";
  }
};