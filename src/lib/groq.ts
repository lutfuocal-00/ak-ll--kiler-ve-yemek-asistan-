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

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function detectIngredientsFromImage(base64Data: string, mimeType: string) {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API anahtarı bulunamadı. Lütfen ayarlarınızdan API anahtarını ekleyin.");
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.2-90b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Bu fotoğraftaki tüm yiyecek ve malzemeleri tespit et, sadece isimlerini virgülle ayırarak döndür. Başka hiçbir açıklama, başlık veya kelime yazma. Sadece virgülle ayrılmış liste."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content;
    
    if (!text) return [];
    
    return text.split(',')
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0)
      .map((item: string) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase());
  } catch (error: any) {
    const isQuotaError = 
      error?.message?.includes('429') || 
      error?.status === 429 || 
      error?.toString().includes('quota') || 
      error?.toString().includes('rate limit');
      
    if (isQuotaError) {
      throw new Error("Şu anda sistemde yoğunluk var, lütfen daha sonra tekrar deneyin.");
    }
    
    console.error("Groq API Error (Image):", error);
    throw error;
  }
}

export async function generateRecipe(
  pantryItems: string[],
  category: string | null,
  quickRecipeQuery: string | null,
  dietaryPreference: string = 'Standart',
  unitPreference: string = 'Metrik'
): Promise<RecipeData[]> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API anahtarı bulunamadı. Lütfen ayarlarınızdan API anahtarını ekleyin.");
  }

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
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Sen profesyonel bir aşçısın. Sadece istenen JSON formatında yanıt ver. JSON dışında hiçbir metin, açıklama veya markdown bloğu (```json) kullanma."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let text = data.choices[0]?.message?.content;
    
    if (!text) throw new Error("Tarif oluşturulamadı.");
    
    // Clean up potential markdown formatting if the model ignored response_format
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
      error?.toString().includes('rate limit');
      
    if (isQuotaError) {
      throw new Error("Şu anda sistemde yoğunluk var, lütfen daha sonra tekrar deneyin.");
    }
    
    console.error("Groq API Error:", error);
    throw error;
  }
}
