import React from 'react';

const ResultCard = ({ icon, title, children, color }: { icon: React.ReactNode, title: string, children: React.ReactNode, color: string }) => (
    <div className={`bg-white p-6 rounded-2xl border border-amber-100/60 shadow-sm`}>
        <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                {icon}
            </div>
            <h3 className="text-lg font-bold text-amber-950 serif">{title}</h3>
        </div>
        <div className="text-sm text-slate-600 leading-relaxed prose prose-sm max-w-none">
            {children}
        </div>
    </div>
);

export default ResultCard;
