
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
import PageHeader from '@/components/PageHeader';
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
    const isOutOfStock = product.stock !== undefined && product.stock <= 0;
    if (isOutOfStock) {
        toast({ title: "Varen er udsolgt", description: "Beklager, denne vare er desværre ikke på lager.", variant: "destructive" });
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

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
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
    <div className="min-h-screen bg-slate-50/60 text-slate-900 selection:bg-rose-100 selection:text-rose-900">
      
      {/* Page Header Integration */}
      <div className="shrink-0 bg-white border-b border-slate-200/60 px-8 py-4 z-40 sticky top-0">
        <PageHeader
          title="Cohéro Shop"
          subtitle="Eksklusivt merchandise skabt til den ambitiøse studerende."
          icon={<ShoppingBag className="w-5 h-5" />}
          iconColor="bg-rose-50 text-rose-600"
          className="mb-0"
          backHref="/portal"
          actions={
            <button 
                onClick={() => setIsCartOpen(true)}
                className={`group relative flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all active:scale-95 border shadow-sm ${cart.length > 0 ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="relative">
                <ShoppingBag className={`w-4 h-4 transition-colors ${cart.length > 0 ? 'text-rose-400' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {cart.length > 0 && (
                  <motion.span 
                    key={totalItems}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-slate-900"
                  >
                      {totalItems}
                  </motion.span>
                )}
              </div>
              <span className="hidden sm:inline text-[11px] font-black uppercase tracking-wider">Kurv</span>
              {cart.length > 0 && (
                <div className="h-3 w-[1px] bg-white/20 mx-1 hidden sm:block" />
              )}
              {cart.length > 0 && <span className="text-[11px] font-bold text-rose-100">{total} kr.</span>}
            </button>
          }
        />
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10 md:py-16">
        {/* Refined Hero Section */}
        <section className="mb-16 space-y-8 max-w-4xl">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-white border border-slate-200/60 rounded-xl shadow-sm"
            >
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Live Nu: Forårs-kollektion 2026</span>
            </motion.div>
            
            <div className="space-y-4 text-left">
                <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none"
                >
                    Gear up til <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-600 italic font-serif">semesteret</span>
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-base text-slate-500 font-medium max-w-xl leading-relaxed"
                >
                    Eksklusivt merchandise skabt til den ambitiøse studerende. 
                    Vi kombinerer høj komfort med et minimalistisk, professionelt udtryk.
                </motion.p>
            </div>
        </section>

        {/* Cleaner Product Grid */}
        <section className="relative">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Udvalgte Produkter</h2>
                <div className="h-[1px] flex-1 bg-slate-200/60 mx-6 hidden md:block" />
                <span className="text-[10px] font-bold text-slate-500 italic">{products.length} varer klar til afsendelse</span>
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
                        {(() => {
                            const isOutOfStock = product.stock !== undefined && product.stock <= 0;
                            return (
                                <>
                                    {/* More premium card */}
                                    <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200/60 transition-all duration-500 hover:shadow-md hover:border-slate-300">
                                        {/* Image Container */}
                                        <div className="relative aspect-[4/5] overflow-hidden">
                                            {isOutOfStock && (
                                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                                                    <div className="px-4 py-2 bg-slate-900 text-white rounded-lg font-black uppercase text-[9px] tracking-wider shadow-md">
                                                        Udsolgt
                                                    </div>
                                                </div>
                                            )}
                                            <motion.img 
                                                whileHover={!isOutOfStock ? { scale: 1.03 } : {}}
                                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                src={product.image} 
                                                alt={product.name}
                                                className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
                                            />
                                            
                                            {/* Status Tags */}
                                            {product.tag && (
                                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                    <span className="px-3 py-1.5 bg-white/95 rounded-lg text-[9px] font-bold uppercase tracking-wider text-slate-800 shadow-sm border border-slate-200/40">
                                                        {product.tag}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Cart Shortcut Overlay */}
                                            {!isOutOfStock && (
                                                <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-gradient-to-t from-black/10 to-transparent">
                                                    <button 
                                                        onClick={() => addToCart(product)}
                                                        className="w-full bg-slate-900 hover:bg-slate-950 text-white h-11 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-md active:scale-95 transition-all"
                                                    >
                                                        Læg i kurv
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Product Details (Separate from card for cleaner look) */}
                                    <div className="mt-4 px-1 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-0.5">
                                                <h3 className={`text-lg font-bold tracking-tight ${isOutOfStock ? 'text-slate-400' : 'text-slate-800'}`}>{product.name}</h3>
                                                <p className="text-[9px] font-bold text-slate-400 h-3.5 uppercase tracking-wider">{product.category || 'Gear'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-black tabular-nums ${isOutOfStock ? 'text-slate-400' : 'text-slate-800'}`}>{product.price} kr.</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Inkl. moms</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </motion.div>
                )) : !isLoading && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-center text-slate-300 shadow-inner">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-800">Hylderne er tomme</h3>
                            <p className="text-slate-400 text-sm font-medium italic max-w-xs">Vi opdaterer vores sortiment netop nu. Vend tilbage om lidt for nye designs.</p>
                        </div>
                    </div>
                )}
            </div>
        </section>

        {/* Feature section */}
        <section className="mt-28 grid md:grid-cols-3 gap-8 border-t border-slate-200/60 pt-16">
             {[
                { title: 'Materialer', icon: <Star />, desc: 'Vi benytter udelukkende premium bomuld og genanvendelige materialer i vores produktion.' },
                { title: 'Logistik', icon: <Truck />, desc: 'Altid gratis og CO2-kompenseret forsendelse til hele Danmark via vores pakke-partnere.' },
                { title: 'Support', icon: <ShieldCheck />, desc: 'Vi sidder klar til at hjælpe dig med spørgsmål om størrelser, kvalitet eller levering.' }
             ].map((f, i) => (
                <div key={i} className="space-y-4 flex flex-col items-center text-center px-4">
                    <div className="w-12 h-12 bg-white border border-slate-200/60 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                        {React.cloneElement(f.icon as React.ReactElement, { className: 'w-5 h-5' })}
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-base font-bold text-slate-800">{f.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">{f.desc}</p>
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
                boxShadow: ["0 10px 30px rgba(0,0,0,0.1)", "0 10px 40px rgba(225,29,72,0.15)", "0 10px 30px rgba(0,0,0,0.1)"]
            }}
            transition={{
                animate: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-8 right-8 z-[150] h-16 px-6 bg-slate-900 text-white rounded-xl flex items-center gap-4 group active:scale-95 transition-all duration-300 border border-slate-800 backdrop-blur-xl"
          >
            <div className="relative">
                <ShoppingBag className="w-6 h-6 text-rose-400 group-hover:scale-105 transition-transform" />
                <motion.div 
                    key={totalItems}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-rose-600 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-slate-900 shadow-md"
                >
                    {totalItems}
                </motion.div>
            </div>
            <div className="flex flex-col items-start pr-1">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 leading-none mb-1 group-hover:text-rose-400 transition-colors">Videre til betaling</span>
                <span className="text-lg font-black leading-none tabular-nums">{total} <span className="text-[10px] font-bold uppercase ml-0.5">kr.</span></span>
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
              className="fixed top-0 bottom-0 right-0 w-full max-w-md bg-white z-[201] shadow-2xl flex flex-col border-l border-slate-200/60"
            >
                {/* Header */}
                <div className="p-6 flex items-center justify-between bg-slate-50/50 border-b border-slate-200/60">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-rose-600" />
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Din Indkøbskurv</h2>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{totalItems} varer i kurven</p>
                    </div>
                    <button 
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 hover:bg-white rounded-lg transition-all shadow-sm border border-slate-200/40 active:scale-90"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cart.length > 0 ? (
                        <div className="space-y-6">
                            {cart.map((item) => (
                                <motion.div 
                                    layout
                                    key={item.id} 
                                    className="flex gap-4 group"
                                >
                                    <div className="relative w-20 h-20 bg-slate-50 rounded-lg overflow-hidden border border-slate-200/60 shrink-0 shadow-inner group-hover:scale-102 transition-transform duration-350">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 py-0.5 flex flex-col justify-between">
                                        <div className="space-y-0.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-sm font-bold text-slate-800 leading-tight tracking-tight">{item.name}</h3>
                                                <button 
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="p-0.5 text-slate-300 hover:text-rose-500 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{item.category}</p>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/40">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400 hover:text-slate-950 transition-colors">
                                                    <Minus className="w-2.5 h-2.5" />
                                                </button>
                                                <span className="text-[11px] font-black w-3 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400 hover:text-slate-950 transition-colors">
                                                    <Plus className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                            <p className="text-base font-black text-slate-800">{item.price * item.quantity} kr.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-30 py-20 grayscale">
                             <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center border border-dashed border-slate-300">
                                <ShoppingBag className="w-8 h-8" />
                             </div>
                             <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Kurven er tom</p>
                        </div>
                    )}
                </div>

                {/* Checkout Section */}
                <div className="p-6 bg-slate-900 text-white space-y-6 rounded-t-xl">
                    {!user && (
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 italic">Hurtig Checkout: Fortsæt som gæst</label>
                            <input 
                                type="email" 
                                placeholder="E-mail adresse for ordrebekræftelse..."
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg font-bold text-xs text-white focus:border-rose-500/50 outline-none transition-all placeholder:text-slate-500 shadow-md"
                                value={guestEmail}
                                onChange={(e) => setGuestEmail(e.target.value)}
                            />
                        </div>
                    )}
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider px-1">
                            <span>Subtotal</span>
                            <span className="text-white">{total} kr.</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider px-1 border-t border-slate-800 pt-3">
                            <span>Forsendelse</span>
                            <span className="text-emerald-400">Altid gratis</span>
                        </div>
                        <div className="h-[1px] bg-slate-800 w-full" />
                        <div className="flex items-center justify-between px-1">
                            <span className="text-base font-bold text-slate-400">Total</span>
                            <span className="text-2xl font-black tabular-nums">{total} <span className="text-xs font-bold uppercase ml-0.5">kr.</span></span>
                        </div>
                    </div>

                    <Button 
                        disabled={cart.length === 0 || isCheckingOut || (!user && !guestEmail)}
                        onClick={handleCheckout}
                        className="w-full h-12 bg-white hover:bg-slate-50 text-slate-900 rounded-lg font-black uppercase tracking-wider active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-2 text-xs"
                    >
                        {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <>
                                Betal Nu 
                                <ArrowLeft className="w-3.5 h-3.5 rotate-180 group-hover:translate-x-0.5 transition-transform" />
                            </>
                        )}
                    </Button>
                    
                    <div className="flex items-center justify-center gap-4 opacity-30 pt-1">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-3 invert grayscale" alt="PayPal" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-1.5 invert grayscale" alt="Visa" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-3.5 invert grayscale" alt="Mastercard" />
                    </div>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
