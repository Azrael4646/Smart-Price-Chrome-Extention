import { GoogleGenAI, Type } from "@google/genai";

export interface ProductResult {
  title: string;
  price: number;
  store: string;
  url: string;
  image: string;
  match_score: number;
}

export async function findCheaperProducts(productTitle: string, currentPriceZar: number): Promise<ProductResult[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find the current prices for "${productTitle}" on South African online retailers like Takealot, Amazon.co.za, Wootware, and Evetech. The current price is R${currentPriceZar}. Find cheaper or similar deals. Return a JSON array of products.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Product title" },
            price: { type: Type.NUMBER, description: "Price in ZAR (number only)" },
            store: { type: Type.STRING, description: "Store name (e.g., Takealot, Amazon.co.za)" },
            url: { type: Type.STRING, description: "URL to the product" },
            image: { type: Type.STRING, description: "URL to product image (placeholder if not found)" },
            match_score: { type: Type.NUMBER, description: "Match score from 0 to 100" }
          },
          required: ["title", "price", "store", "url", "image", "match_score"]
        }
      }
    }
  });

  try {
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
}

export async function generateWishlistImage(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image generation failed", e);
    throw e;
  }
}
