import React from 'react';
import { Loader2 } from 'lucide-react';

const AuthLoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#FDFCF8]">
      <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-500 font-semibold">Indlæser...</p>
    </div>
  );
};

export default AuthLoadingScreen;
