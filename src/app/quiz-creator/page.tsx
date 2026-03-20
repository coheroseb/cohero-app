

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BrainCircuit, Check, HelpCircle, Loader2, Sparkles, X } from 'lucide-react';
import { useApp } from '@/app/provider';
import { generateQuizAction } from '@/app/actions';
import type { QuizData } from '@/ai/flows/quiz-generator-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { doc, getDoc, writeBatch, serverTimestamp, increment, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

function QuizCreatorPageContent() {
  const [gameState, setGameState] = useState<'setup' | 'generating' | 'playing' | 'results'>('setup');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const { user, userProfile, refetchUserProfile } = useApp();
  const firestore = useFirestore();


  const handleGenerateQuiz = async () => {
    if (!topic.trim() || numQuestions < 3 || isGenerating) return;
    
    setGameState('generating');
    setError(null);
    setLimitError(null);

    if (!user || !firestore || !userProfile) {
        setError("Du er ikke logget ind. Log ind og prøv igen.");
        setGameState('setup');
        setIsGenerating(false);
        return;
    }
    
    const userRef = doc(firestore, 'users', user.uid);
    
    try {
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data() || {};
        
        // Limit Check for 'Kollega'
        if (userProfile.membership === 'Kollega') {
            const getWeek = (d: Date) => {
                const date = new Date(d.getTime());
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
                const week1 = new Date(date.getFullYear(), 0, 4);
                return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
            };

            const lastUsage = userData.lastQuizCreatorUsage?.toDate();
            const now = new Date();
            let weeklyCount = userData.weeklyQuizCreatorCount || 0;

            if (lastUsage && (getWeek(lastUsage) !== getWeek(now) || lastUsage.getFullYear() !== now.getFullYear())) {
                weeklyCount = 0;
            }
            
            if (weeklyCount >= 3) {
                setLimitError('Du har brugt dine 3 ugentlige forsøg i Quiz-byggeren. Opgrader til Kollega+ for ubegrænset adgang.');
                setGameState('setup');
                setIsGenerating(false);
                return;
            }
        }

        // Generate Quiz
        const result = await generateQuizAction({ topic, numQuestions });
        setQuizData(result.data);
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setGameState('playing');

        // Update Usage Stats
        const batch = writeBatch(firestore);

        const activityRef = doc(collection(firestore, 'userActivities'));
        batch.set(activityRef, {
            userId: user.uid,
            userName: userProfile.username || user.displayName || 'Anonym bruger',
            actionText: `oprettede en quiz om "${topic}" med Quiz-byggeren.`,
            createdAt: serverTimestamp(),
        });
        
        const userUpdates: {[key: string]: any} = {
            lastQuizCreatorUsage: serverTimestamp()
        };

        if (userProfile.membership === 'Kollega') {
             const getWeek = (d: Date) => {
                const date = new Date(d.getTime());
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
                const week1 = new Date(date.getFullYear(), 0, 4);
                return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
            };
            const lastUsage = userData.lastQuizCreatorUsage?.toDate();
            if (!lastUsage || getWeek(lastUsage) !== getWeek(new Date()) || lastUsage.getFullYear() !== new Date().getFullYear()) {
                userUpdates.weeklyQuizCreatorCount = 1;
            } else {
                userUpdates.weeklyQuizCreatorCount = increment(1);
            }
        }

        if (result.usage) {
            const totalTokens = result.usage.inputTokens + result.usage.outputTokens;
            const pointsToAdd = Math.round(totalTokens * 0.05);

            const tokenUsageCol = collection(firestore, 'users', user.uid, 'tokenUsage');
            batch.set(doc(tokenUsageCol), { flowName: 'generateQuiz', ...result.usage, totalTokens, createdAt: serverTimestamp() });
            
            if (pointsToAdd > 0) {
                userUpdates.cohéroPoints = increment(pointsToAdd);
            }
        }

        if (Object.keys(userUpdates).length > 0) {
            batch.update(userRef, userUpdates);
        }

        await batch.commit();
        await refetchUserProfile();

    } catch (err: any) {
      console.error(err);
      setError('Kunne ikke generere quizzen. Prøv venligst igen.');
      setGameState('setup');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    if (index === quizData?.questions[currentQuestionIndex].correctOptionIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < numQuestions - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setGameState('results');
    }
  };

  const handleRestart = () => {
    setGameState('setup');
    setTopic('');
    setQuizData(null);
  };
  
  const getButtonClass = (index: number) => {
    if (!isAnswered) {
      return "bg-white hover:bg-amber-50";
    }
    const correctIndex = quizData!.questions[currentQuestionIndex].correctOptionIndex;
    if (index === correctIndex) {
      return "bg-emerald-100 border-emerald-300 text-emerald-900";
    }
    if (index === selectedAnswer && index !== correctIndex) {
      return "bg-rose-100 border-rose-300 text-rose-900";
    }
    return "bg-white opacity-60";
  }

  const renderContent = () => {
    switch (gameState) {
      case 'generating':
        return (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-amber-500" />
            <h2 className="text-xl font-bold text-amber-950 serif mt-6">Bygger din quiz...</h2>
            <p className="text-slate-500">AI'en formulerer spørgsmål og svarmuligheder til dig.</p>
          </div>
        );

      case 'playing':
        if (!quizData) return null;
        const question = quizData.questions[currentQuestionIndex];
        return (
          <div className="max-w-2xl mx-auto">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Spørgsmål {currentQuestionIndex + 1} af {numQuestions}</p>
            <h2 className="text-2xl font-bold text-center text-amber-950 serif mb-8">{question.question}</h2>
            <div className="space-y-4">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-xl border-2 text-left flex items-start gap-4 transition-all ${getButtonClass(index)}`}
                >
                  <div className="w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center font-bold text-xs border-2 border-current mt-1">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1">{option}</span>
                </button>
              ))}
            </div>
            {isAnswered && (
              <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in-up">
                <h4 className="font-bold text-amber-900 mb-2">Forklaring</h4>
                <p className="text-sm text-slate-700">{question.explanation}</p>
                <Button onClick={handleNextQuestion} className="w-full mt-6">
                  {currentQuestionIndex < numQuestions - 1 ? 'Næste spørgsmål' : 'Se resultat'}
                </Button>
              </div>
            )}
          </div>
        );

      case 'results':
        return (
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-amber-950 serif mb-4">Resultat</h2>
            <p className="text-slate-500 mb-8">Du svarede korrekt på</p>
            <div className="text-7xl font-black text-amber-950 serif mb-2">{score} <span className="text-4xl text-slate-400">/ {numQuestions}</span></div>
            <p className="font-bold text-amber-800 mb-8">spørgsmål</p>
            <div className="flex gap-4">
                <Button onClick={handleRestart} variant="outline" className="w-full">Ny Quiz</Button>
                <Button onClick={() => setGameState('playing')} className="w-full">Gennemse svar</Button>
            </div>
          </div>
        );

      case 'setup':
      default:
        return (
          <div className="text-center max-w-lg mx-auto">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-amber-950 serif mb-4">Byg din egen quiz</h2>
            <p className="text-slate-500 mb-8">Indtast et fagligt emne, og lad AI'en skabe en multiple-choice quiz, så du kan teste din paratviden.</p>
            <form onSubmit={(e) => { e.preventDefault(); handleGenerateQuiz(); }} className="space-y-6">
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="F.eks. 'Serviceloven § 85' eller 'Systemisk teori'"
                className="h-12 text-center text-lg"
                required
              />
              <div>
                <label className="text-sm font-bold text-slate-600 mb-2 block">Antal spørgsmål: {numQuestions}</label>
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              {limitError && (
                    <div className="bg-amber-50 border-2 border-dashed border-amber-200 text-amber-950 p-4 rounded-xl text-center">
                        <h3 className="font-bold text-sm mb-1">Grænse nået</h3>
                        <p className="text-xs">{limitError}</p>
                        <Link href="/upgrade" className="font-bold underline text-xs mt-2 inline-block">Opgrader for ubegrænset adgang</Link>
                    </div>
              )}
              {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
              <Button type="submit" size="lg" disabled={!topic.trim() || numQuestions < 3 || isGenerating || !!limitError}>
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {isGenerating ? 'Bygger quiz...' : 'Generer Quiz'}
              </Button>
            </form>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col">
      <header className="bg-white border-b border-amber-100 px-6 py-6 sticky top-28 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/portal" className="p-2 hover:bg-amber-50 rounded-xl transition-colors text-amber-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-amber-950 serif">Quiz-byggeren</h1>
              <p className="text-xs text-slate-500">Test din viden om et specifikt emne</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default function QuizCreatorPage() {
  const { user, isUserLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#FDFCF8]">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-semibold">Indlæser...</p>
      </div>
    );
  }

  return <QuizCreatorPageContent />;
}
