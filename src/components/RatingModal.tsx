'use client';

import React, { useState, useEffect } from 'react';
import { Star, Loader2, CheckCircle, X } from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDefer: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, onDefer }) => {
  const { user, userProfile, refetchUserProfile } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (userProfile?.platformRating) {
            setRating(userProfile.platformRating);
            setComment(userProfile.platformRatingComment || '');
            setSubmitted(true);
        } else {
            // Reset state when modal opens for a new rating
            setRating(0);
            setComment('');
            setSubmitted(false);
        }
    }
  }, [userProfile, isOpen]);

  const handleStarClick = (newRating: number) => {
    setRating(newRating);
  };

  const handleSubmit = async () => {
    if (!user || !firestore || rating === 0) return;
    setIsSubmitting(true);
    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, {
        platformRating: rating,
        platformRatingComment: comment.trim() || null,
      });
      setSubmitted(true);
      await refetchUserProfile();
      toast({
        title: "Tak for din feedback!",
        description: "Din vurdering hjælper os med at forbedre Cohéro.",
      });
      setTimeout(onClose, 1500);
    } catch (error) {
      console.error("Error saving rating:", error);
      toast({
        variant: 'destructive',
        title: 'Fejl',
        description: 'Kunne ikke gemme din vurdering. Prøv venligst igen.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-amber-950/40 backdrop-blur-md" onClick={onDefer}></div>
      <div className="relative bg-[#FDFCF8] w-full max-w-md rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 text-center border-2 border-amber-200/50 animate-fade-in-up">
        <button onClick={onDefer} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-amber-950 transition-colors">
            <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-50 text-yellow-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-inner">
          <Star className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-amber-950 serif mb-3">Hvad synes du om Cohéro?</h2>
        <p className="text-sm sm:text-base text-slate-600 mb-8 italic leading-relaxed">
          Din feedback er guld værd. Giv os en hurtig vurdering, så vi kan gøre platformen endnu bedre.
        </p>

        {submitted ? (
          <div className="flex flex-col items-center justify-center gap-3 text-emerald-600 font-bold bg-emerald-50 p-6 rounded-2xl border border-emerald-100 animate-ink">
            <CheckCircle className="w-8 h-8"/>
            <p>Tak for din vurdering!</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center items-center gap-2 mb-8" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  disabled={isSubmitting}
                  aria-label={`Giv ${star} stjerner`}
                  className="disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <Star
                    className={`w-8 h-8 sm:w-10 sm:h-10 transition-all duration-150 ${
                      (hoverRating || rating) >= star
                        ? 'text-yellow-400 fill-yellow-400 scale-110'
                        : 'text-slate-300 hover:text-yellow-300 group-hover:scale-105'
                    }`}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <div className="space-y-4 text-left animate-fade-in-up">
                <label htmlFor="comment" className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 px-1">Tilføj en kommentar (valgfrit)</label>
                <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={`Hvad kan vi gøre bedre?`} rows={3} className="bg-white border-amber-100 rounded-xl text-sm" />
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold active:scale-95 transition-all">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                    Send Vurdering
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        
        {(!rating || !submitted) && (
            <button onClick={onDefer} className="mt-6 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-amber-800 transition-colors">
                Måske senere
            </button>
        )}
      </div>
    </div>
  );
};

export default RatingModal;
