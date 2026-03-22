import React from 'react';
import { Users, ShieldCheck, Target, RotateCcw, Briefcase, PlusCircle, Clock, Gavel } from 'lucide-react';

export const socialWorkTopics = [
    { id: "boern-unge", name: "Børn og unge", icon: <Users className="w-6 h-6"/>, sub: "Omsorgssvigt, anbringelse", color: "from-blue-500 to-blue-600", light: "bg-blue-50" },
    { id: "voksne-handicap", name: "Voksne med handicap", icon: <ShieldCheck className="w-6 h-6"/>, sub: "Støtte og botilbud", color: "from-emerald-500 to-emerald-600", light: "bg-emerald-50" },
    { id: "psykiatri", name: "Psykiatri", icon: <Target className="w-6 h-6"/>, sub: "Socialpsykiatrisk støtte", color: "from-purple-500 to-purple-600", light: "bg-purple-50" },
    { id: "misbrug", name: "Misbrug", icon: <RotateCcw className="w-6 h-6"/>, sub: "Behandling & omsorg", color: "from-rose-500 to-rose-600", light: "bg-rose-50" },
    { id: "beskaeftigelse", name: "Beskæftigelse", icon: <Briefcase className="w-6 h-6"/>, sub: "Ressourceforløb & sygedagpenge", color: "from-amber-500 to-amber-600", light: "bg-amber-50" },
    { id: "integration", name: "Integration", icon: <PlusCircle className="w-6 h-6"/>, sub: "Flygtninge & familier", color: "from-cyan-500 to-cyan-600", light: "bg-cyan-50" },
    { id: "aeldre", name: "Ældre", icon: <Clock className="w-6 h-6"/>, sub: "Hjemmepleje & demens", color: "from-orange-500 to-orange-600", light: "bg-orange-50" },
    { id: "kriminalitet", name: "Kriminalitet", icon: <Gavel className="w-6 h-6"/>, sub: "Forebyggelse & unge", color: "from-slate-500 to-slate-600", light: "bg-slate-50" },
];
