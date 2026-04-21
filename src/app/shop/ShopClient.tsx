
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  Truck, 
  RefreshCcw, 
  ArrowLeft,
  Heart,
  Plus,
  Minus,
  X,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, where, onSnapshot, doc } from 'firebase/firestore';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { createShopCheckoutSessionAction, getShopProductsAction } from './actions';
import { useSearchParams, useRouter } from 'next/navigation';

const FALLBACK_PRODUCTS: any[] = [];

export default function ShopClient() {
  const { user, userProfile, openAuthPage } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shopSettings, setShopSettings] = useState({ isOpen: true });
  const searchParams = useSearchParams();
  const router = useRouter();
  const [guestEmail, setGuestEmail] = useState('');

  // Handle URL status
  useEffect(() => {
    const status = searchParams.get('status');
    const orderId = searchParams.get('order_id');
    
    if (status === 'success') {
        setCart([]); // Clear cart on success
        toast({ title: "Betaling gennemført!", description: `Din ordre #${orderId?.slice(-6)} er modtaget.`, variant: "default" });
        // Clean URL
        router.replace('/shop');
    } else if (status === 'cancelled') {
        toast({ title: "Betaling afbrudt", description: "Vi har gemt din kurv, hvis du skifter mening.", variant: "destructive" });
        router.replace('/shop');
    }
  }, [searchParams, router]);

  // Load Shop settings
  React.useEffect(() => {
    if (!firestore) return;
    const unsub = onSnapshot(doc(firestore, 'settings', 'shop'), (snap) => {
        if (snap.exists()) setShopSettings(snap.data() as any);
    });
    return () => unsub();
  }, [firestore]);

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Products
  useEffect(() => {
    const loadProducts = async () => {
        setIsLoading(true);
        const res = await getShopProductsAction();
        if (res.success && res.products) {
            setProducts(res.products);
        }
        setIsLoading(false);
    };
    loadProducts();
  }, []);

  const addToCart = (product: any) => {
    if (!shopSettings.isOpen) {
        toast({ title: "Shoppen er lukket", description: "Vi tager ikke imod nye ordrer lige nu.", variant: "destructive" });
        return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast({
      title: "Tilføjet til kurv",
      description: `${product.name} er lagt i din indkøbskurv.`,
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = async () => {
    if (!shopSettings.isOpen) {
        toast({ title: "Shoppen er lukket", description: "Du kan ikke gennemføre dit køb lige nu.", variant: "destructive" });
        return;
    }
    if (!firestore) return;

    if (!user && !guestEmail) {
        toast({ title: "Log ind eller indtast email", description: "Vi skal bruge din email for at sende ordren." });
        openAuthPage('signin');
        return;
    }
    
    // Simple email validation for guests
    if (!user && guestEmail && !guestEmail.includes('@')) {
        toast({ title: "Ugyldig email", description: "Indtast venligst en gyldig email-adresse.", variant: "destructive" });
        return;
    }

    setIsCheckingOut(true);
    try {
        const res = await createShopCheckoutSessionAction(
            cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
            user?.uid || null,
            user?.email || guestEmail
        );

        if (res.success && res.url) {
            window.location.href = res.url; // Redirect to Stripe
        } else {
            toast({ title: "Fejl ved oprettelse af betaling", description: res.error, variant: "destructive" });
        }
    } catch (error) {
        toast({ title: "Systemfejl", description: "Der skete en uventet fejl. Prøv igen senere.", variant: "destructive" });
    } finally {
        setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900 selection:bg-rose-100 selection:text-rose-900">
      
      {/* Premium Navigation */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
             <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-950/20 group-hover:scale-105 transition-all">
                <ShoppingBag className="w-5 h-5" />
             </div>
             <div className="flex flex-col">
                <span className="font-black tracking-tighter text-xl leading-none">Cohéro<span className="text-rose-600">Shop</span></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Official Gear</span>
             </div>
          </Link>

          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsCartOpen(true)}
                className={`group relative flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all active:scale-95 border ${cart.length > 0 ? 'bg-slate-950 text-white border-slate-900 shadow-xl shadow-slate-950/20' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="relative">
                <ShoppingBag className={`w-4 h-4 transition-colors ${cart.length > 0 ? 'text-rose-400' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {cart.length > 0 && (
                  <motion.span 
                    key={totalItems}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-slate-950"
                  >
                      {totalItems}
                  </motion.span>
                )}
              </div>
              <span className="hidden md:inline text-xs font-black uppercase tracking-widest">Kurv</span>
              {cart.length > 0 && (
                <div className="h-4 w-[1px] bg-white/20 mx-1 hidden md:block" />
              )}
              {cart.length > 0 && <span className="text-xs font-bold text-rose-100">{total} kr.</span>}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        {/* Refined Hero Section */}
        <section className="mb-32 space-y-12 max-w-4xl">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm"
            >
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Live Nu: Forårs-kollektion 2024</span>
            </motion.div>
            
            <div className="space-y-6 text-left">
                <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-6xl md:text-8xl font-black text-slate-950 serif-premium tracking-tight leading-[0.95]"
                >
                    Gear up til <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600 italic font-serif">semesteret</span>
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl text-slate-500 font-medium max-w-2xl leading-relaxed"
                >
                    Eksklusivt merchandise skabt til den ambitiøse studerende. 
                    Vi kombinerer høj komfort med et minimalistisk, professionelt udtryk.
                </motion.p>
            </div>
        </section>

        {/* Cleaner Product Grid */}
        <section className="relative">
            <div className="flex items-center justify-between mb-12">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Udvalgte Produkter</h2>
                <div className="h-[1px] flex-1 bg-slate-100 mx-8 hidden md:block" />
                <span className="text-xs font-bold text-slate-500 italic">{products.length} varer klar til afsendelse</span>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20 ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
                {products.length > 0 ? products.map((product, i) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="group relative"
                    >
                        {/* More premium card */}
                        <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] hover:border-slate-200">
                            {/* Image Container */}
                            <div className="relative aspect-[4/5] overflow-hidden">
                                <motion.img 
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                    src={product.image} 
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                                
                                {/* Status Tags */}
                                <div className="absolute top-6 left-6 flex flex-col gap-2">
                                    <span className="px-4 py-2 bg-white/90 backdrop-blur-xl rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-900 shadow-sm border border-white/50">
                                        {product.tag || 'Standard Edition'}
                                    </span>
                                </div>

                                {/* Cart Shortcut Overlay */}
                                <div className="absolute inset-x-0 bottom-0 p-6 opacity-0 group-hover:opacity-100 translate-y-10 group-hover:translate-y-0 transition-all duration-500 bg-gradient-to-t from-black/20 to-transparent">
                                    <button 
                                        onClick={() => addToCart(product)}
                                        className="w-full bg-slate-950 text-white h-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl active:scale-95 transition-transform"
                                    >
                                        Læg i kurv
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Product Details (Separate from card for cleaner look) */}
                        <div className="mt-8 px-2 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-bold text-slate-950 tracking-tight">{product.name}</h3>
                                    <p className="text-xs font-bold text-slate-400 h-4 uppercase tracking-widest">{product.category || 'Gear'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-slate-950 tabular-nums">{product.price} kr.</p>
                                    <p className="text-[10px] font-bold text-slate-400 italic">Inkl. moms</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )) : !isLoading && (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center text-center gap-6">
                        <div className="w-24 h-24 bg-white rounded-[2rem] border border-slate-100 flex items-center justify-center text-slate-200 shadow-inner">
                            <ShoppingBag className="w-10 h-10" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-slate-950 serif">Hylderne er tomme</h3>
                            <p className="text-slate-400 font-medium italic max-w-sm">Vi opdaterer vores sortiment netop nu. Vend tilbage om lidt for nye designs.</p>
                        </div>
                    </div>
                )}
            </div>
        </section>

        {/* Feature section */}
        <section className="mt-60 grid md:grid-cols-3 gap-16">
             {[
                { title: 'Materialer', icon: <Star />, desc: 'Vi benytter udelukkende premium bomuld og genanvendelige materialer i vores produktion.' },
                { title: 'Logistik', icon: <Truck />, desc: 'Hurtig og CO2-kompenseret forsendelse til hele Danmark via vores pakke-partnere.' },
                { title: 'Support', icon: <ShieldCheck />, desc: 'Vi sidder klar til at hjælpe dig med spørgsmål om størrelser, kvalitet eller levering.' }
             ].map((f, i) => (
                <div key={i} className="space-y-6 flex flex-col items-center text-center px-4">
                    <div className="w-16 h-16 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 shadow-sm">
                        {React.cloneElement(f.icon as React.ReactElement, { className: 'w-6 h-6' })}
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-lg font-bold text-slate-900">{f.title}</h4>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">{f.desc}</p>
                    </div>
                </div>
             ))}
        </section>
      </main>

      {/* Modern Cart Button (Floating) */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ 
                scale: 1, 
                opacity: 1, 
                y: 0,
                boxShadow: ["0 20px 50px rgba(0,0,0,0.3)", "0 20px 80px rgba(225,29,72,0.25)", "0 20px 50px rgba(0,0,0,0.3)"]
            }}
            transition={{
                animate: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-10 right-10 z-[150] h-20 px-8 bg-slate-950 text-white rounded-[2.5rem] flex items-center gap-6 group active:scale-95 transition-all duration-700 border border-slate-800 backdrop-blur-xl"
          >
            <div className="relative">
                <ShoppingBag className="w-7 h-7 text-rose-400 group-hover:scale-110 transition-transform" />
                <motion.div 
                    key={totalItems}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-3 -right-3 w-7 h-7 bg-rose-600 rounded-full flex items-center justify-center text-[10px] font-black border-4 border-slate-950 shadow-lg"
                >
                    {totalItems}
                </motion.div>
            </div>
            <div className="flex flex-col items-start pr-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1 group-hover:text-rose-400 transition-colors">Videre til betaling</span>
                <span className="text-2xl font-black serif leading-none tabular-nums">{total} <span className="text-xs font-bold uppercase ml-1">kr.</span></span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Minimalist Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 bottom-0 right-0 w-full max-w-xl bg-white z-[201] shadow-[0_0_100px_rgba(0,0,0,0.2)] flex flex-col"
            >
                {/* Header */}
                <div className="p-10 flex items-center justify-between bg-slate-50/50">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <ShoppingBag className="w-5 h-5 text-rose-600" />
                            <h2 className="text-2xl font-black text-slate-950 tracking-tight">Din Indkøbskurv</h2>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{totalItems} varer i kurven</p>
                    </div>
                    <button 
                        onClick={() => setIsCartOpen(false)}
                        className="p-4 hover:bg-white rounded-2xl transition-all shadow-sm border border-slate-100 active:scale-90"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10">
                    {cart.length > 0 ? (
                        <div className="space-y-12">
                            {cart.map((item) => (
                                <motion.div 
                                    layout
                                    key={item.id} 
                                    className="flex gap-8 group"
                                >
                                    <div className="relative w-32 h-32 bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 py-1 flex flex-col justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-start justify-between">
                                                <h3 className="text-xl font-bold text-slate-950 leading-tight tracking-tight">{item.name}</h3>
                                                <button 
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.category}</p>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                <button onClick={() => {/* Decrement would go here */}} className="text-slate-400 hover:text-slate-950 transition-colors"><Minus className="w-3 h-3" /></button>
                                                <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => addToCart(item)} className="text-slate-400 hover:text-slate-950 transition-colors"><Plus className="w-3 h-3" /></button>
                                            </div>
                                            <p className="text-xl font-black text-slate-950">{item.price * item.quantity} kr.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-6 opacity-30 py-20 grayscale">
                             <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center border-4 border-dashed border-slate-200">
                                <ShoppingBag className="w-12 h-12" />
                             </div>
                             <p className="font-bold text-slate-900 uppercase tracking-[0.3em] text-xs">Kurven er tom</p>
                        </div>
                    )}
                </div>

                {/* Checkout Section */}
                <div className="p-10 bg-slate-950 text-white space-y-8 rounded-t-[3rem]">
                    {!user && (
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Hurtig Checkout: Fortsæt som gæst</label>
                            <input 
                                type="email" 
                                placeholder="E-mail adresse for ordrebekræftelse..."
                                className="w-full px-8 py-5 bg-slate-900 border border-slate-800 rounded-2xl font-bold text-white focus:border-rose-500/50 outline-none transition-all placeholder:text-slate-600 shadow-2xl"
                                value={guestEmail}
                                onChange={(e) => setGuestEmail(e.target.value)}
                            />
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-widest px-2">
                            <span>Subtotal</span>
                            <span className="text-white">{total} kr.</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-widest px-2 border-t border-slate-900 pt-4">
                            <span>Forsendelse</span>
                            <span className="text-emerald-400">Gratis over 499 kr.</span>
                        </div>
                        <div className="h-[1px] bg-slate-900 w-full" />
                        <div className="flex items-center justify-between px-2">
                            <span className="text-lg font-black serif italic text-slate-400">Total</span>
                            <span className="text-4xl font-black tabular-nums">{total} <span className="text-sm font-bold uppercase ml-1">kr.</span></span>
                        </div>
                    </div>

                    <Button 
                        disabled={cart.length === 0 || isCheckingOut || (!user && !guestEmail)}
                        onClick={handleCheckout}
                        className="w-full h-20 bg-white hover:bg-slate-50 text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-4 group"
                    >
                        {isCheckingOut ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>
                                Betal Nu 
                                <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </Button>
                    
                    <div className="flex items-center justify-center gap-6 opacity-30">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4 invert grayscale" alt="PayPal" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-2 invert grayscale" alt="Visa" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4 invert grayscale" alt="Mastercard" />
                    </div>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
