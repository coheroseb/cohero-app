'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bug, Loader2, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/app/provider';
import { sendBugReport } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

const BugReportButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { user, userProfile } = useApp();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim() || isSending) return;

    setIsSending(true);

    try {
      const result = await sendBugReport(
        reportText,
        pathname,
        userProfile?.username || user?.displayName || 'Anonym',
        user?.email || 'Ingen email'
      );

      if (result.success) {
        toast({
          title: 'Rapport Sendt!',
          description: result.message,
        });
        setReportText('');
        setIsOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Fejl',
          description: result.message,
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Serverfejl',
        description: 'Der skete en uventet fejl.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-700 hover:scale-110 active:scale-100 transition-all"
        aria-label="Rapportér en fejl"
        title="Rapportér en fejl"
      >
        <Bug className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <Bug className="w-6 h-6 text-rose-500" />
              <h2 className="text-2xl font-bold text-amber-950 serif">Rapportér en fejl</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Har du fundet noget, der ikke virker som det skal? Beskriv fejlen
              herunder. Din feedback hjælper os med at gøre Cohéro bedre.
            </p>
            <form onSubmit={handleSendReport} className="space-y-4">
              <Textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Beskriv fejlen så detaljeret som muligt. Hvad skete der, og hvad forventede du, der skulle ske?"
                rows={5}
                required
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSending || !reportText.trim()}>
                  {isSending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isSending ? 'Sender...' : 'Send rapport'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BugReportButton;
