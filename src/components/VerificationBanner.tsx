'use client';

import React, { useState } from 'react';
import { MailCheck, Send, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from '@/app/provider';
import { useAuth } from '@/firebase';
import { sendVerificationEmail } from '@/lib/auth-helpers';

interface VerificationBannerProps {
  userEmail: string | null | undefined;
  institutionName: string;
  membershipLevel: string;
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({ userEmail, institutionName, membershipLevel }) => {
  const { user } = useApp();
  const auth = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    if (!user || !auth) return;
    setIsSending(true);
    setSent(false);
    try {
        await sendVerificationEmail(auth, user);
        setSent(true);
        setTimeout(() => setSent(false), 5000);
    } catch (error) {
        console.error("Failed to resend verification email:", error);
    } finally {
        setIsSending(false);
    }
  }

  return (
    <div className="bg-amber-50 border-2 border-dashed border-amber-200 text-amber-900 p-6 rounded-[2rem] mb-10 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
      <div className="flex items-start gap-4">
        <MailCheck className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-bold text-lg">Bekræft din e-mail for at aktivere dine fordele</h3>
          <p className="text-sm mt-1">
            Fordi du er tilknyttet <strong>{institutionName}</strong>, har du adgang til <strong>{membershipLevel}</strong>. Bekræft din e-mail for at låse op for alle dine fordele.
          </p>
        </div>
      </div>
      <Button onClick={handleResend} disabled={isSending || sent} variant="outline" className="w-full md:w-auto bg-white/50 flex-shrink-0">
        {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Send className="w-4 h-4 mr-2"/>}
        {isSending ? 'Sender...' : (sent ? 'Link sendt!' : 'Gensend link')}
      </Button>
    </div>
  );
};

export default VerificationBanner;
