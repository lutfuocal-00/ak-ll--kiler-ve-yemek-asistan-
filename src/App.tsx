import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ChefHat, Search, CheckCircle2, Utensils, Coffee, Sun, Moon, CakeSlice, Loader2, X, Camera, Mic, MicOff, Volume2, VolumeX, Image as ImageIcon, Minus, Flame, Droplets, Wheat, Activity, Settings, Instagram, ChevronDown, Download } from 'lucide-react';
import Markdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { generateRecipe, detectIngredientsFromImage, RecipeData } from './lib/gemini';

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
  const [pantry, setPantry] = useState<string[]>(['Yumurta', 'Süt', 'Un', 'Domates', 'Biber', 'Peynir']);
  const [newItem, setNewItem] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [quickSearch, setQuickSearch] = useState('');
  
  const [recipeData, setRecipeData] = useState<RecipeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New states for Camera and Mic features
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // New states for Gamification & Portions
  const [xp, setXp] = useState(0);
  const [portion, setPortion] = useState(2);
  const levelInfo = getLevelInfo(xp);

  // Settings states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [dietaryPreference, setDietaryPreference] = useState('Standart');
  const [unitPreference, setUnitPreference] = useState('Metrik');

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
  }, [isDarkMode]);

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
  }, [recipeData]);

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
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const ingredients = await detectIngredientsFromImage(base64String, file.type);
        
        if (ingredients.length > 0) {
          setPantry(prev => {
            const newItems = ingredients.filter(i => !prev.some(p => p.toLowerCase() === i.toLowerCase()));
            return [...prev, ...newItems];
          });
        } else {
          setError("Görselde herhangi bir malzeme tespit edilemedi.");
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("Görsel işlenirken bir hata oluştu.");
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
    setRecipeData(null);
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
      setRecipeData(data);
      setPortion(data.basePortion || 2);
    } catch (err) {
      setError('Tarif oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCooked = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f97316', '#fef08a', '#22c55e']
    });
    setXp(prev => prev + 50);

    if (recipeData && recipeData.usedIngredients.length > 0) {
      const usedSet = new Set(recipeData.usedIngredients.map(i => i.toLowerCase()));
      setPantry(pantry.filter(item => !usedSet.has(item.toLowerCase())));
    }
    setRecipeData(null);
    setQuickSearch('');
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const categories = [
    { id: 'Kahvaltı', icon: Coffee },
    { id: 'Öğle', icon: Sun },
    { id: 'Akşam', icon: Moon },
    { id: 'Tatlı', icon: CakeSlice },
  ];

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-stone-900 text-stone-800 dark:text-stone-200 font-sans selection:bg-orange-200 dark:selection:bg-orange-900/50 pb-20 transition-colors duration-300">
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
      <header className="bg-white dark:bg-stone-800 border-b border-orange-100 dark:border-stone-700 shadow-sm sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl text-orange-600 dark:text-orange-500">
              <ChefHat size={24} />
            </div>
            <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-100 tracking-tight hidden sm:block">Akıllı Kiler <span className="text-orange-500">&</span> Yemek Asistanı</h1>
            <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-100 tracking-tight sm:hidden">Akıllı Kiler</h1>
          </div>

          {/* Gamification & Settings UI */}
          <div className="flex items-center gap-4">
            {showInstallButton && (
              <button 
                onClick={handleInstallClick}
                className="hidden sm:flex items-center gap-2 bg-stone-800 dark:bg-stone-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors shadow-sm"
              >
                <Download size={16} />
                <span>İndir</span>
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-orange-600 dark:text-orange-400">{levelInfo.name}</div>
                <div className="text-xs text-stone-500 dark:text-stone-400">{xp} / {levelInfo.next} XP</div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-50 dark:bg-stone-700 flex items-center justify-center border-2 border-orange-200 dark:border-orange-900/50 relative overflow-hidden shadow-inner">
                <div className="absolute bottom-0 left-0 w-full bg-orange-500/20 dark:bg-orange-500/30 transition-all duration-1000" style={{height: `${levelInfo.progress}%`}} />
                <ChefHat className="relative z-10 text-orange-600 dark:text-orange-500" size={20} />
              </div>
            </div>
            
            <div className="w-px h-8 bg-stone-200 dark:bg-stone-700 mx-1"></div>
            
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-stone-500 hover:text-orange-500 dark:text-stone-400 dark:hover:text-orange-400 transition-colors"
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
            <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 shadow-sm border border-orange-100/50 dark:border-stone-700 flex flex-col lg:h-[calc(100vh-8rem)] lg:sticky lg:top-24 transition-colors duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Utensils className="text-orange-400" size={20} />
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
                      <Camera size={18} className="text-orange-500" />
                      <span>Kamera ile Tara / Yükle</span>
                    </>
                  )}
                </button>
              </div>

              <form onSubmit={handleAddItem} className="mb-6 relative">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Malzeme ekle (örn: Süt)"
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-stone-200"
                />
                <button 
                  type="submit"
                  disabled={!newItem.trim()}
                  className="absolute right-2 top-2 bottom-2 aspect-square bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-500 rounded-xl flex items-center justify-center hover:bg-orange-200 dark:hover:bg-orange-900/50 disabled:opacity-50 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </form>

              <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 custom-scrollbar min-h-[200px]">
                {pantry.length === 0 ? (
                  <div className="text-center text-stone-400 dark:text-stone-500 py-10 flex flex-col items-center gap-3">
                    <div className="bg-stone-50 dark:bg-stone-700/50 p-4 rounded-full">
                      <ImageIcon size={24} className="text-stone-300 dark:text-stone-500" />
                    </div>
                    <p className="text-sm">Kileriniz şu an boş.<br/>Hemen malzeme eklemeye başlayın!</p>
                  </div>
                ) : (
                  pantry.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="group flex items-center justify-between bg-stone-50 dark:bg-stone-900 hover:bg-orange-50 dark:hover:bg-stone-700 border border-stone-100 dark:border-stone-700 hover:border-orange-200 dark:hover:border-stone-600 rounded-2xl p-3 transition-all"
                    >
                      <span className="font-medium text-stone-700 dark:text-stone-300">{item}</span>
                      <button 
                        onClick={() => handleRemoveItem(item)}
                        className="text-stone-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors opacity-100 lg:opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label={`${item} sil`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Actions & Results */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Categories */}
            <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 shadow-sm border border-orange-100/50 dark:border-stone-700 transition-colors duration-300">
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
                className="relative overflow-hidden group bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-3xl p-6 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all flex flex-col items-center justify-center gap-3 min-h-[140px]"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-600 dark:from-orange-500 to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
                {isLoading && !quickSearch ? (
                  <Loader2 size={32} className="animate-spin" />
                ) : (
                  <>
                    <ChefHat size={32} className="group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-lg text-center">Elimdekilerle Tarif Ver</span>
                  </>
                )}
              </button>

              <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 shadow-sm border border-orange-100/50 dark:border-stone-700 flex flex-col justify-center gap-3 min-h-[140px] transition-colors duration-300">
                <label className="text-sm font-medium text-stone-500 dark:text-stone-400">Hızlı Tarif (Sadece yaz ve al)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateRecipe(true)}
                    placeholder="Örn: Fırın Makarna"
                    className="flex-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all min-w-0 dark:text-stone-200"
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

            {/* Recipe Result */}
            {recipeData && (
              <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-orange-100/50 dark:border-stone-700 animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
                
                {/* Header & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{recipeData.title}</h1>
                  <button
                    onClick={() => toggleSpeaking(recipeData.instructions)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 ${
                      isSpeaking 
                        ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400' 
                        : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                    }`}
                  >
                    {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    <span>{isSpeaking ? 'Okumayı Durdur' : 'Sesli Oku'}</span>
                  </button>
                </div>

                {/* Portion Wizard */}
                <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-4 mb-8 border border-orange-100 dark:border-orange-900/30">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500 font-medium whitespace-nowrap">
                      <Utensils size={18} />
                      <span>Kaç Kişilik?</span>
                    </div>
                    <div className="flex items-center gap-4 flex-1 w-full">
                      <button onClick={() => setPortion(Math.max(1, portion - 1))} className="p-2 bg-white dark:bg-stone-700 rounded-full shadow-sm text-orange-600 hover:bg-orange-100 dark:hover:bg-stone-600 transition-colors"><Minus size={16} /></button>
                      <input 
                        type="range" 
                        min="1" 
                        max="12" 
                        value={portion} 
                        onChange={(e) => setPortion(Number(e.target.value))} 
                        className="flex-1 accent-orange-500"
                      />
                      <button onClick={() => setPortion(Math.min(12, portion + 1))} className="p-2 bg-white dark:bg-stone-700 rounded-full shadow-sm text-orange-600 hover:bg-orange-100 dark:hover:bg-stone-600 transition-colors"><Plus size={16} /></button>
                    </div>
                    <div className="font-bold text-2xl text-orange-600 dark:text-orange-500 w-8 text-center">{portion}</div>
                  </div>
                </div>

                {/* Ingredients & Macros Grid */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Ingredients */}
                  <div>
                    <h2 className="text-lg font-semibold mb-4 text-stone-800 dark:text-stone-200">Malzemeler</h2>
                    <ul className="space-y-3">
                      {recipeData.ingredients.map((ing, idx) => {
                        const ratio = portion / (recipeData.basePortion || 2);
                        const adjustedAmount = ing.amount ? (ing.amount * ratio).toFixed(1).replace('.0', '') : '';
                        return (
                          <li key={idx} className="flex items-start gap-3 text-stone-700 dark:text-stone-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 shrink-0" />
                            <div>
                              {adjustedAmount && <span className="font-semibold text-orange-600 dark:text-orange-400 mr-1">{adjustedAmount} {ing.unit}</span>}
                              <span>{ing.name}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Macros Panel */}
                  <div className="bg-stone-50 dark:bg-stone-900/50 rounded-2xl p-5 border border-stone-100 dark:border-stone-700">
                    <h2 className="text-lg font-semibold mb-4 text-stone-800 dark:text-stone-200 flex items-center gap-2">
                      <Activity size={18} className="text-stone-400" />
                      <span>Besin Değerleri</span>
                      <span className="text-xs font-normal text-stone-400 ml-auto">(1 Porsiyon)</span>
                    </h2>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <MacroBar label="Kalori" value={recipeData.macros.calories} unit="kcal" color="bg-orange-500" max={1000} icon={Flame} />
                      <MacroBar label="Protein" value={recipeData.macros.protein} unit="g" color="bg-red-500" max={100} icon={Droplets} />
                      <MacroBar label="Karb." value={recipeData.macros.carbs} unit="g" color="bg-yellow-500" max={100} icon={Wheat} />
                      <MacroBar label="Yağ" value={recipeData.macros.fat} unit="g" color="bg-amber-500" max={100} icon={Droplets} />
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="markdown-body border-t border-stone-100 dark:border-stone-700 pt-6">
                  <Markdown>{recipeData.instructions}</Markdown>
                </div>
                
                <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-stone-500 dark:text-stone-400">
                    {recipeData.usedIngredients.length > 0 ? (
                      <p>Kullanılan kiler malzemeleri: <span className="font-medium text-stone-700 dark:text-stone-300">{recipeData.usedIngredients.join(', ')}</span></p>
                    ) : (
                      <p>Kilerinizden malzeme kullanılmadı.</p>
                    )}
                  </div>
                  
                  <button
                    onClick={handleCooked}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all hover:scale-105"
                  >
                    <CheckCircle2 size={24} />
                    <span>Bunu Pişirdim (+50 XP)</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Floating Mic Button */}
      <button
        onClick={toggleListening}
        className={`fixed bottom-20 right-8 z-50 p-5 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse scale-110 shadow-[0_0_30px_rgba(239,68,68,0.6)]' 
            : 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-105'
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
          className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors hover:scale-110 transform duration-200"
          aria-label="Instagram"
        >
          <Instagram size={20} />
        </a>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-orange-100 dark:border-stone-700 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <Settings className="text-orange-500" />
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
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-stone-800 dark:text-stone-200">Görünüm Modu</div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">Karanlık veya aydınlık tema</div>
                </div>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${isDarkMode ? 'bg-orange-500' : 'bg-stone-300 dark:bg-stone-600'}`}
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
                    className="w-full appearance-none bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
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
                    className="w-full appearance-none bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
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
