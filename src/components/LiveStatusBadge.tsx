
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface LiveStatusBadgeProps {
  xmlUrl?: string;
}

export const LiveStatusBadge: React.FC<LiveStatusBadgeProps> = ({ xmlUrl }) => {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!xmlUrl) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        // We keep the API endpoint here for now, or mock logic if the API is also moved
        const res = await fetch(`/api/laws/check-status?url=${encodeURIComponent(xmlUrl)}`);
        const data = await res.json();
        if (data.success && data.status) {
          setStatus(data.status);
        } else {
          setStatus('Valid'); // Fallback for demo
        }
      } catch (e) {
        setStatus('Valid');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [xmlUrl]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg animate-pulse">
        <Loader2 className="w-3 h-3 animate-spin text-slate-300" />
        <span className="text-[8px] font-black uppercase text-slate-300">Tjekker...</span>
      </div>
    );
  }

  const isStillValid = status === 'Valid' || !status;

  return (
    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border flex items-center gap-1.5 w-fit ${
      isStillValid 
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
        : 'bg-rose-50 text-rose-700 border-rose-100'
    }`}>
        {isStillValid ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
        {isStillValid ? 'Gældende' : (status || 'Ukendt')}
    </span>
  );
};
