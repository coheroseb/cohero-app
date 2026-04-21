
'use client';

import React, { useState, useMemo } from 'react';
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase 
} from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  doc, 
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  X,
  CreditCard,
  User,
  ArrowRight,
  ChevronDown,
  LayoutGrid,
  List,
  Eye,
  Loader2,
  AlertCircle,
  Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

type Tab = 'products' | 'orders';

const AdminShopPage = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [shopSettings, setShopSettings] = useState({ isOpen: true });

  // Load Shop settings
  React.useEffect(() => {
    if (!firestore) return;
    const unsub = onSnapshot(doc(firestore, 'settings', 'shop'), (snap) => {
        if (snap.exists()) setShopSettings(snap.data() as any);
    });
    return () => unsub();
  }, [firestore]);

  const toggleShopOpen = async () => {
    if (!firestore) return;
    try {
        await setDoc(doc(firestore, 'settings', 'shop'), { isOpen: !shopSettings.isOpen }, { merge: true });
        toast({ title: `Shoppen er nu ${!shopSettings.isOpen ? 'åben' : 'lukket'}` });
    } catch (err) {
        toast({ title: "Fejl ved opdatering af shop-status", variant: "destructive" });
    }
  };

  // Queries
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'shop_products'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'shop_orders'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: products, isLoading: productsLoading } = useCollection<any>(productsQuery);
  const { data: orders, isLoading: ordersLoading } = useCollection<any>(ordersQuery);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Lifestyle',
    tag: '',
    stock: 100,
    image: '',
    isActive: true
  });

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    try {
      if (editingProduct) {
        await updateDoc(doc(firestore, 'shop_products', editingProduct.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast({ title: "Produkt opdateret", description: "Dine ændringer er gemt." });
      } else {
        await addDoc(collection(firestore, 'shop_products'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast({ title: "Produkt oprettet", description: "Produktet er nu live i shoppen." });
      }
      setIsAddingProduct(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: 0, category: 'Lifestyle', tag: '', stock: 100, image: '', isActive: true });
    } catch (error) {
      toast({ title: "Fejl", description: "Der skete en fejl under gemning.", variant: "destructive" });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!firestore || !window.confirm("Er du sikker?")) return;
    try {
      await deleteDoc(doc(firestore, 'shop_products', id));
      toast({ title: "Produkt slettet" });
    } catch (error) {
      toast({ title: "Fejl", variant: "destructive" });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'shop_orders', orderId), { status: newStatus });
      toast({ title: "Status opdateret" });
    } catch (error) {
      toast({ title: "Fejl", variant: "destructive" });
    }
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 mb-3">
             <ShoppingBag className="w-3.5 h-3.5" /> Commerce Engine
          </div>
          <h1 className="text-4xl font-black text-slate-900 serif tracking-tight">Shop Administration</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-500 font-medium">Styr produkter, lagerbeholdning og ordreflow.</p>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <button 
                onClick={toggleShopOpen}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${shopSettings.isOpen ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}
            >
                <Power className="w-3 h-3" />
                Status: {shopSettings.isOpen ? 'Åben' : 'Lukket'}
            </button>
          </div>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Produkter
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Ordrer
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[600px] flex flex-col">
        
        {/* Toolbar */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative group w-full md:max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder={activeTab === 'products' ? "Søg i produkter..." : "Søg i ordrer (Navn, ID, Mail)..."}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-950 transition-all text-sm font-bold outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {activeTab === 'products' && (
            <button 
              onClick={() => { setIsAddingProduct(true); setEditingProduct(null); setFormData({ name: '', description: '', price: 0, category: 'Lifestyle', tag: '', stock: 100, image: '', isActive: true }); }}
              className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
            >
              <Plus className="w-4 h-4" /> Tilføj Produkt
            </button>
          )}
        </div>

        <div className="flex-1 p-8">
          {activeTab === 'products' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {productsLoading ? (
                 Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-[4/3] bg-slate-50 animate-pulse rounded-3xl border border-slate-100" />
                 ))
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full py-32 flex flex-col items-center justify-center text-center gap-6">
                   <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 shadow-inner">
                      <Package className="w-10 h-10" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-xl font-black text-slate-900 serif">Ingen produkter fundet</p>
                      <p className="text-sm text-slate-400 font-medium tracking-tight whitespace-pre-wrap">Prøv at tilføje dit første merchandise-produkt eller <br />juster dine søgekriterier.</p>
                   </div>
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <motion.div 
                    key={p.id} 
                    layout
                    className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-video bg-slate-50 overflow-hidden">
                       {p.image ? (
                         <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-200"><Package className="w-12 h-12" /></div>
                       )}
                       <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-900 shadow-sm border border-slate-100">{p.category}</span>
                       </div>
                       <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingProduct(p); setFormData({ ...p }); setIsAddingProduct(true); }}
                            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 hover:text-indigo-600 shadow-xl"
                          >
                             <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p.id)}
                            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 hover:text-rose-600 shadow-xl"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col justify-between">
                       <div>
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <h3 className="text-xl font-black text-slate-900 serif leading-tight">{p.name}</h3>
                            <span className="text-xl font-black text-indigo-600 leading-tight">{p.price} kr.</span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium line-clamp-2 mb-6">{p.description}</p>
                       </div>
                       <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{p.isActive ? 'Aktiv' : 'Inaktiv'}</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-500">Lager: {p.stock} stk.</div>
                       </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            /* Orders Tab */
            <div className="space-y-6">
               {ordersLoading ? (
                  <div className="flex items-center justify-center p-32"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>
               ) : !orders || orders.length === 0 ? (
                  <div className="py-32 flex flex-col items-center justify-center text-center gap-6 grayscale opacity-40">
                     <Truck className="w-16 h-16 text-slate-200" />
                     <p className="font-bold text-slate-950 uppercase tracking-widest text-xs">Ingen ordrer endnu</p>
                  </div>
               ) : (
                 <div className="overflow-x-auto shadow-sm rounded-3xl border border-slate-100">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 py-4">
                          <tr>
                             <th className="px-8 py-5">Ordre ID & Dato</th>
                             <th className="px-8 py-5">Kunde</th>
                             <th className="px-8 py-5">Indhold</th>
                             <th className="px-8 py-5">Total</th>
                             <th className="px-8 py-5">Status</th>
                             <th className="px-8 py-5 text-right">Handling</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {orders.map((o) => (
                             <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-6">
                                   <p className="font-black text-slate-900 text-sm">#{o.id.slice(-6).toUpperCase()}</p>
                                   <p className="text-[10px] font-bold text-slate-400 mt-1">{o.createdAt?.toDate().toLocaleDateString('da-DK')}</p>
                                </td>
                                <td className="px-8 py-6">
                                   <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xs">{o.userName?.charAt(0)}</div>
                                      <div>
                                         <p className="text-sm font-bold text-slate-900 leading-tight">{o.userName}</p>
                                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{o.userEmail}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-8 py-6">
                                   <div className="flex -space-x-3">
                                      {o.items?.map((item: any, i: number) => (
                                         <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[8px] font-black text-slate-400 shadow-sm overflow-hidden" title={item.name}>
                                            {item.name.charAt(0)}
                                         </div>
                                      ))}
                                      {o.items?.length > 3 && <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-950 text-white flex items-center justify-center text-[8px] font-black">+{o.items.length - 3}</div>}
                                   </div>
                                </td>
                                <td className="px-8 py-6">
                                   <p className="text-sm font-black text-slate-900">{o.total} kr.</p>
                                   <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${o.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                      {o.paymentStatus === 'paid' ? 'Betalt' : 'Mangler'}
                                   </span>
                                </td>
                                <td className="px-8 py-6">
                                   <select 
                                      className="bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1.5 outline-none focus:border-indigo-600 transition-colors"
                                      value={o.status}
                                      onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                   >
                                      <option value="pending">Afventer</option>
                                      <option value="processing">Behandler</option>
                                      <option value="shipped">Afsendt</option>
                                      <option value="delivered">Leveret</option>
                                      <option value="cancelled">Annulleret</option>
                                   </select>
                                </td>
                                <td className="px-8 py-6 text-right">
                                   <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><Eye className="w-4 h-4" /></button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {isAddingProduct && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div>
                   <h2 className="text-2xl font-black text-slate-900 serif leading-tight">{editingProduct ? 'Rediger Produkt' : 'Nyt Produkt'}</h2>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Konfigurer dine merchandise indstillinger</p>
                </div>
                <button onClick={() => setIsAddingProduct(false)} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl hover:bg-slate-100 transition-colors text-slate-400"><X className="w-6 h-6"/></button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Produktnavn</label>
                   <input 
                      required 
                      type="text" 
                      placeholder="F.eks. Cohéro Premium Hoodie" 
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:bg-white focus:border-slate-300 transition-all outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                   />
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Pris (DKK)</label>
                      <input 
                         required 
                         type="number" 
                         className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:bg-white outline-none"
                         value={formData.price}
                         onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Kategori</label>
                      <select 
                         className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:bg-white outline-none appearance-none"
                         value={formData.category}
                         onChange={(e) => setFormData({...formData, category: e.target.value})}
                      >
                         <option value="Lifestyle">Lifestyle</option>
                         <option value="Beklædning">Beklædning</option>
                         <option value="Accessories">Accessories</option>
                         <option value="Study Tool">Study Tool</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Beskrivelse</label>
                   <textarea 
                      rows={4}
                      placeholder="Beskriv produktet..." 
                      className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-slate-600 focus:bg-white transition-all outline-none resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                   />
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Billed-URL</label>
                   <input 
                      type="text" 
                      placeholder="F.eks. /shop/cup.png eller ekstern URL" 
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:bg-white outline-none"
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                   />
                </div>

                <div className="grid grid-cols-2 gap-6 items-end">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Lagerbeholdning</label>
                      <input 
                         type="number" 
                         className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:bg-white outline-none"
                         value={formData.stock}
                         onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                      />
                   </div>
                   <div className="p-1 px-8 py-8 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Produkt Aktiv</span>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                        className={`w-12 h-6 rounded-full transition-all relative ${formData.isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isActive ? 'right-1' : 'left-1'}`} />
                      </button>
                   </div>
                </div>

                <div className="pt-6 flex items-center justify-end gap-6">
                   <button type="button" onClick={() => setIsAddingProduct(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Arbryd</button>
                   <Button type="submit" className="px-12 h-20 bg-slate-950 text-white rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95">
                      {editingProduct ? 'Opdater Produkt' : 'Opret Produkt & Publicér'}
                   </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default AdminShopPage;
