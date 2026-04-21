
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
import { createShopCheckoutSessionAction } from './actions';
import { useSearchParams, useRouter } from 'next/navigation';

const FALLBACK_PRODUCTS: any[] = [];

export default function ShopClient() {
  const { user, userProfile } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shopSettings, setShopSettings] = useState({ isOpen: true });
  const searchParams = useSearchParams();
  const router = useRouter();

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

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'shop_products'), where('isActive', '==', true));
  }, [firestore]);

  const { data: firestoreProducts, isLoading } = useCollection<any>(productsQuery);

  const products = useMemo(() => {
    return firestoreProducts || [];
  }, [firestoreProducts]);

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
    if (!firestore || !user) {
        toast({ title: "Log venligst ind", description: "Du skal være logget ind for at handle." });
        return;
    }
    
    setIsCheckingOut(true);
    try {
        const res = await createShopCheckoutSessionAction(
            cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
            user.uid,
            user.email || ''
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
    <div className="min-h-screen bg-[#FDFCF8] text-slate-900 selection:bg-rose-100 selection:text-rose-900">
      
      {/* Navigation */}
      <nav className="sticky top-0 z-[100] bg-[#FDFCF8]/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
             <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white rotate-3 group-hover:rotate-0 transition-transform">
                <ShoppingBag className="w-4 h-4" />
             </div>
             <span className="font-black tracking-tighter text-xl">Cohéro<span className="text-rose-600">Shop</span></span>
          </Link>

          <div className="flex items-center gap-6">
            <button 
                onClick={() => setIsCartOpen(true)}
                className={`relative flex items-center gap-3 px-6 py-3 rounded-2xl transition-all active:scale-95 shadow-sm border ${cart.length > 0 ? 'bg-slate-950 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'}`}
            >
              <div className="relative">
                <ShoppingBag className={`w-5 h-5 ${cart.length > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
                {cart.length > 0 && (
                  <motion.span 
                    key={totalItems}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 text-white text-[8px] font-black rounded-full flex items-center justify-center"
                  >
                      {totalItems}
                  </motion.span>
                )}
              </div>
              <span className="hidden md:inline text-xs font-black uppercase tracking-widest px-1">Se kurv</span>
              {cart.length > 0 && <span className="text-xs font-black ml-1 text-rose-100">{total} kr.</span>}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <section className="mb-32 text-center space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 border border-rose-100 rounded-full text-rose-600 text-[10px] font-black uppercase tracking-[0.2em]"
            >
                <Star className="w-3 h-3 fill-current" />
                Officielt Merchandise
            </motion.div>
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-black text-slate-950 serif-premium leading-[1.1] max-w-4xl mx-auto"
            >
                Vores merchandise er <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 italic">lige på trapperne</span>
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed"
            >
                Vi lægger sidste hånd på vores eksklusive kollektion. Glæd dig til premium kvalitet, 
                der hylder dit fag og din studietid. Shoppen åbner meget snart!
            </motion.p>
        </section>

        {/* Benefits Bar */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
            {[
                { icon: <Truck />, title: 'Hurtig Levering', desc: '1-3 hverdage til hele landet' },
                { icon: <ShieldCheck />, title: 'Premium Kvalitet', desc: 'Nøje udvalgte materialer' },
                { icon: <RefreshCcw />, title: 'Nem Retur', desc: '30 dages fuld returret' }
            ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-100">
                        {React.cloneElement(benefit.icon as React.ReactElement, { className: 'w-6 h-6' })}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">{benefit.title}</h3>
                        <p className="text-xs text-slate-500 font-medium">{benefit.desc}</p>
                    </div>
                </div>
            ))}
        </section>

        {/* Product Grid */}
        <section className="relative">
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
                {products.map((product, i) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="group"
                    >
                        <div className="relative aspect-[4/5] bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm transition-all duration-500">
                            {/* Image */}
                            <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-700"
                            />
                            
                            {/* Overlays */}
                            <div className="absolute top-6 left-6 flex flex-col gap-2">
                                <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-900 border border-slate-100 shadow-sm">
                                    {product.tag || product.category}
                                </span>
                            </div>

                            {/* Hover Actions */}
                            <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors flex items-center justify-center">
                                <button 
                                    onClick={() => addToCart(product)}
                                    className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all shadow-2xl active:scale-95"
                                >
                                    Læg i kurv
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 px-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
                                <p className="text-xl font-black text-rose-600">{product.price} kr.</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
                {(products.length === 0 && !isLoading) && (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center text-center gap-6 animate-in fade-in duration-1000">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                            <ShoppingBag className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-slate-900 serif">Ingen produkter endnu</h3>
                            <p className="text-slate-500 font-medium italic">Vi er ved at fylde hylderne op. Kig forbi igen snart!</p>
                        </div>
                    </div>
                )}
            </div>

        </section>

        {/* Footer Info */}
        <section className="mt-40 pt-20 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-20">
            <div className="space-y-6">
                <h2 className="text-3xl font-black text-slate-950 serif">Kvalitet der kan mærkes</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                    Alle vores produkter er testet og godkendt af studerende. Vi bruger kun de bedste materialer, 
                    og vi arbejder konstant på at udvide vores sortiment med ting, der giver værdi i din hverdag.
                </p>
                <div className="flex items-center gap-6">
                    <img src="https://cohero.dk/main_logo.png" alt="Cohéro" className="h-6 opacity-40 grayscale" />
                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Officiel Partner</span>
                </div>
            </div>
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-8 relative overflow-hidden flex flex-col justify-center">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <ShoppingBag className="w-40 h-40" />
                </div>
                <div className="relative z-10 space-y-4">
                    <h3 className="text-2xl font-black serif">En del af Cohéro-oplevelsen</h3>
                    <p className="text-slate-400 font-medium italic">Vores merchandise er skabt til at bringe fællesskabet og den faglige stolthed helt hjem i stuen.</p>
                </div>
            </div>
        </section>
      </main>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-10 right-10 z-[150] h-20 px-8 bg-slate-950 text-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 group active:scale-95 transition-transform"
          >
            <div className="relative">
                <ShoppingBag className="w-8 h-8 text-rose-400 group-hover:scale-110 transition-transform" />
                <motion.div 
                    key={totalItems}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center text-xs font-black border-4 border-slate-950 shadow-lg"
                >
                    {totalItems}
                </motion.div>
            </div>
            <div className="flex flex-col items-start pr-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Gå til betaling</span>
                <span className="text-xl font-black serif leading-none">{total} kr.</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 right-0 w-full max-w-md bg-white z-[201] shadow-2xl flex flex-col"
            >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="w-5 h-5 text-rose-600" />
                        <h2 className="text-xl font-black text-slate-950">Din Kurv</h2>
                    </div>
                    <button 
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {cart.length > 0 ? cart.map((item) => (
                        <div key={item.id} className="flex gap-6">
                            <div className="w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between">
                                    <h3 className="font-bold text-slate-900 leading-tight">{item.name}</h3>
                                    <button 
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 font-medium">Antal: {item.quantity}</p>
                                <p className="text-sm font-black text-rose-600 mt-2">{item.price * item.quantity} kr.</p>
                            </div>
                        </div>
                    )) : (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20 grayscale opacity-40">
                             <ShoppingBag className="w-16 h-16" />
                             <p className="font-bold text-slate-900 uppercase tracking-widest text-xs">Kurven er tom</p>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-500">Subtotal</span>
                        <span className="text-xl font-black text-slate-950">{total} kr.</span>
                    </div>
                    <Button 
                        disabled={cart.length === 0 || isCheckingOut}
                        onClick={handleCheckout}
                        className="w-full h-16 bg-slate-950 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-slate-950/20 active:scale-95 disabled:opacity-50"
                    >
                        {isCheckingOut ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Gå til kassen'}
                    </Button>
                    <p className="text-[10px] text-center text-slate-400 font-medium">Sikker betaling med Stripe & MobilePay</p>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
