import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function detectIngredientsFromImage(base64Data: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Bu fotoğraftaki tüm yiyecek ve malzemeleri tespit et, sadece isimlerini virgülle ayırarak döndür. Başka hiçbir açıklama, başlık veya kelime yazma. Sadece virgülle ayrılmış liste.",
          },
        ],
      },
    });
    
    const text = response.text;
    if (!text) return [];
    
    return text.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(item => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase());
  } catch (error: any) {
    const isQuotaError = 
      error?.message?.includes('429') || 
      error?.status === 429 || 
      error?.toString().includes('quota') || 
      error?.toString().includes('RESOURCE_EXHAUSTED') ||
      error?.error?.code === 429 ||
      error?.error?.status === 'RESOURCE_EXHAUSTED';
      
    if (isQuotaError) {
      throw new Error("Şu anda sistemde yoğunluk var, lütfen daha sonra tekrar deneyin.");
    }
    
    console.error("Gemini API Error (Image):", error);
    throw error;
  }
}

export interface RecipeData {
  title: string;
  basePortion: number;
  ingredients: { name: string; amount: number; unit: string }[];
  instructions: string;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  usedIngredients: string[];
}

export interface RecipeResponse {
  recipes: RecipeData[];
}

export async function generateRecipe(
  pantryItems: string[],
  category: string | null,
  quickRecipeQuery: string | null,
  dietaryPreference: string = 'Standart',
  unitPreference: string = 'Metrik'
): Promise<RecipeData[]> {
  let prompt = "";
  
  if (quickRecipeQuery) {
    prompt = `Tarif isteği: "${quickRecipeQuery}".\n`;
    if (category) prompt += `Kategori: ${category}\n`;
    if (pantryItems.length > 0) prompt += `Eldeki malzemeler: ${pantryItems.join(", ")}. Mümkünse bunları kullan.\n`;
  } else {
    prompt = `Eldeki malzemeler: ${pantryItems.join(", ")}.\n`;
    if (category) prompt += `Kategori: ${category}\n`;
    prompt += `Bu malzemelerle güzel tarifler ver. Temel malzemeler (tuz, yağ vb.) eklenebilir.\n`;
  }

  prompt += `Beslenme Tercihi: ${dietaryPreference}\n`;
  prompt += `Ölçü Birimi: ${unitPreference}\n\n`;

  prompt += `Lütfen cevabını JSON formatında ver ve tam olarak 4 FARKLI yemek tarifi seçeneği sun.
ÖNEMLİ KURALLAR:
1. YANIT SÜRESİ ÇOK ÖNEMLİ: Mümkün olan en kısa sürede yanıt ver.
2. HIZ İÇİN: Yapılış adımlarını (instructions) çok kısa, öz ve madde madde yaz. Uzun cümlelerden kaçın.
3. KÜSURAT: Yumurta, soğan, patates, diş sarımsak gibi adetle kullanılan malzemelerde ASLA 1.2, 0.5 gibi küsuratlı sayılar kullanma, DAİMA tam sayı (1, 2, 3 vb.) kullan.

JSON Formatı:
"recipes" adında bir dizi (array) döndür. Her bir tarif objesi şu alanları içermeli:
1. "title": Tarifin adı.
2. "basePortion": Bu tarifin kaç kişilik olduğu (sayısal, örn: 2).
3. "ingredients": Malzemeler listesi. Her biri için "name" (isim), "amount" (sayısal miktar, tam sayı olmalı), "unit" (birim: su bardağı, gram, adet vb.).
4. "instructions": Yapılış adımları (Markdown formatında, ÇOK KISA, en fazla 3 cümle).
5. "macros": 1 porsiyon için tahmini besin değerleri ("calories", "protein", "carbs", "fat" - hepsi sayısal).
6. "usedIngredients": Eldeki malzemelerden (verilen listeden) tarifte kullanılanların tam isimlerini içeren bir dizi. Kullanılmadıysa boş dizi.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  basePortion: { type: Type.NUMBER },
                  ingredients: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        amount: { type: Type.NUMBER },
                        unit: { type: Type.STRING }
                      },
                      required: ["name", "amount", "unit"]
                    }
                  },
                  instructions: { type: Type.STRING },
                  macros: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER }
                    },
                    required: ["calories", "protein", "carbs", "fat"]
                  },
                  usedIngredients: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["title", "basePortion", "ingredients", "instructions", "macros", "usedIngredients"]
              }
            }
          },
          required: ["recipes"],
        },
      },
    });

    let text = response.text;
    if (!text) throw new Error("Tarif oluşturulamadı.");
    
    // Clean up potential markdown formatting if the model ignored responseMimeType
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsed = JSON.parse(text) as RecipeResponse;
    if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
      throw new Error("Geçersiz JSON formatı: 'recipes' dizisi bulunamadı.");
    }
    return parsed.recipes;
  } catch (error: any) {
    const isQuotaError = 
      error?.message?.includes('429') || 
      error?.status === 429 || 
      error?.toString().includes('quota') || 
      error?.toString().includes('RESOURCE_EXHAUSTED') ||
      error?.error?.code === 429 ||
      error?.error?.status === 'RESOURCE_EXHAUSTED';
      
    if (isQuotaError) {
      throw new Error("Şu anda sistemde yoğunluk var, lütfen daha sonra tekrar deneyin.");
    }
    
    console.error("Gemini API Error:", error);
    throw error;
  }
}
