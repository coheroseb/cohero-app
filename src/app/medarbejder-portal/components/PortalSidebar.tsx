'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  BookOpen, 
  LifeBuoy, 
  UserCircle, 
  LogOut,
  Bell,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';

const menuItems = [
  { icon: Home, label: 'Hjem', href: '/medarbejder-portal' },
  { icon: Users, label: 'Kollegaer', href: '/medarbejder-portal/directory' },
  { icon: BookOpen, label: 'Vidensbase', href: '/medarbejder-portal/knowledge' },
  { icon: LifeBuoy, label: 'IT Support', href: '/medarbejder-portal/support' },
  { icon: UserCircle, label: 'Min Profil', href: '/medarbejder-portal/profile' },
];

export default function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col h-screen sticky top-0">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-white font-black text-xl italic">iT</span>
          </div>
          <span className="text-xl font-black tracking-tight text-white uppercase">IT Central</span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-inner border border-white/10' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-purple-400' : ''}`} />
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="ml-auto w-1.5 h-1.5 bg-purple-500 rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-white/10">
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 overflow-hidden">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-white text-sm truncate">Alex Jensen</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">IT Afdeling</p>
          </div>
          <LogOut className="ml-auto w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
        </div>
      </div>
    </aside>
  );
}
