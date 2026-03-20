'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  username: string;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, onConfirm, username }) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const CONFIRMATION_WORD = 'SLET';

  const handleConfirm = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await onConfirm();
      // On success, the parent component will handle closing and redirection.
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
          setError('Denne handling kræver, at du for nylig har logget ind. Log venligst ud og ind igen, og prøv så igen.');
      } else {
          setError('Der skete en uventet fejl. Kunne ikke slette konto.');
      }
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-rose-900/40 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-[#FDFCF8] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-12 text-center border-4 border-rose-500/20">
         <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
            <ShieldAlert className="w-10 h-10" />
          </div>

        <h2 className="text-3xl font-bold text-amber-950 serif mb-4">Er du helt sikker?</h2>
        <p className="text-slate-600 mb-6">
          Dette er en permanent handling. Hele din profil, inklusiv noter, cases og point, vil blive slettet for altid. <strong className="text-rose-700">Dette kan ikke fortrydes.</strong>
        </p>

        <div className="space-y-4 text-left">
           <label htmlFor="confirmation" className="text-sm font-bold text-amber-950">
            For at bekræfte, skriv venligst <span className="font-mono text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">{CONFIRMATION_WORD}</span> i feltet nedenfor.
           </label>
           <Input 
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="text-center font-mono tracking-widest"
           />
           {error && <p className="text-xs text-red-500 text-center pt-2">{error}</p>}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Annuller
            </Button>
            <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={confirmationText !== CONFIRMATION_WORD || isDeleting}
                className="w-full sm:w-auto"
            >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                {isDeleting ? 'Sletter...' : 'Ja, slet min konto'}
            </Button>
        </div>

      </div>
    </div>
  );
};

export default DeleteAccountModal;
