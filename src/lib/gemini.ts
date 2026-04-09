import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function detectIngredientsFromImage(base64Data: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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

  prompt += `Lütfen cevabını JSON formatında ver ve tam olarak 4 FARKLI yemek tarifi seçeneği sun. Tarifler birbirinden olabildiğince farklı olsun.
ÖNEMLİ: Malzeme miktarlarında çok dikkatli ol. Yumurta, soğan, patates, diş sarımsak gibi adetle kullanılan malzemelerde ASLA 1.2, 0.5 gibi küsuratlı sayılar kullanma, daima tam sayı (1, 2, 3 vb.) kullan.
JSON Formatı:
"recipes" adında bir dizi (array) döndür. Her bir tarif objesi şu alanları içermeli:
1. "title": Tarifin adı.
2. "basePortion": Bu tarifin kaç kişilik olduğu (sayısal, örn: 2).
3. "ingredients": Malzemeler listesi. Her biri için "name" (isim), "amount" (sayısal miktar, tam sayı olmalı), "unit" (birim: su bardağı, gram, adet vb.).
4. "instructions": Yapılış adımları (Markdown formatında).
5. "macros": 1 porsiyon için tahmini besin değerleri ("calories", "protein", "carbs", "fat" - hepsi sayısal).
6. "usedIngredients": Eldeki malzemelerden (verilen listeden) tarifte kullanılanların tam isimlerini içeren bir dizi. Kullanılmadıysa boş dizi.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recipes: {
            type: Type.ARRAY,
            description: "Tam olarak 4 farklı yemek tarifi seçeneği.",
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
                      amount: { type: Type.NUMBER, description: "Miktar. Yumurta, soğan gibi sayılabilen şeyler için KESİNLİKLE tam sayı kullanın." },
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

  const text = response.text;
  if (!text) throw new Error("Tarif oluşturulamadı.");
  
  const parsed = JSON.parse(text) as RecipeResponse;
  return parsed.recipes;
}
