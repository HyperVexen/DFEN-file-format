
import { GoogleGenAI, Type } from "@google/genai";
import type { FontPairing } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This will not be shown to the end user in the production env where API_KEY is set.
  // It's a development-time safeguard.
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        header: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                fontFamily: { type: Type.STRING },
            },
        },
        body: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                fontFamily: { type: Type.STRING },
            },
        },
        reasoning: { type: Type.STRING },
    },
};


export const getFontPairing = async (baseFont: string): Promise<FontPairing> => {
  try {
    const prompt = `
      I am designing a document and have chosen "${baseFont}" as a primary font. 
      I need a good font pairing for it. Suggest one font for headings and one for body text. 
      The base font "${baseFont}" could be either the heading or body font, or you can suggest two new ones that pair well with it.
      Provide a brief reasoning for your choice, explaining why the fonts work well together (e.g., contrast, mood, x-height).
      For the fontFamily property, provide a standards-compliant CSS font-family string. For example, for Georgia, it would be "Georgia, serif".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    // Basic validation to ensure the response shape is correct.
    if (
        parsedJson.header?.name && parsedJson.header?.fontFamily &&
        parsedJson.body?.name && parsedJson.body?.fontFamily &&
        parsedJson.reasoning
    ) {
      return parsedJson as FontPairing;
    } else {
      throw new Error("AI response was not in the expected format.");
    }
  } catch (error) {
    console.error("Error fetching font pairing:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
       throw new Error("The Gemini API key is invalid. Please check your configuration.");
    }
    throw new Error("Failed to get font suggestion from AI.");
  }
};
