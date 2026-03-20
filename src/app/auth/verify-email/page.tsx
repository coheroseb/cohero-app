'use client';

import React, { useState } from 'react';
import { MailCheck, Send, Loader2 } from 'lucide-react';
import { useApp } from '@/app/provider';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const { handleResendVerification, user } = useApp();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    setIsSending(true);
    setSent(false);
    await handleResendVerification();
    setIsSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 5000); // Reset button state after 5s
  };

  return (
    <div className="bg-[#FDFCF8] min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 md:p-12 rounded-[2.5rem] text-center border border-amber-100/60 shadow-xl">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
          <MailCheck className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-amber-950 serif mb-3">Bekræft din e-mail</h1>
        <p className="text-slate-600 mb-8">
          Vi har sendt et bekræftelseslink til <strong>{user?.email || 'din e-mailadresse'}</strong>. Tjek venligst din indbakke (og spam-mappe) for at færdiggøre oprettelsen.
        </p>

        <div className="space-y-4">
            <Button onClick={handleResend} disabled={isSending || sent} className="w-full">
                {isSending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Send className="w-4 h-4 mr-2" />
                )}
                {isSending ? 'Sender...' : (sent ? 'Link sendt!' : 'Gensend bekræftelseslink')}
            </Button>
            <p className="text-xs text-slate-400">
                Du kan lukke denne side. Din e-mail vil blive bekræftet, når du klikker på linket i mailen.
            </p>
        </div>
      </div>
    </div>
  );
}
