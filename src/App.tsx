import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ChefHat, Search, CheckCircle2, Utensils, Coffee, Sun, Moon, CakeSlice, Loader2, X, Camera, Mic, MicOff, Volume2, VolumeX, Image as ImageIcon, Minus, Flame, Droplets, Wheat, Activity, Settings, Instagram, ChevronDown, Download, RefreshCw, ArrowLeft, History, BookOpen, PlusCircle, RotateCcw, Share2 } from 'lucide-react';
import Markdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { generateRecipe, detectIngredientsFromImage, RecipeData } from './lib/gemini';

const INGREDIENT_DB = [
  // Sebzeler & Yeşillikler
  { name: 'Domates', icon: '🍅', category: 'Sebze' }, { name: 'Soğan', icon: '🧅', category: 'Sebze' }, { name: 'Sarımsak', icon: '🧄', category: 'Sebze' },
  { name: 'Patates', icon: '🥔', category: 'Sebze' }, { name: 'Biber', icon: '🌶️', category: 'Sebze' }, { name: 'Havuç', icon: '🥕', category: 'Sebze' },
  { name: 'Patlıcan', icon: '🍆', category: 'Sebze' }, { name: 'Mantar', icon: '🍄', category: 'Sebze' }, { name: 'Brokoli', icon: '🥦', category: 'Sebze' },
  { name: 'Kabak', icon: '🥒', category: 'Sebze' }, { name: 'Ispanak', icon: '🥬', category: 'Sebze' }, { name: 'Pırasa', icon: '🥬', category: 'Sebze' },
  { name: 'Kereviz', icon: '🥬', category: 'Sebze' }, { name: 'Lahana', icon: '🥬', category: 'Sebze' }, { name: 'Karnabahar', icon: '🥦', category: 'Sebze' },
  { name: 'Mısır', icon: '🌽', category: 'Sebze' }, { name: 'Bezelye', icon: '🫛', category: 'Sebze' }, { name: 'Taze Fasulye', icon: '🫘', category: 'Sebze' },
  { name: 'Salatalık', icon: '🥒', category: 'Sebze' }, { name: 'Marul', icon: '🥬', category: 'Sebze' }, { name: 'Maydanoz', icon: '🌿', category: 'Sebze' },
  { name: 'Dereotu', icon: '🌿', category: 'Sebze' }, { name: 'Roka', icon: '🥬', category: 'Sebze' }, { name: 'Nane (Taze)', icon: '🌿', category: 'Sebze' },
  { name: 'Enginar', icon: '🥬', category: 'Sebze' }, { name: 'Bamya', icon: '🥒', category: 'Sebze' }, { name: 'Turp', icon: '🧅', category: 'Sebze' },
  { name: 'Bal Kabağı', icon: '🎃', category: 'Sebze' },

  // Kahvaltılık & Süt
  { name: 'Yumurta', icon: '🥚', category: 'Kahvaltılık' }, { name: 'Süt', icon: '🥛', category: 'Süt Ürünleri' }, { name: 'Peynir', icon: '🧀', category: 'Süt Ürünleri' },
  { name: 'Beyaz Peynir', icon: '🧀', category: 'Süt Ürünleri' }, { name: 'Kaşar Peyniri', icon: '🧀', category: 'Süt Ürünleri' }, { name: 'Lor Peyniri', icon: '🧀', category: 'Süt Ürünleri' },
  { name: 'Labne', icon: '🧀', category: 'Süt Ürünleri' }, { name: 'Tereyağı', icon: '🧈', category: 'Süt Ürünleri' }, { name: 'Yoğurt', icon: '🥣', category: 'Süt Ürünleri' }, 
  { name: 'Süzme Yoğurt', icon: '🥣', category: 'Süt Ürünleri' }, { name: 'Krema', icon: '🥛', category: 'Süt Ürünleri' },
  { name: 'Zeytin', icon: '🫒', category: 'Kahvaltılık' }, { name: 'Siyah Zeytin', icon: '🫒', category: 'Kahvaltılık' }, { name: 'Yeşil Zeytin', icon: '🫒', category: 'Kahvaltılık' },
  { name: 'Sucuk', icon: '🥩', category: 'Kahvaltılık' }, { name: 'Sosis', icon: '🌭', category: 'Kahvaltılık' }, { name: 'Pastırma', icon: '🥓', category: 'Kahvaltılık' },
  { name: 'Salam', icon: '🥓', category: 'Kahvaltılık' }, { name: 'Bal', icon: '🍯', category: 'Kahvaltılık' }, { name: 'Reçel', icon: '🍓', category: 'Kahvaltılık' },
  { name: 'Tahin', icon: '🥣', category: 'Kahvaltılık' }, { name: 'Pekmez', icon: '🍯', category: 'Kahvaltılık' }, { name: 'Fıstık Ezmesi', icon: '🥜', category: 'Kahvaltılık' },
  { name: 'Çikolata Kreması', icon: '🍫', category: 'Kahvaltılık' },

  // Et & Tavuk & Balık
  { name: 'Tavuk', icon: '🍗', category: 'Et' }, { name: 'Tavuk Göğsü', icon: '🍗', category: 'Et' }, { name: 'Tavuk Baget', icon: '🍗', category: 'Et' },
  { name: 'Kırmızı Et', icon: '🥩', category: 'Et' }, { name: 'Dana Kuşbaşı', icon: '🥩', category: 'Et' }, { name: 'Kuzu Eti', icon: '🥩', category: 'Et' },
  { name: 'Kıyma', icon: '🥩', category: 'Et' }, { name: 'Köfte', icon: '🧆', category: 'Et' }, 
  { name: 'Balık', icon: '🐟', category: 'Et' }, { name: 'Somon', icon: '🐟', category: 'Et' }, { name: 'Ton Balığı', icon: '🐟', category: 'Et' },
  { name: 'Karides', icon: '🍤', category: 'Et' }, { name: 'Kalamar', icon: '🦑', category: 'Et' },

  // Bakliyat & Tahıl
  { name: 'Pirinç', icon: '🍚', category: 'Bakliyat' }, { name: 'Bulgur', icon: '🌾', category: 'Bakliyat' }, { name: 'Makarna', icon: '🍝', category: 'Bakliyat' }, 
  { name: 'Erişte', icon: '🍝', category: 'Bakliyat' }, { name: 'Arpa Şehriye', icon: '🌾', category: 'Bakliyat' }, { name: 'Tel Şehriye', icon: '🌾', category: 'Bakliyat' },
  { name: 'Nohut', icon: '🫘', category: 'Bakliyat' }, { name: 'Kuru Fasulye', icon: '🫘', category: 'Bakliyat' }, { name: 'Barbunya', icon: '🫘', category: 'Bakliyat' },
  { name: 'Kırmızı Mercimek', icon: '🥣', category: 'Bakliyat' }, { name: 'Yeşil Mercimek', icon: '🥣', category: 'Bakliyat' }, 
  { name: 'Yulaf', icon: '🌾', category: 'Bakliyat' }, { name: 'Kinoa', icon: '🌾', category: 'Bakliyat' }, { name: 'Chia Tohumu', icon: '🌰', category: 'Bakliyat' },
  { name: 'Ekmek', icon: '🍞', category: 'Fırın' }, { name: 'Lavaş', icon: '🫓', category: 'Fırın' }, { name: 'Yufka', icon: '🫓', category: 'Fırın' },

  // Temel & Soslar & Kuruyemiş
  { name: 'Un', icon: '🌾', category: 'Temel' }, { name: 'Tam Buğday Unu', icon: '🌾', category: 'Temel' }, { name: 'Mısır Unu', icon: '🌽', category: 'Temel' },
  { name: 'İrmik', icon: '🌾', category: 'Temel' }, { name: 'Nişasta', icon: '🌾', category: 'Temel' },
  { name: 'Zeytinyağı', icon: '🫒', category: 'Temel' }, { name: 'Ayçiçek Yağı', icon: '🫗', category: 'Temel' }, { name: 'Margarin', icon: '🧈', category: 'Temel' },
  { name: 'Tuz', icon: '🧂', category: 'Baharat' }, { name: 'Şeker', icon: '🧊', category: 'Temel' }, { name: 'Pudra Şekeri', icon: '🧊', category: 'Temel' },
  { name: 'Domates Salçası', icon: '🥫', category: 'Temel' }, { name: 'Biber Salçası', icon: '🥫', category: 'Temel' },
  { name: 'Sirke', icon: '🍾', category: 'Temel' }, { name: 'Nar Ekşisi', icon: '🍾', category: 'Temel' }, { name: 'Soya Sosu', icon: '🍾', category: 'Temel' }, 
  { name: 'Ketçap', icon: '🍅', category: 'Temel' }, { name: 'Mayonez', icon: '🥚', category: 'Temel' }, { name: 'Hardal', icon: '🌭', category: 'Temel' },
  { name: 'Kabartma Tozu', icon: '🧁', category: 'Temel' }, { name: 'Vanilya', icon: '🧁', category: 'Temel' }, { name: 'Kuru Maya', icon: '🍞', category: 'Temel' },
  { name: 'Kakao', icon: '🍫', category: 'Temel' }, { name: 'Damla Çikolata', icon: '🍫', category: 'Temel' },
  { name: 'Ceviz', icon: '🌰', category: 'Kuruyemiş' }, { name: 'Fındık', icon: '🌰', category: 'Kuruyemiş' }, { name: 'Badem', icon: '🌰', category: 'Kuruyemiş' }, 
  { name: 'Antep Fıstığı', icon: '🌰', category: 'Kuruyemiş' }, { name: 'Hindistan Cevizi', icon: '🥥', category: 'Kuruyemiş' },

  // Baharatlar
  { name: 'Karabiber', icon: '🧂', category: 'Baharat' }, { name: 'Pul Biber', icon: '🌶️', category: 'Baharat' }, { name: 'Kırmızı Toz Biber', icon: '🌶️', category: 'Baharat' },
  { name: 'Kekik', icon: '🌿', category: 'Baharat' }, { name: 'Nane', icon: '🌿', category: 'Baharat' }, { name: 'Kimyon', icon: '🧂', category: 'Baharat' }, 
  { name: 'Tarçın', icon: '🪵', category: 'Baharat' }, { name: 'Sumak', icon: '🧂', category: 'Baharat' }, { name: 'Köri', icon: '🍛', category: 'Baharat' }, 
  { name: 'Zerdeçal', icon: '🧂', category: 'Baharat' }, { name: 'Zencefil', icon: '🫚', category: 'Baharat' }, { name: 'Reyhan', icon: '🌿', category: 'Baharat' }, 
  { name: 'Biberiye', icon: '🌿', category: 'Baharat' }, { name: 'Karanfil', icon: '🌸', category: 'Baharat' }, { name: 'Susam', icon: '🌾', category: 'Baharat' }, 
  { name: 'Çörek Otu', icon: '⚫', category: 'Baharat' },

  // Meyveler
  { name: 'Limon', icon: '🍋', category: 'Meyve' }, { name: 'Elma', icon: '🍎', category: 'Meyve' }, { name: 'Muz', icon: '🍌', category: 'Meyve' },
  { name: 'Çilek', icon: '🍓', category: 'Meyve' }, { name: 'Portakal', icon: '🍊', category: 'Meyve' }, { name: 'Mandalina', icon: '🍊', category: 'Meyve' },
  { name: 'Üzüm', icon: '🍇', category: 'Meyve' }, { name: 'Karpuz', icon: '🍉', category: 'Meyve' }, { name: 'Kavun', icon: '🍈', category: 'Meyve' },
  { name: 'Şeftali', icon: '🍑', category: 'Meyve' }, { name: 'Armut', icon: '🍐', category: 'Meyve' }, { name: 'Nar', icon: '🍎', category: 'Meyve' },
  { name: 'İncir', icon: '🫐', category: 'Meyve' }, { name: 'Kiraz', icon: '🍒', category: 'Meyve' }, { name: 'Vişne', icon: '🍒', category: 'Meyve' },
  { name: 'Erik', icon: '🫐', category: 'Meyve' }, { name: 'Kivi', icon: '🥝', category: 'Meyve' }, { name: 'Ananas', icon: '🍍', category: 'Meyve' }, 
  { name: 'Avokado', icon: '🥑', category: 'Meyve' }
];

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
  "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80",
  "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80",
  "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&q=80",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80",
  "https://images.unsplash.com/photo-1460306855393-0410f61241c7?w=800&q=80"
];

const getLevelInfo = (xp: number) => {
  if (xp < 100) return { name: 'Acemi Şef', next: 100, progress: (xp / 100) * 100 };
  if (xp < 300) return { name: 'Çırak Şef', next: 300, progress: ((xp - 100) / 200) * 100 };
  if (xp < 600) return { name: 'Kalfa Şef', next: 600, progress: ((xp - 300) / 300) * 100 };
  if (xp < 1000) return { name: 'Usta Şef', next: 1000, progress: ((xp - 600) / 400) * 100 };
  return { name: 'Mutfak Ustası', next: xp, progress: 100 };
};

const MacroBar = ({ label, value, unit, color, max, icon: Icon }: any) => {
  const percentage = Math.min(100, (value / max) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs font-medium items-center">
        <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
          <Icon size={12} className={color.replace('bg-', 'text-')} />
          <span>{label}</span>
        </div>
        <span className="text-stone-700 dark:text-stone-300">{value}{unit}</span>
      </div>
      <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

export default function App() {
  const [pantry, setPantry] = useState<string[]>(() => {
    const saved = localStorage.getItem('pantry');
    return saved ? JSON.parse(saved) : ['Yumurta', 'Süt', 'Un', 'Domates', 'Biber', 'Peynir'];
  });
  const [newItem, setNewItem] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [quickSearch, setQuickSearch] = useState('');
  
  const [recipeOptions, setRecipeOptions] = useState<RecipeData[] | null>(null);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New states for Camera and Mic features
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // New states for Gamification & Portions
  const [xp, setXp] = useState(() => Number(localStorage.getItem('xp')) || 0);
  const [portion, setPortion] = useState(2);
  const levelInfo = getLevelInfo(xp);

  // Daily Calories Tracker
  const [dailyCalories, setDailyCalories] = useState(() => {
    const saved = localStorage.getItem('dailyCalories');
    const savedDate = localStorage.getItem('lastCookDate');
    const today = new Date().toDateString();
    if (savedDate !== today) {
      return 0;
    }
    return saved ? Number(saved) : 0;
  });

  // Recipe History
  const [recipeHistory, setRecipeHistory] = useState<RecipeData[]>(() => {
    const saved = localStorage.getItem('recipeHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState<'main' | 'history'>('main');
  const [viewingHistoryRecipe, setViewingHistoryRecipe] = useState<RecipeData | null>(null);

  // Ingredient Modal
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState('');

  // Settings states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'orange');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    if (saved !== null) return JSON.parse(saved);
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [dietaryPreference, setDietaryPreference] = useState(() => localStorage.getItem('dietaryPreference') || 'Standart');
  const [unitPreference, setUnitPreference] = useState(() => localStorage.getItem('unitPreference') || 'Metrik');

  // Splash screen states
  const [showSplash, setShowSplash] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // PWA Install Prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Apply dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Apply theme
  useEffect(() => {
    if (theme === 'orange') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Persistence Effects
  useEffect(() => { localStorage.setItem('pantry', JSON.stringify(pantry)); }, [pantry]);
  useEffect(() => { localStorage.setItem('xp', xp.toString()); }, [xp]);
  useEffect(() => { 
    localStorage.setItem('dailyCalories', dailyCalories.toString()); 
    localStorage.setItem('lastCookDate', new Date().toDateString());
  }, [dailyCalories]);
  useEffect(() => { localStorage.setItem('recipeHistory', JSON.stringify(recipeHistory)); }, [recipeHistory]);
  useEffect(() => { localStorage.setItem('dietaryPreference', dietaryPreference); }, [dietaryPreference]);
  useEffect(() => { localStorage.setItem('unitPreference', unitPreference); }, [unitPreference]);

  // Splash screen effect
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1500);

    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // PWA Install Prompt effect
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    setDeferredPrompt(null);
  };

  // Stop speaking when recipe changes or unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [recipeOptions, selectedRecipeIndex]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim() && !pantry.includes(newItem.trim())) {
      setPantry([...pantry, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (itemToRemove: string) => {
    setPantry(pantry.filter(item => item !== itemToRemove));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setError(null);
    try {
      const reader = new FileReader();
      
      const base64String = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          resolve((reader.result as string).split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const ingredients = await detectIngredientsFromImage(base64String, file.type);
      
      if (ingredients.length > 0) {
        setPantry(prev => {
          const newItems = ingredients.filter(i => !prev.some(p => p.toLowerCase() === i.toLowerCase()));
          return [...prev, ...newItems];
        });
      } else {
        setError("Görselde herhangi bir malzeme tespit edilemedi.");
      }
    } catch (err: any) {
      if (!err?.message?.includes('yoğunluk var')) {
        console.error(err);
      }
      setError(err?.message || "Görsel işlenirken bir hata oluştu.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Tarayıcınız ses tanıma özelliğini desteklemiyor.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuickSearch(transcript);
    };
    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const toggleSpeaking = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[#*`_\[\]]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'tr-TR';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleGenerateRecipe = async (isQuickSearch: boolean = false) => {
    if (!isQuickSearch && pantry.length === 0) {
      setError('Lütfen önce kilerinize birkaç malzeme ekleyin.');
      return;
    }
    if (isQuickSearch && !quickSearch.trim()) {
      setError('Lütfen aramak istediğiniz tarifi yazın.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecipeOptions(null);
    setSelectedRecipeIndex(null);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    try {
      const data = await generateRecipe(
        pantry, 
        category, 
        isQuickSearch ? quickSearch.trim() : null,
        dietaryPreference,
        unitPreference
      );
      setRecipeOptions(data);
    } catch (err: any) {
      setError(err?.message || 'Tarif oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
      if (!err?.message?.includes('yoğunluk var')) {
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCooked = (recipeData: RecipeData) => {
    const themeColors: Record<string, string> = {
      orange: '#f97316',
      lila: '#a855f7',
      yesil: '#22c55e',
      mavi: '#3b82f6',
      gul: '#f43f5e'
    };
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: [themeColors[theme] || '#f97316', '#fef08a', '#22c55e']
    });
    setXp(prev => prev + 50);

    if (recipeData) {
      setDailyCalories(prev => prev + recipeData.macros.calories);
      setRecipeHistory(prev => [recipeData, ...prev]);
      if (recipeData.usedIngredients.length > 0) {
        const usedSet = new Set(recipeData.usedIngredients.map(i => i.toLowerCase()));
        setPantry(pantry.filter(item => !usedSet.has(item.toLowerCase())));
      }
    }
    
    setRecipeOptions(null);
    setSelectedRecipeIndex(null);
    setQuickSearch('');
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleShare = async (recipe: RecipeData) => {
    const ratio = portion / (recipe.basePortion || 2);
    const ingredientsText = recipe.ingredients.map(ing => {
      const adjustedAmount = ing.amount ? (ing.amount * ratio).toFixed(1).replace('.0', '') : '';
      return `- ${adjustedAmount} ${ing.unit} ${ing.name}`;
    }).join('\n');

    const shareText = `🍽️ ${recipe.title}\n\nMalzemeler:\n${ingredientsText}\n\n👨‍🍳 Yapılışı:\n${recipe.instructions}\n\n🔥 Kalori: ${recipe.macros.calories} kcal (1 Porsiyon)`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: shareText
        });
      } catch (err) {
        console.log('Paylaşım iptal edildi');
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Tarif panoya kopyalandı!');
    }
  };

  const handleDownload = (recipe: RecipeData) => {
    const ratio = portion / (recipe.basePortion || 2);
    const ingredientsText = recipe.ingredients.map(ing => {
      const adjustedAmount = ing.amount ? (ing.amount * ratio).toFixed(1).replace('.0', '') : '';
      return `- ${adjustedAmount} ${ing.unit} ${ing.name}`;
    }).join('\n');

    const content = `${recipe.title}\n\nMalzemeler:\n${ingredientsText}\n\nYapılışı:\n${recipe.instructions}\n\nBesin Değerleri (1 Porsiyon):\nKalori: ${recipe.macros.calories} kcal\nProtein: ${recipe.macros.protein}g\nKarbonhidrat: ${recipe.macros.carbs}g\nYağ: ${recipe.macros.fat}g`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${recipe.title.replace(/\s+/g, '_').toLowerCase()}_tarifi.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const categories = [
    { id: 'Kahvaltı', icon: Coffee },
    { id: 'Öğle', icon: Sun },
    { id: 'Akşam', icon: Moon },
    { id: 'Tatlı', icon: CakeSlice },
  ];

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-stone-900 text-stone-800 dark:text-stone-200 font-sans selection:bg-primary-200 dark:selection:bg-primary-900/50 pb-20 transition-colors duration-300">
      {/* Splash Screen */}
      {showSplash && (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-stone-900 transition-opacity duration-500 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-red-500 blur-2xl opacity-40 rounded-full animate-pulse"></div>
            <ChefHat size={80} className="text-red-500 relative z-10 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" strokeWidth={1.5} />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-stone-800 border-b border-primary-100 dark:border-stone-700 shadow-sm sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-xl text-primary-600 dark:text-primary-500">
              <ChefHat size={24} />
            </div>
            <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-100 tracking-tight hidden sm:block">Akıllı Kiler <span className="text-primary-500">&</span> Yemek Asistanı</h1>
            <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-100 tracking-tight sm:hidden">Akıllı Kiler</h1>
          </div>

          {/* Gamification & Settings UI */}
          <div className="flex items-center gap-2 sm:gap-4">
            {showInstallButton && (
              <button 
                onClick={handleInstallClick}
                className="hidden sm:flex items-center gap-2 bg-stone-800 dark:bg-stone-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors shadow-sm"
              >
                <Download size={16} />
                <span>İndir</span>
              </button>
            )}
            
            {/* Daily Calories */}
            <div className="flex items-center gap-1.5 bg-primary-50 dark:bg-stone-700 pl-2 pr-1 sm:pl-3 sm:pr-1.5 py-1.5 rounded-xl border border-primary-100 dark:border-stone-600">
              <Flame size={16} className="text-primary-500 shrink-0" />
              <div className="flex flex-col mr-1">
                <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 leading-none">Bugün</span>
                <span className="text-xs sm:text-sm font-bold text-primary-600 dark:text-primary-400 leading-tight">{dailyCalories} kcal</span>
              </div>
              <button 
                onClick={() => setDailyCalories(0)}
                className="p-1.5 text-stone-400 hover:text-primary-600 hover:bg-primary-100 dark:hover:bg-stone-600 dark:hover:text-primary-400 rounded-lg transition-colors"
                title="Kaloriyi Sıfırla"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right">
                <div className="text-xs sm:text-sm font-bold text-primary-600 dark:text-primary-400">{levelInfo.name}</div>
                <div className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400">{xp} / {levelInfo.next} XP</div>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-primary-50 dark:bg-stone-700 flex items-center justify-center border-2 border-primary-200 dark:border-primary-900/50 relative overflow-hidden shadow-inner shrink-0">
                <div className="absolute bottom-0 left-0 w-full bg-primary-500/20 dark:bg-primary-500/30 transition-all duration-1000" style={{height: `${levelInfo.progress}%`}} />
                <ChefHat className="relative z-10 text-primary-600 dark:text-primary-500 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            
            <div className="w-px h-6 sm:h-8 bg-stone-200 dark:bg-stone-700 mx-0 sm:mx-1"></div>
            
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-stone-500 hover:text-primary-500 dark:text-stone-400 dark:hover:text-primary-400 transition-colors"
              aria-label="Ayarlar"
            >
              <Settings size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Pantry */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 shadow-sm border border-primary-100/50 dark:border-stone-700 flex flex-col lg:h-[calc(100vh-8rem)] lg:sticky lg:top-24 transition-colors duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Utensils className="text-primary-400" size={20} />
                  <h2 className="text-lg font-medium">Sanal Kilerim</h2>
                </div>
              </div>

              {/* Camera / Upload Button */}
              <div className="mb-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="w-full flex items-center justify-center gap-2 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 py-3 rounded-2xl transition-colors font-medium border border-stone-200 dark:border-stone-600"
                >
                  {isUploadingImage ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Camera size={18} className="text-primary-500" />
                      <span>Kamera ile Tara / Yükle</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 mb-6 relative">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem(e as any)}
                  placeholder="Malzeme ekle..."
                  className="flex-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl py-3 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-stone-200"
                />
                <button 
                  onClick={() => setIsIngredientModalOpen(true)}
                  className="shrink-0 aspect-square h-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-500 rounded-2xl flex items-center justify-center hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                  aria-label="Görsel Menüden Seç"
                >
                  <PlusCircle size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 custom-scrollbar min-h-[200px]">
                {pantry.length === 0 ? (
                  <div className="text-center text-stone-400 dark:text-stone-500 py-10 flex flex-col items-center gap-3">
                    <div className="bg-stone-50 dark:bg-stone-700/50 p-4 rounded-full">
                      <ImageIcon size={24} className="text-stone-300 dark:text-stone-500" />
                    </div>
                    <p className="text-sm">Kileriniz şu an boş.<br/>Hemen malzeme eklemeye başlayın!</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {pantry.map((item, idx) => (
                      <motion.div 
                        key={item}
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.2 }}
                        className="group flex items-center justify-between bg-stone-50 dark:bg-stone-900 hover:bg-primary-50 dark:hover:bg-stone-700 border border-stone-100 dark:border-stone-700 hover:border-primary-200 dark:hover:border-stone-600 rounded-2xl p-3 transition-all"
                      >
                        <span className="font-medium text-stone-700 dark:text-stone-300">{item}</span>
                        <button 
                          onClick={() => handleRemoveItem(item)}
                          className="text-stone-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors opacity-100 lg:opacity-0 group-hover:opacity-100 focus:opacity-100"
                          aria-label={`${item} sil`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Actions & Results */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Tabs */}
            <div className="flex gap-2 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl self-start">
              <button 
                onClick={() => { setActiveTab('main'); setViewingHistoryRecipe(null); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'main' ? 'bg-white dark:bg-stone-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
              >
                <ChefHat size={18} />
                <span>Mutfak</span>
              </button>
              <button 
                onClick={() => { setActiveTab('history'); setSelectedRecipeIndex(null); setRecipeOptions(null); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white dark:bg-stone-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
              >
                <History size={18} />
                <span>Geçmiş Tariflerim</span>
              </button>
            </div>

            {activeTab === 'main' && (
              <>
                {/* Categories */}
            <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 shadow-sm border border-primary-100/50 dark:border-stone-700 transition-colors duration-300">
              <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">Ne Pişirelim?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const isActive = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(isActive ? null : cat.id)}
                      className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all ${
                        isActive 
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-400 shadow-inner' 
                          : 'bg-stone-50 dark:bg-stone-900 border-stone-100 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-yellow-50 dark:hover:bg-stone-700 hover:border-yellow-200 dark:hover:border-stone-600'
                      }`}
                    >
                      <Icon size={24} className={isActive ? 'text-yellow-600 dark:text-yellow-500' : 'text-stone-400 dark:text-stone-500'} />
                      <span className="font-medium text-sm">{cat.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleGenerateRecipe(false)}
                disabled={isLoading}
                className="relative overflow-hidden group bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white rounded-3xl p-6 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all flex flex-col items-center justify-center gap-3 min-h-[140px]"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-600 dark:from-primary-500 to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
                {isLoading && !quickSearch ? (
                  <Loader2 size={32} className="animate-spin" />
                ) : (
                  <>
                    <ChefHat size={32} className="group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-lg text-center">Elimdekilerle Tarif Ver</span>
                  </>
                )}
              </button>

              <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 shadow-sm border border-primary-100/50 dark:border-stone-700 flex flex-col justify-center gap-3 min-h-[140px] transition-colors duration-300">
                <label className="text-sm font-medium text-stone-500 dark:text-stone-400">Hızlı Tarif (Sadece yaz ve al)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateRecipe(true)}
                    placeholder="Örn: Fırın Makarna"
                    className="flex-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all min-w-0 dark:text-stone-200"
                  />
                  <button
                    onClick={() => handleGenerateRecipe(true)}
                    disabled={isLoading || !quickSearch.trim()}
                    className="bg-stone-800 dark:bg-stone-700 text-white rounded-2xl px-5 hover:bg-stone-700 dark:hover:bg-stone-600 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.1)]"
                  >
                    {isLoading && quickSearch ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-start gap-3">
                <X size={20} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Recipe Options - TikTok Style Feed */}
            <AnimatePresence>
              {recipeOptions && (
                <motion.div 
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-0 z-[100] bg-stone-950 text-stone-100 overflow-y-auto snap-y snap-mandatory custom-scrollbar"
                >
                  {/* Close Button */}
                  <button 
                    onClick={() => {
                      setRecipeOptions(null);
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }}
                    className="fixed top-6 left-6 z-[110] p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>

                  {recipeOptions.map((recipe, idx) => (
                    <div key={idx} className="w-full h-[100dvh] snap-start snap-always relative flex flex-col">
                      {/* Background Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-stone-950 to-stone-950 pointer-events-none" />
                      
                      {/* Content Container */}
                      <div className="relative z-10 flex-1 w-full max-w-3xl mx-auto h-full flex flex-col p-6 pt-24 pb-24 overflow-y-auto custom-scrollbar">
                        <h1 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight drop-shadow-md">{recipe.title}</h1>
                        
                        {/* Portion Control */}
                        <div className="flex items-center gap-4 mb-8 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm w-fit">
                          <Utensils size={20} className="text-primary-400" />
                          <div className="flex items-center gap-4">
                            <button onClick={() => setPortion(Math.max(1, portion - 1))} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Minus size={16} /></button>
                            <span className="font-bold text-xl w-6 text-center">{portion}</span>
                            <button onClick={() => setPortion(Math.min(12, portion + 1))} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Plus size={16} /></button>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                          {/* Ingredients */}
                          <div>
                            <h2 className="text-xl font-bold mb-4 text-primary-400">Malzemeler</h2>
                            <ul className="space-y-3">
                              {recipe.ingredients.map((ing, i) => {
                                const ratio = portion / (recipe.basePortion || 2);
                                const adjustedAmount = ing.amount ? (ing.amount * ratio).toFixed(1).replace('.0', '') : '';
                                return (
                                  <li key={i} className="flex items-start gap-3 text-stone-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
                                    <div>
                                      {adjustedAmount && <span className="font-bold text-white mr-2">{adjustedAmount} {ing.unit}</span>}
                                      <span>{ing.name}</span>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>

                          {/* Macros */}
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm h-fit">
                            <h2 className="text-lg font-bold mb-4 text-primary-400 flex items-center gap-2">
                              <Activity size={18} />
                              <span>Besin Değerleri</span>
                              <span className="text-xs font-normal text-stone-400 ml-auto">(1 Porsiyon)</span>
                            </h2>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                              <MacroBar label="Kalori" value={recipe.macros.calories} unit="kcal" color="bg-primary-500" max={1000} icon={Flame} />
                              <MacroBar label="Protein" value={recipe.macros.protein} unit="g" color="bg-red-500" max={100} icon={Droplets} />
                              <MacroBar label="Karb." value={recipe.macros.carbs} unit="g" color="bg-yellow-500" max={100} icon={Wheat} />
                              <MacroBar label="Yağ" value={recipe.macros.fat} unit="g" color="bg-amber-500" max={100} icon={Droplets} />
                            </div>
                          </div>
                        </div>

                        {/* Instructions */}
                        <div className="mb-8">
                          <h2 className="text-xl font-bold mb-4 text-primary-400">Yapılışı</h2>
                          <div className="markdown-body prose-invert max-w-none text-lg leading-relaxed">
                            <Markdown>{recipe.instructions}</Markdown>
                          </div>
                        </div>
                        
                        <div className="text-sm text-stone-400 mt-auto pt-8">
                          {recipe.usedIngredients.length > 0 ? (
                            <p>Kullanılan kiler malzemeleri: <span className="text-stone-200">{recipe.usedIngredients.join(', ')}</span></p>
                          ) : (
                            <p>Kilerinizden malzeme kullanılmadı.</p>
                          )}
                        </div>
                      </div>

                      {/* Right Side Actions (TikTok style) */}
                      <div className="absolute bottom-24 right-4 sm:right-8 flex flex-col gap-4 z-20 items-center">
                        <button 
                          onClick={() => handleCooked(recipe)} 
                          className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-110 transition-all text-white"
                          title="Bunu Pişirdim"
                        >
                          <CheckCircle2 size={28} />
                        </button>
                        <span className="text-xs font-bold text-white drop-shadow-md mb-2">Pişirdim</span>

                        <button 
                          onClick={() => toggleSpeaking(recipe.instructions)} 
                          className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isSpeaking ? 'bg-primary-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'}`}
                          title="Sesli Oku"
                        >
                          {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>

                        <button 
                          onClick={() => handleShare(recipe)} 
                          className="w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                          title="Paylaş"
                        >
                          <Share2 size={20} />
                        </button>

                        <button 
                          onClick={() => handleDownload(recipe)} 
                          className="w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                          title="İndir"
                        >
                          <Download size={20} />
                        </button>
                      </div>

                      {/* Swipe Indicator */}
                      {idx < recipeOptions.length - 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce text-white/50 z-20 pointer-events-none">
                          <span className="text-xs font-medium mb-1 uppercase tracking-widest">Kaydır</span>
                          <ChevronDown size={24} />
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            </>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-primary-100/50 dark:border-stone-700 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <History className="text-primary-500" size={24} />
                  <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Geçmiş Tariflerim</h2>
                </div>

                {recipeHistory.length === 0 ? (
                  <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                    <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Henüz hiç tarif pişirmediniz.</p>
                    <p className="text-sm mt-2">Mutfak sekmesine gidip yeni tarifler keşfedin!</p>
                  </div>
                ) : viewingHistoryRecipe ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-stone-100 dark:border-stone-700 rounded-3xl overflow-hidden"
                  >
                    <div className="relative bg-primary-500 dark:bg-primary-600 pt-12 pb-6 px-6 text-white rounded-t-3xl">
                      <button 
                        onClick={() => setViewingHistoryRecipe(null)}
                        className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full transition-colors"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <h3 className="text-2xl font-black text-white mt-6">{viewingHistoryRecipe.title}</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded-xl text-center">
                          <div className="text-xs text-stone-500 mb-1">Kalori</div>
                          <div className="font-bold text-primary-600">{viewingHistoryRecipe.macros.calories} kcal</div>
                        </div>
                        <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded-xl text-center">
                          <div className="text-xs text-stone-500 mb-1">Protein</div>
                          <div className="font-bold text-red-600">{viewingHistoryRecipe.macros.protein}g</div>
                        </div>
                        <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded-xl text-center">
                          <div className="text-xs text-stone-500 mb-1">Karb.</div>
                          <div className="font-bold text-yellow-600">{viewingHistoryRecipe.macros.carbs}g</div>
                        </div>
                        <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded-xl text-center">
                          <div className="text-xs text-stone-500 mb-1">Yağ</div>
                          <div className="font-bold text-amber-600">{viewingHistoryRecipe.macros.fat}g</div>
                        </div>
                      </div>
                      <div className="markdown-body">
                        <Markdown>{viewingHistoryRecipe.instructions}</Markdown>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {recipeHistory.map((recipe, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setViewingHistoryRecipe(recipe)}
                        className="cursor-pointer group bg-stone-50 dark:bg-stone-900 rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-700 hover:border-primary-300 transition-all flex items-center gap-4 p-3"
                      >
                        <div className="w-16 h-16 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                          <ChefHat className="w-8 h-8 text-primary-500" />
                        </div>
                        <div className="flex-1 py-1">
                          <h4 className="font-bold text-stone-800 dark:text-stone-200 line-clamp-2 group-hover:text-primary-600 transition-colors">{recipe.title}</h4>
                          <div className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                            <span className="flex items-center gap-1"><Flame size={12}/> {recipe.macros.calories} kcal</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Ingredient Selection Modal */}
      <AnimatePresence>
        {isIngredientModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="bg-white dark:bg-stone-800 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-700"
            >
              <div className="p-5 border-b border-stone-100 dark:border-stone-700 flex justify-between items-center bg-stone-50 dark:bg-stone-900/50">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Utensils className="text-primary-500" />
                  Malzeme Seç
                </h2>
                <button onClick={() => setIsIngredientModalOpen(false)} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 border-b border-stone-100 dark:border-stone-700 bg-white dark:bg-stone-800">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Malzeme ara..." 
                    value={ingredientSearch} 
                    onChange={e => setIngredientSearch(e.target.value)} 
                    className="w-full pl-12 pr-4 py-3.5 bg-stone-100 dark:bg-stone-900 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:text-stone-200 text-lg"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50 dark:bg-stone-900/20 custom-scrollbar">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                  {INGREDIENT_DB.filter(i => i.name.toLowerCase().includes(ingredientSearch.toLowerCase())).map(ing => {
                    const isAdded = pantry.some(p => p.toLowerCase() === ing.name.toLowerCase());
                    return (
                      <button 
                        key={ing.name} 
                        onClick={() => {
                          if(!isAdded) setPantry([...pantry, ing.name]);
                        }} 
                        disabled={isAdded}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                          isAdded 
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-900/50 opacity-60 cursor-not-allowed' 
                            : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-primary-400 hover:shadow-md hover:-translate-y-1'
                        }`}
                      >
                        <span className="text-3xl sm:text-4xl drop-shadow-sm">{ing.icon}</span>
                        <span className="text-xs sm:text-sm font-medium text-center text-stone-700 dark:text-stone-300 leading-tight">{ing.name}</span>
                        {isAdded && <CheckCircle2 size={14} className="absolute top-2 right-2 text-primary-500" />}
                      </button>
                    );
                  })}
                </div>
                {INGREDIENT_DB.filter(i => i.name.toLowerCase().includes(ingredientSearch.toLowerCase())).length === 0 && (
                  <div className="text-center py-10 text-stone-500">
                    Aradığınız malzeme listede bulunamadı.
                  </div>
                )}
                
                {ingredientSearch.trim() && !INGREDIENT_DB.some(i => i.name.toLowerCase() === ingredientSearch.trim().toLowerCase()) && (
                  <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-200 dark:border-primary-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center text-xl shrink-0 mx-auto sm:mx-0">✨</div>
                      <div>
                        <p className="font-medium text-stone-800 dark:text-stone-200">"{ingredientSearch}" listede yok</p>
                        <p className="text-sm text-stone-500 dark:text-stone-400">Yine de kilerinize özel malzeme olarak ekleyebilirsiniz.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!pantry.some(p => p.toLowerCase() === ingredientSearch.trim().toLowerCase())) {
                          setPantry([...pantry, ingredientSearch.trim()]);
                          setIngredientSearch('');
                          setIsIngredientModalOpen(false);
                        }
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors whitespace-nowrap"
                    >
                      Kilere Ekle
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mic Button */}
      <button
        onClick={toggleListening}
        className={`fixed bottom-20 right-8 z-50 p-5 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse scale-110 shadow-[0_0_30px_rgba(239,68,68,0.6)]' 
            : 'bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-105'
        }`}
        aria-label="Sesli arama"
      >
        {isListening ? <MicOff size={28} /> : <Mic size={28} />}
      </button>

      {/* Signature */}
      <div className="fixed bottom-4 right-6 z-40 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-300 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm p-2 rounded-full shadow-sm border border-stone-200/50 dark:border-stone-700/50">
        <a 
          href="https://www.instagram.com/lutfu_ocal?igsh=MXVtdjQzYnN2azBlaQ==" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors hover:scale-110 transform duration-200"
          aria-label="Instagram"
        >
          <Instagram size={20} />
        </a>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-primary-100 dark:border-stone-700 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <Settings className="text-primary-500" />
                Ayarlar
              </h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Theme Color Selection */}
              <div>
                <div className="font-medium text-stone-800 dark:text-stone-200 mb-3">Tema Rengi</div>
                <div className="flex items-center gap-3">
                  {[
                    { id: 'orange', color: 'bg-[#f97316]', name: 'Turuncu' },
                    { id: 'lila', color: 'bg-[#a855f7]', name: 'Lila' },
                    { id: 'yesil', color: 'bg-[#22c55e]', name: 'Yeşil' },
                    { id: 'mavi', color: 'bg-[#3b82f6]', name: 'Mavi' },
                    { id: 'gul', color: 'bg-[#f43f5e]', name: 'Gül' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center transition-transform hover:scale-110 focus:outline-none ${theme === t.id ? 'ring-4 ring-offset-2 ring-stone-300 dark:ring-stone-600 dark:ring-offset-stone-800' : ''}`}
                      title={t.name}
                    >
                      {theme === t.id && <CheckCircle2 size={20} className="text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-stone-800 dark:text-stone-200">Görünüm Modu</div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">Karanlık veya aydınlık tema</div>
                </div>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${isDarkMode ? 'bg-primary-500' : 'bg-stone-300 dark:bg-stone-600'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-300 ${isDarkMode ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Dietary Preference */}
              <div>
                <label className="block font-medium text-stone-800 dark:text-stone-200 mb-1">Beslenme Tercihi</label>
                <div className="relative">
                  <select 
                    value={dietaryPreference}
                    onChange={(e) => setDietaryPreference(e.target.value)}
                    className="w-full appearance-none bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  >
                    <option value="Standart">Standart</option>
                    <option value="Vejetaryen">Vejetaryen</option>
                    <option value="Glutensiz">Glutensiz</option>
                    <option value="Vegan">Vegan</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={20} />
                </div>
              </div>

              {/* Unit Preference */}
              <div>
                <label className="block font-medium text-stone-800 dark:text-stone-200 mb-1">Ölçü Birimleri</label>
                <div className="relative">
                  <select 
                    value={unitPreference}
                    onChange={(e) => setUnitPreference(e.target.value)}
                    className="w-full appearance-none bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  >
                    <option value="Metrik">Metrik (Gram, ml)</option>
                    <option value="Ev Tipi">Ev Tipi (Bardak, Kaşık)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
