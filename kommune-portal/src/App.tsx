import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Building, Search } from 'lucide-react';
import './index.css';

const MUNICIPALITIES = [
  { id: 'kbh', name: 'Københavns Kommune', region: 'Region Hovedstaden' },
  { id: 'aarhus', name: 'Aarhus Kommune', region: 'Region Midtjylland' },
  { id: 'odense', name: 'Odense Kommune', region: 'Region Syddanmark' },
  { id: 'aalborg', name: 'Aalborg Kommune', region: 'Region Nordjylland' },
  { id: 'frederiksberg', name: 'Frederiksberg Kommune', region: 'Region Hovedstaden' },
  { id: 'gentofte', name: 'Gentofte Kommune', region: 'Region Hovedstaden' },
];

function LandingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = MUNICIPALITIES.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-3xl w-full text-center space-y-8">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-indigo-600/20">
          <Building className="w-10 h-10 text-white" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
            Kommune<span className="text-indigo-600">Portal</span>
          </h1>
          <p className="text-lg md:text-xl font-medium text-slate-500 max-w-xl mx-auto">
            Vælg din kommune for at få adgang til specifikke informationer, retningslinjer og værktøjer.
          </p>
        </div>

        <div className="max-w-xl mx-auto relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Søg efter kommune..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-16 pl-12 pr-6 bg-white border-2 border-slate-200 rounded-2xl text-lg font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 transition-all shadow-sm"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-left max-w-4xl mx-auto mt-12">
          {filtered.map(m => (
            <button
              key={m.id}
              onClick={() => navigate(`/${m.id}`)}
              className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-600/10 transition-all text-left flex items-center justify-between"
            >
              <div>
                <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{m.name}</h3>
                <div className="flex items-center gap-2 mt-2 text-sm font-semibold text-slate-500">
                  <MapPin className="w-4 h-4" />
                  {m.region}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:scale-110 transition-all">
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <p className="text-slate-500 font-bold">Ingen kommuner fundet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KommuneDashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <button 
        onClick={() => navigate('/')}
        className="mb-8 font-bold text-indigo-600 hover:text-indigo-800"
      >
        &larr; Tilbage til oversigt
      </button>
      <h1 className="text-4xl font-black text-slate-900">Dashboard for Kommune</h1>
      <p className="text-slate-500 font-medium mt-4">Her kan man bygge specifik funktionalitet.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/:kommuneId/*" element={<KommuneDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
