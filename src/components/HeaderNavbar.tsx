'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronRight, 
  Users, 
  BookOpen, 
  Scale, 
  X, 
  Menu, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  Zap, 
  Layers, 
  Calendar, 
  GitMerge, 
  GraduationCap, 
  Baby, 
  Activity, 
  Stethoscope, 
  Building2, 
  Brain, 
  Lock
} from 'lucide-react';
import { useApp } from '@/app/provider';

export default function HeaderNavbar() {
  const { openAuthPage, user } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStudyDropdownOpen, setIsStudyDropdownOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [isSecurityDropdownOpen, setIsSecurityDropdownOpen] = useState(false);
  
  const studyDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toolsDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const securityDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const handleStudyMouseEnter = () => {
    if (studyDropdownTimeoutRef.current) clearTimeout(studyDropdownTimeoutRef.current);
    setIsStudyDropdownOpen(true);
  };
  const handleStudyMouseLeave = () => {
    studyDropdownTimeoutRef.current = setTimeout(() => setIsStudyDropdownOpen(false), 150);
  };

  const handleToolsMouseEnter = () => {
    if (toolsDropdownTimeoutRef.current) clearTimeout(toolsDropdownTimeoutRef.current);
    setIsToolsDropdownOpen(true);
  };
  const handleToolsMouseLeave = () => {
    toolsDropdownTimeoutRef.current = setTimeout(() => setIsToolsDropdownOpen(false), 150);
  };

  const handleSecurityMouseEnter = () => {
    if (securityDropdownTimeoutRef.current) clearTimeout(securityDropdownTimeoutRef.current);
    setIsSecurityDropdownOpen(true);
  };
  const handleSecurityMouseLeave = () => {
    securityDropdownTimeoutRef.current = setTimeout(() => setIsSecurityDropdownOpen(false), 150);
  };

  const handleNavAuth = (mode: 'signin' | 'signup') => {
    if (typeof openAuthPage === 'function') {
      openAuthPage(mode);
    } else {
      router.push(`/auth?mode=${mode}`);
    }
  };

  return (
    <nav className="nav-landing-wrapper brand-font">
      <div className="nav-landing-container">
        
        {/* Brand Logo */}
        <Link href="/" className="nav-brand flex items-center gap-2 group">
          <img 
            src="/cohero-logo.png" 
            alt="Cohéro Student" 
            className="h-7 w-auto max-w-[150px] object-contain block -translate-y-0.5" 
          />
          <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-full ml-1 hidden sm:inline-block">
            Student
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1.5">
          
          {/* 1. Dropdown: Uddannelser */}
          <div 
            className="relative"
            onMouseEnter={handleStudyMouseEnter}
            onMouseLeave={handleStudyMouseLeave}
          >
            <button
              type="button"
              onClick={() => setIsStudyDropdownOpen(!isStudyDropdownOpen)}
              className={`nav-link-custom ${isStudyDropdownOpen ? 'bg-slate-100 text-slate-900' : ''}`}
            >
              <span>Uddannelser</span>
              <ChevronDown 
                size={14} 
                className={`ml-1 transition-transform duration-200 ${isStudyDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {isStudyDropdownOpen && (
              <div 
                className="scale-in absolute top-[calc(100%+8px)] -left-5 w-[560px] bg-white border border-slate-200 rounded-[20px] p-5 shadow-2xl z-[1002]"
              >
                {/* Top Cross-Disciplinary Card */}
                <a 
                  href="#tvaerfagligt" 
                  onClick={() => setIsStudyDropdownOpen(false)}
                  className="nav-dropdown-item flex items-center justify-between gap-3.5 p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200/80 mb-3.5 shadow-sm no-underline"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-700 p-2 rounded-xl flex-shrink-0">
                      <GitMerge size={18} />
                    </div>
                    <div>
                      <div className="text-[13px] font-black text-blue-950 flex items-center gap-2">
                        <span>Tværfagligt Velfærdssamarbejde</span>
                        <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black">
                          ALLE FAG
                        </span>
                      </div>
                      <div className="text-[11px] text-blue-700 leading-tight mt-0.5">
                        Forbind teori og praksis på tværs af kommuner, hospitaler og institutioner
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-blue-600 flex-shrink-0" />
                </a>

                <div className="grid grid-cols-2 gap-2 mb-3.5">
                  {/* Kolonne 1 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-0.5">
                      Social & Pædagogik
                    </span>

                    <a 
                      href="#uddannelser" 
                      onClick={() => setIsStudyDropdownOpen(false)}
                      className="nav-dropdown-item flex items-start gap-2.5 p-2 rounded-xl no-underline"
                    >
                      <div className="bg-blue-50 text-blue-700 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                        <Users size={15} />
                      </div>
                      <div>
                        <div className="text-[13px] font-extrabold text-slate-900">Socialrådgiver</div>
                        <div className="text-[11px] text-slate-500">Barnets Lov, Serviceloven & VUM 2.0</div>
                      </div>
                    </a>

                    <a 
                      href="#uddannelser" 
                      onClick={() => setIsStudyDropdownOpen(false)}
                      className="nav-dropdown-item flex items-start gap-2.5 p-2 rounded-xl no-underline"
                    >
                      <div className="bg-amber-50 text-amber-700 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                        <GraduationCap size={15} />
                      </div>
                      <div>
                        <div className="text-[13px] font-extrabold text-slate-900">Pædagogik & Dagtilbud</div>
                        <div className="text-[11px] text-slate-500">Didaktik, inklusion & relationsarbejde</div>
                      </div>
                    </a>

                    <a 
                      href="#uddannelser" 
                      onClick={() => setIsStudyDropdownOpen(false)}
                      className="nav-dropdown-item flex items-start gap-2.5 p-2 rounded-xl no-underline"
                    >
                      <div className="bg-purple-50 text-purple-700 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                        <Building2 size={15} />
                      </div>
                      <div>
                        <div className="text-[13px] font-extrabold text-slate-900">Socialpædagogik & Døgn</div>
                        <div className="text-[11px] text-slate-500">Magtanvendelse, KRAP & bostedspraksis</div>
                      </div>
                    </a>
                  </div>

                  {/* Kolonne 2 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-0.5">
                      Sundhed & Terapi
                    </span>

                    <a 
                      href="#uddannelser" 
                      onClick={() => setIsStudyDropdownOpen(false)}
                      className="nav-dropdown-item flex items-start gap-2.5 p-2 rounded-xl no-underline"
                    >
                      <div className="bg-sky-50 text-sky-700 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                        <Stethoscope size={15} />
                      </div>
                      <div>
                        <div className="text-[13px] font-extrabold text-slate-900">Sygepleje & Sundhed</div>
                        <div className="text-[11px] text-slate-500">Sundhedsloven, triage & klinisk metode</div>
                      </div>
                    </a>

                    <a 
                      href="#uddannelser" 
                      onClick={() => setIsStudyDropdownOpen(false)}
                      className="nav-dropdown-item flex items-start gap-2.5 p-2 rounded-xl no-underline"
                    >
                      <div className="bg-pink-50 text-pink-700 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                        <Baby size={15} />
                      </div>
                      <div>
                        <div className="text-[13px] font-extrabold text-slate-900">Jordemoderstudiet</div>
                        <div className="text-[11px] text-slate-500">Svangreomsorg, obstetrik & etik</div>
                      </div>
                    </a>

                    <a 
                      href="#uddannelser" 
                      onClick={() => setIsStudyDropdownOpen(false)}
                      className="nav-dropdown-item flex items-start gap-2.5 p-2 rounded-xl no-underline"
                    >
                      <div className="bg-emerald-50 text-emerald-700 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                        <Activity size={15} />
                      </div>
                      <div>
                        <div className="text-[13px] font-extrabold text-slate-900">Ergo- & Fysioterapi</div>
                        <div className="text-[11px] text-slate-500">Funktionstest, rehabilitering & anatomi</div>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between px-2">
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Tilpasset alle 6 centrale velfærdsuddannelser
                  </span>
                  <a 
                    href="#uddannelser" 
                    onClick={() => setIsStudyDropdownOpen(false)}
                    className="text-[12px] font-extrabold text-slate-900 flex items-center gap-1 hover:text-blue-600 no-underline"
                  >
                    <span>Vælg dit studieområde</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 2. Dropdown: Funktioner & Værktøjer */}
          <div 
            className="relative"
            onMouseEnter={handleToolsMouseEnter}
            onMouseLeave={handleToolsMouseLeave}
          >
            <button
              type="button"
              onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
              className={`nav-link-custom ${isToolsDropdownOpen ? 'bg-slate-100 text-slate-900' : ''}`}
            >
              <span>Værktøjer</span>
              <ChevronDown 
                size={14} 
                className={`ml-1 transition-transform duration-200 ${isToolsDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {isToolsDropdownOpen && (
              <div 
                className="scale-in absolute top-[calc(100%+8px)] -left-10 w-[580px] bg-white border border-slate-200 rounded-[20px] p-5 shadow-2xl z-[1002]"
              >
                {/* Featured Top Highlight: AI Eksamensarkitekt */}
                <a 
                  href="#ai-agenter" 
                  onClick={() => setIsToolsDropdownOpen(false)}
                  className="nav-dropdown-item flex items-center justify-between gap-3.5 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 mb-3.5 shadow-sm no-underline"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 text-emerald-800 p-2 rounded-xl flex-shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="text-[13px] font-black text-emerald-950 flex items-center gap-2">
                        <span>Cohéro AI · Autonome Studie-Agenter</span>
                        <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black">
                          NYHED
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-700 leading-tight mt-0.5">
                        Eksamensarkitekt, sagsakt-scanner og automatisk pensumdisposition
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-emerald-700 flex-shrink-0" />
                </a>

                <div className="grid grid-cols-2 gap-3 mb-3.5">
                  {/* Søjle 1 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-0.5">
                      Lov & Juridisk Metode
                    </span>

                    <a 
                      href="#lovportal" 
                      onClick={() => setIsToolsDropdownOpen(false)}
                      className="nav-dropdown-item flex items-start gap-3 p-2 rounded-xl no-underline"
                    >
                      <div className="bg-indigo-50 text-indigo-700 p-2 rounded-lg flex-shrink-0 mt-0.5">
                        <Scale size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-extrabold text-slate-900">Lovportal & Retsinfo</div>
                        <div className="text-[11px] text-slate-500">Live §-opslag, domme & Ankestyrelsen</div>
                      </div>
                    </a>

                    <a 
                      href="#moduler" 
                      onClick={() => setIsToolsDropdownOpen(false)}
                      className="nav-dropdown-item flex items-start gap-3 p-2 rounded-xl no-underline"
                    >
                      <div className="bg-rose-50 text-rose-700 p-2 rounded-lg flex-shrink-0 mt-0.5">
                        <Brain size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-extrabold text-slate-900">Juridisk Sagsanalyse</div>
                        <div className="text-[11px] text-slate-500">Faktum, retsregler & subsumption</div>
                      </div>
                    </a>

                    <a 
                      href="#moduler" 
                      onClick={() => setIsToolsDropdownOpen(false)}
                      className="nav-dropdown-item flex items-start gap-3 p-2 rounded-xl no-underline"
                    >
                      <div className="bg-purple-50 text-purple-700 p-2 rounded-lg flex-shrink-0 mt-0.5">
                        <FileText size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-extrabold text-slate-900">Journaltræner (SOAP)</div>
                        <div className="text-[11px] text-slate-500">Professionel sagsnotat-træning</div>
                      </div>
                    </a>
                  </div>

                  {/* Søjle 2 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-0.5">
                      Pensum & Eksamen
                    </span>

                    <a 
                      href="#moduler" 
                      onClick={() => setIsToolsDropdownOpen(false)}
                      className="nav-dropdown-item flex items-start gap-3 p-2 rounded-xl no-underline"
                    >
                      <div className="bg-blue-50 text-blue-700 p-2 rounded-lg flex-shrink-0 mt-0.5">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-extrabold text-slate-900">Pensum & Bog-assistent</div>
                        <div className="text-[11px] text-slate-500">Få overblik over 500+ siders bøger</div>
                      </div>
                    </a>

                    <a 
                      href="#moduler" 
                      onClick={() => setIsToolsDropdownOpen(false)}
                      className="nav-dropdown-item flex items-start gap-3 p-2 rounded-xl no-underline"
                    >
                      <div className="bg-amber-50 text-amber-700 p-2 rounded-lg flex-shrink-0 mt-0.5">
                        <Layers size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-extrabold text-slate-900">APA Kildegenerator</div>
                        <div className="text-[11px] text-slate-500">Automatiske referencer & litteraturliste</div>
                      </div>
                    </a>

                    <a 
                      href="#moduler" 
                      onClick={() => setIsToolsDropdownOpen(false)}
                      className="nav-dropdown-item flex items-start gap-3 p-2 rounded-xl no-underline"
                    >
                      <div className="bg-teal-50 text-teal-700 p-2 rounded-lg flex-shrink-0 mt-0.5">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-extrabold text-slate-900">Semester- & Studieplan</div>
                        <div className="text-[11px] text-slate-500">Struktur over moduler og eksaminer</div>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Bundbjælke */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between px-2">
                  <span className="text-[11px] text-slate-500 font-semibold">
                    12 faglige værktøjer designet til studerende
                  </span>
                  <a 
                    href="#moduler" 
                    onClick={() => setIsToolsDropdownOpen(false)}
                    className="text-[12px] font-extrabold text-slate-900 flex items-center gap-1 hover:text-blue-600 no-underline"
                  >
                    <span>Udforsk alle værktøjer</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 3. Dropdown: Sikkerhed & Etik */}
          <div 
            className="relative"
            onMouseEnter={handleSecurityMouseEnter}
            onMouseLeave={handleSecurityMouseLeave}
          >
            <button
              type="button"
              onClick={() => setIsSecurityDropdownOpen(!isSecurityDropdownOpen)}
              className={`nav-link-custom ${isSecurityDropdownOpen ? 'bg-slate-100 text-slate-900' : ''}`}
            >
              <span>Tryghed & Etik</span>
              <ChevronDown 
                size={14} 
                className={`ml-1 transition-transform duration-200 ${isSecurityDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {isSecurityDropdownOpen && (
              <div 
                className="scale-in absolute top-[calc(100%+8px)] -left-5 w-[320px] bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xl z-[1002]"
              >
                <Link 
                  href="/etik" 
                  onClick={() => setIsSecurityDropdownOpen(false)}
                  className="nav-dropdown-item flex items-start gap-3 p-2.5 rounded-xl no-underline"
                >
                  <div className="bg-blue-50 text-blue-700 p-2 rounded-lg flex-shrink-0 mt-0.5">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div className="text-[13px] font-extrabold text-slate-900">Eksamenssikker & Etisk AI</div>
                    <div className="text-[11px] text-slate-500">Overholder universiteternes AI-retningslinjer</div>
                  </div>
                </Link>

                <a 
                  href="#lovportal" 
                  onClick={() => setIsSecurityDropdownOpen(false)}
                  className="nav-dropdown-item flex items-start gap-3 p-2.5 rounded-xl no-underline"
                >
                  <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg flex-shrink-0 mt-0.5">
                    <Scale size={16} />
                  </div>
                  <div>
                    <div className="text-[13px] font-extrabold text-slate-900">Gældende Dansk Ret</div>
                    <div className="text-[11px] text-slate-500">100% verificeret med Retsinformation</div>
                  </div>
                </a>

                <Link 
                  href="/terms-of-service" 
                  onClick={() => setIsSecurityDropdownOpen(false)}
                  className="nav-dropdown-item flex items-start gap-3 p-2.5 rounded-xl no-underline"
                >
                  <div className="bg-slate-50 text-slate-700 p-2 rounded-lg flex-shrink-0 mt-0.5">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="text-[13px] font-extrabold text-slate-900">Betingelser & GDPR</div>
                    <div className="text-[11px] text-slate-500">Dine opgavedata er 100% private</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* 4. Priser Link */}
          <a href="#pricing" className="nav-link-custom">
            Priser
          </a>
        </div>

        {/* Action Buttons (Right) */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link 
              href="/portal"
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #18223c 0%, #2563eb 100%)',
                color: 'white',
                padding: '0.6rem 1.4rem',
                fontSize: '0.85rem',
                borderRadius: '11px',
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                textDecoration: 'none'
              }}
            >
              Min Studieportal
            </Link>
          ) : (
            <>
              <button 
                onClick={() => handleNavAuth('signin')}
                className="hidden sm:inline-flex items-center text-slate-700 hover:text-slate-950 font-extrabold text-xs tracking-wider uppercase px-3 py-2 rounded-lg transition-colors"
              >
                Log ind
              </button>
              <button 
                onClick={() => handleNavAuth('signup')}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #18223c 0%, #2563eb 100%)',
                  color: 'white',
                  padding: '0.6rem 1.4rem',
                  fontSize: '0.85rem',
                  borderRadius: '11px',
                  fontWeight: 800,
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Opret gratis profil
              </button>
            </>
          )}

          {/* Mobile Hamburger Toggle */}
          <button 
            className="lg:hidden p-2 text-slate-800 hover:text-slate-950 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div 
          className="scale-in fixed top-[76px] left-0 right-0 bg-white/98 backdrop-blur-2xl border-b border-slate-200 p-6 shadow-2xl z-[1001] max-h-[calc(100vh-80px)] overflow-y-auto flex flex-col gap-5"
        >
          {/* Sektion 1: Uddannelser */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Uddannelser
            </span>
            <a 
              href="#uddannelser" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-800 font-extrabold text-sm py-1.5 no-underline flex items-center justify-between"
            >
              <span>Socialrådgiver & VUM 2.0</span>
              <ChevronRight size={16} className="text-slate-400" />
            </a>
            <a 
              href="#uddannelser" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-800 font-extrabold text-sm py-1.5 no-underline flex items-center justify-between"
            >
              <span>Pædagogik & Socialpædagogik</span>
              <ChevronRight size={16} className="text-slate-400" />
            </a>
            <a 
              href="#uddannelser" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-800 font-extrabold text-sm py-1.5 no-underline flex items-center justify-between"
            >
              <span>Sygepleje & Jordemoder</span>
              <ChevronRight size={16} className="text-slate-400" />
            </a>
            <a 
              href="#tvaerfagligt" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-blue-700 font-extrabold text-sm py-1.5 no-underline flex items-center justify-between"
            >
              <span>Tværfagligt Samarbejde</span>
              <span className="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">FÆLLES</span>
            </a>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Sektion 2: Værktøjer */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Faglige Værktøjer
            </span>
            <a 
              href="#ai-agenter" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-emerald-700 font-black text-sm py-1.5 no-underline flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} />
                <span>Cohéro AI & Agenter</span>
              </div>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">NYHED</span>
            </a>
            <a 
              href="#lovportal" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-800 font-extrabold text-sm py-1.5 no-underline flex items-center justify-between"
            >
              <span>Lovportal & Retsinformation</span>
              <ChevronRight size={16} className="text-slate-400" />
            </a>
            <a 
              href="#moduler" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-800 font-extrabold text-sm py-1.5 no-underline flex items-center justify-between"
            >
              <span>Pensum- & Eksamensarkitekt</span>
              <ChevronRight size={16} className="text-slate-400" />
            </a>
            <a 
              href="#pricing" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-800 font-extrabold text-sm py-1.5 no-underline flex items-center justify-between"
            >
              <span>Priser & Pakker</span>
              <ChevronRight size={16} className="text-slate-400" />
            </a>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Mobile Auth Actions */}
          <div className="flex flex-col gap-2.5 pt-1">
            {user ? (
              <Link 
                href="/portal"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl bg-blue-600 text-white font-extrabold text-sm no-underline"
              >
                Gå til Min Portal
              </Link>
            ) : (
              <>
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); handleNavAuth('signin'); }}
                  className="w-full py-3 rounded-xl border border-slate-200 text-slate-800 font-extrabold text-sm hover:bg-slate-50"
                >
                  Log ind
                </button>
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); handleNavAuth('signup'); }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-slate-900 to-blue-900 text-white font-extrabold text-sm shadow-md"
                >
                  Opret gratis profil
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
