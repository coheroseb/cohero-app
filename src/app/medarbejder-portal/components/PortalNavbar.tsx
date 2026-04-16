'use client';

import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';

export default function PortalNavbar() {
  return (
    <header className="h-20 border-b border-white/10 flex items-center justify-between px-10 bg-white/5 backdrop-blur-md sticky top-0 z-10">
      <div className="relative w-96 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
        <input 
          type="text" 
          placeholder="Søg i systemet..." 
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all placeholder:text-slate-600"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full border-2 border-slate-900" />
        </button>
        <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
