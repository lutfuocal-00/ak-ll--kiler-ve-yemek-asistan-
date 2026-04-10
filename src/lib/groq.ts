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
1. AŞÇILIK MANTIĞI VE LEZZET UYUMU: Asla birbiriyle alakasız malzemeleri karıştırıp mantıksız tarifler uydurma. Tarifler gerçekçi ve Türk damak tadına uygun olmalıdır.
2. DESTANSI DETAY: Yapılış adımlarını (instructions) ASLA kısa kesme. Her tarifin yapılışı EN AZ 5-6 MADDELİK uzun ve detaylı bir rehber olmalıdır. Fırın kaç derece olacak, tavada kaç dakika pişecek, adım adım usta bir şef gibi anlat.
3. KÜSURAT KONTROLÜ: Yumurta, soğan gibi "adet" olanlarda küsurat kullanma. Su bardağı, kaşık gibi ölçülerde buçuklu (0.5, 1.5) kullanabilirsin.
4. GERÇEKÇİ VE EMEK İSTEYEN TARİFLER (AŞIRI ÖNEMLİ): Kesinlikle "ekmeğe çikolata sür", "meyveleri doğra karıştır", "sandviç yap" gibi pişirme gerektirmeyen, tembel ve basit atıştırmalıklar YAZMA. Kullanıcı tatlı veya yemek istiyorsa; ocakta kaynayan, tavada kızaran veya fırınlanan GERÇEK mutfak tarifleri ver. Eksikleri tamamlamak için evdeki temel malzemeleri (un, şeker, sıvı yağ, tereyağı, kabartma tozu, vanilya, süt, salça, soğan) kullanarak adamakıllı hamur işleri, sütlü tatlılar veya tencere yemekleri kurgula.
5. EV TİPİ ÖLÇÜLER: Gram veya ml kullanma; DAİMA "su bardağı", "kaşık", "tutam" gibi pratik ölçüler kullan.

JSON Formatı:
"recipes" adında bir dizi döndür. Objeler şunları içermeli:
1. "title": Tarif adı.
2. "basePortion": Kaç kişilik (sayısal).
3. "ingredients": Malzemeler (name, amount, unit).
4. "instructions": Yapılış adımları. (DİKKAT: Markdown formatında, EN AZ 5 madde, adım adım, uzun cümlelerle, süre ve sıcaklık mutlaka belirtilmiş destansı bir metin olmalı. Asla özet geçme).
5. "macros": Besin değerleri (calories, protein, carbs, fat).
6. "usedIngredients": Kullanılan ana malzemeler listesi.`;

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
