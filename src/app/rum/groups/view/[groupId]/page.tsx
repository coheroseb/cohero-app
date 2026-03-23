'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Loader2,
  X,
  Zap,
  ChevronRight,
  ClipboardList,
  Info,
  UserMinus,
  CalendarCheck,
  Laptop,
  MapPin,
  UserPlus,
  Calendar,
  HelpCircle,
  Sparkles,
  UserX,
  ChevronDown,
  Circle,
  PlayCircle,
  CalendarDays,
  User as UserIcon,
  RefreshCw,
  Link as LinkIcon,
  FileSearch,
  Mic,
  BarChart,
  Eye,
  FileText,
  ExternalLink,
  UploadCloud,
  GanttChart,
  Pencil,
  FileUp,
  LayoutGrid,
  List as ListIcon,
  AlertCircle,
  TrendingUp,
  CheckSquare,
  Square,
  MoreVertical,
  Contact,
  Phone,
  Mail,
  Building,
  Globe,
    Settings,
    Flag,
    Target,
    Menu,
    Check,
    BookOpen,
    Edit2,
    Lock as LockIcon,
    Download,
    ScrollText,
    Search,
    Copy,
    MessageSquare,
    Send,
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { User } from 'firebase/auth';
import { saveAs } from 'file-saver';
import { syncCalendarAvailability, extractTasksFromTextAction, analyzeTaskScheduleAction, sendGroupInvitationEmailAction, queueNotificationAction, addGroupMemberByEmailAction, generateEvidenceTagsAction,
  extractApaMetadataAction, processExamRegulationsAction, chatWithEvidenceContentAction
} from '@/app/actions';
type WithId<T> = T & { id: string };
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useStorage } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, setDoc, deleteDoc, updateDoc, getDocs, where, arrayUnion, arrayRemove, increment, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getBlob, deleteObject } from 'firebase/storage';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { organizeEvidenceIntoSeminarAction } from '@/app/actions';
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

// New Portfolio Components
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import { FocusedPortfolioWorkspace } from '@/components/portfolio/FocusedPortfolioWorkspace';
import { ApaReferenceEditor } from '@/components/portfolio/ApaReferenceEditor';
import { PortfolioEntry, Evidence, ApaReference } from '@/components/portfolio/types';

interface Group {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  memberIds: string[];
  finalDeadline?: string;
  createdAt: any;
  membersCount: number;
}

interface Member {
  id: string;
  userId?: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: any;
  nickname?: string;
}

interface SubTask {
    id: string;
    text: string;
    completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  subtasks?: SubTask[];
  assignedToId?: string;
  assignedToName?: string;
  startDate?: string;
  dueDate?: string;
  createdAt: any;
}





interface GroupContact {
    id: string;
    name: string;
    title: string;
    organization: string;
    email: string;
    phone: string;
    notes: string;
    addedById: string;
    addedByName: string;
    createdAt: any;
}

type AvailabilityMode = 'physical' | 'online' | 'unavailable' | null;

interface MemberAvailability {
    id: string;
    username: string;
    slots: Record<string, { mode: AvailabilityMode; timeframe?: string }>; // updated to allow timeframe
    updatedAt: any;
    icalUrl?: string;
    busyEvents?: { start: string; end: string; title: string }[];
}



const WEEKDAYS = [
    { id: 'mandag', label: 'Man' },
    { id: 'tirsdag', label: 'Tir' },
    { id: 'onsdag', label: 'Ons' },
    { id: 'torsdag', label: 'Tor' },
    { id: 'fredag', label: 'Fre' },
    { id: 'lørdag', label: 'Lør' },
    { id: 'søndag', label: 'Søn' },
] as const;

const TIME_SLOTS = [
    { id: 'morning', label: 'Formiddag', time: '08-12', short: 'F' },
    { id: 'afternoon', label: 'Eftermiddag', time: '12-17', short: 'E' },
    { id: 'evening', label: 'Aften', time: '17-22', short: 'A' },
] as const;

// PDF text extraction utility
async function extractTextFromPdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/build/pdf.mjs');
  const pdfjsVersion = '4.10.38'; 
  GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const loadingTask = getDocument({data: new Uint8Array(buffer)});
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ');
    text += `\n[--- SIDE ${i} ---]\n` + strings + '\n';
  }
  return text;
}









export default function GroupDetailPage() {
  const { user, userProfile, isUserLoading } = useApp();
  const firestore = useFirestore();
  const storage = useStorage();
  const params = useParams();
  const searchParams = useSearchParams();
  const groupId = (params?.groupId as string) || '';
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'tasks' | 'timeline' | 'members' | 'availability' | 'evidence' | 'contacts' | 'portfolio'>('tasks');
  const [isImportingTasks, setIsImportingTasks] = useState(false);
  const [isImportingPortfolio, setIsImportingPortfolio] = useState(false);
  const [portfolioView, setPortfolioView] = useState<'shared' | 'private'>('shared');
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'scrum'>('list');
  const [evidenceViewMode, setEvidenceViewMode] = useState<'grid' | 'list' | 'bib'>('grid');
  const [evidenceSearchQuery, setEvidenceSearchQuery] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  const [locale, setLocale] = useState<'da' | 'en'>('da');

  // Chat med empiri
  const [chattingEvidence, setChattingEvidence] = useState<Evidence[] | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [extractedChatDocuments, setExtractedChatDocuments] = useState<{title: string, content: string}[]>([]);
  const [isExtractingChatText, setIsExtractingChatText] = useState(false);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [editingEvidenceId, setEditingEvidenceId] = useState<string | null>(null);
  const [editingEvidenceTitle, setEditingEvidenceTitle] = useState('');
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const queryLang = searchParams?.get('lang') as 'da' | 'en';
    const savedLocale = localStorage.getItem('cohero_groups_locale') as 'da' | 'en';
    if (queryLang && (queryLang === 'da' || queryLang === 'en')) {
      setLocale(queryLang);
    } else if (savedLocale && (savedLocale === 'da' || savedLocale === 'en')) {
      setLocale(savedLocale);
    }
  }, [searchParams]);

  const t = {
      da: {
          tasks: "Opgaver",
          timeline: "Tidslinje",
          evidence: "Empiri",
          contacts: "Kontaktbog",
          availability: "Tilgængelighed",
          members: "Medlemmer",
          groupInfo: "Om gruppen",
          deadline: "Fælles Deadline",
          daysLeft: "dage tilbage",
          deadlineToday: "Deadline i dag!",
          deadlinePassed: "Deadline overskredet",
          analyzeTimeline: "Analyser Tidslinje",
          updateCalendar: "Opdater Kalender",
          syncCalendar: "Synkronisér Kalender",
          addManual: "Tilføj manuelt",
          newContact: "Ny kontakt",
          importPdf: "Importér PDF",
          newTask: "Ny opgave",
          inviteColleague: "Inviter kollega",
          back: "Tilbage",
          studyGroup: "Studiegruppe",
          noDescription: "Ingen beskrivelse tilføjet.",
          addColleague: "Tilføj Kollega",
          inviteMembersDesc: "Inviter et nyt medlem til gruppen.",
          syncTimeframe: "Tidsramme for synkronisering",
          startDate: "Start dato",
          endDate: "Slut dato",
          syncHelp: "Systemet analyserer din kalender i den valgte periode og finder dine mønstre.",
          editSlot: "Rediger tilgængelighed",
          chooseType: "Vælg type",
          chooseTimeframe: "Vælg tidsrum (valgfri)",
          save: "Gem",
          physical: "Fysisk",
          online: "Online",
          unavailable: "Optaget",
          notSet: "Ikke angivet",
      },
      en: {
          tasks: "Tasks",
          timeline: "Timeline",
          evidence: "Evidence",
          contacts: "Contacts",
          availability: "Availability",
          members: "Members",
          groupInfo: "About Group",
          deadline: "Final Deadline",
          daysLeft: "days left",
          deadlineToday: "Deadline today!",
          deadlinePassed: "Deadline passed",
          analyzeTimeline: "Analyze Timeline",
          updateCalendar: "Update Calendar",
          syncCalendar: "Sync Calendar",
          addManual: "Add manual",
          newContact: "New contact",
          importPdf: "Import PDF",
          newTask: "New task",
          inviteColleague: "Invite colleague",
          back: "Back",
          studyGroup: "Study Group",
          addColleague: "Add Colleague",
          inviteMembersDesc: "Invite a new member to the group.",
          noDescription: "No description added.",
          syncTimeframe: "Sync Timeframe",
          startDate: "Start Date",
          endDate: "End Date",
          syncHelp: "The system analyzes your calendar in the selected period and finds your patterns.",
          editSlot: "Edit Availability",
          chooseType: "Choose type",
          chooseTimeframe: "Choose timeframe (optional)",
          save: "Save",
          physical: "Physical",
          online: "Online",
          unavailable: "Busy",
          notSet: "Not set",
      }
  };

  const currentT = t[locale];

  // Group Management
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editGroupData, setEditGroupData] = useState({ name: '', description: '', finalDeadline: '' });

  // Member Management
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newNickname, setNewNickname] = useState('');
  
  // Task Management
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    startDate: '',
    dueDate: '',
    assignedToId: '',
    priority: 'medium' as Task['priority'],
    subtasks: [] as SubTask[],
  });
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  // Evidence Management
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const [isEditingApa, setIsEditingApa] = useState(false); // New state for APA editor
  const [editingApaItem, setEditingApaItem] = useState<Evidence | null>(null); // New state for APA item
  const [isDragging, setIsDragging] = useState(false);
  const [newEvidence, setNewEvidence] = useState<{
      title: string;
      description: string;
      type: Evidence['type'];
      url: string;
      file: File | null;
  }>({
      title: '',
      description: '',
      type: 'interview',
      url: '',
      file: null
  });

  // Portfolio Management
  const [isAddingPortfolioEntry, setIsAddingPortfolioEntry] = useState(false);
  const [editingPortfolioEntry, setEditingPortfolioEntry] = useState<PortfolioEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [newPortfolioEntry, setNewPortfolioEntry] = useState<{
      title: string;
      content: string;
      status: PortfolioEntry['status'];
      linkedEvidenceIds: string[];
      isPrivate: boolean;
      assignment: string;
      characterLimit: string;
      order: number;
  }>({
      title: '',
      content: '',
      status: 'draft',
      linkedEvidenceIds: [],
      isPrivate: false,
      assignment: '',
      characterLimit: '',
      order: 0
  });
  const [isAnalyzingPortfolio, setIsAnalyzingPortfolio] = useState(false);

  // Contact Management
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({
      name: '',
      title: '',
      organization: '',
      email: '',
      phone: '',
      notes: ''
  });

  // Availability / iCal Sync
  const [showIcalInput, setShowIcalInput] = useState(false);
  const [icalUrlInput, setIcalUrlInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncRange, setSyncRange] = useState({ 
    start: new Date().toISOString().split('T')[0], 
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] 
  });
  const [editingSlot, setEditingSlot] = useState<{ dayId: string; slotId: string } | null>(null);
  const [slotFormData, setSlotFormData] = useState<{ mode: AvailabilityMode; from: string; to: string }>({ mode: null, from: '', to: '' });

  const [isRemovingId, setIsRemovingId] = useState<string | null>(null);

  useEffect(() => {
      if (!isAddingPortfolioEntry || !newPortfolioEntry.title.trim() || !firestore || !user) return;
      
      const timer = setTimeout(() => {
          handleSavePortfolioEntry(undefined, true);
      }, 5000); // 5 second debounce for auto-save

      return () => clearTimeout(timer);
  }, [newPortfolioEntry.title, newPortfolioEntry.content, newPortfolioEntry.status, newPortfolioEntry.isPrivate, newPortfolioEntry.assignment, isAddingPortfolioEntry]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fetch Group
  const groupRef = useMemoFirebase(() => firestore ? doc(firestore, 'groups', groupId) : null, [firestore, groupId]);
  const { data: group, isLoading: groupLoading } = useDoc<Group>(groupRef);

  // Fetch Members
  const membersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'groups', groupId, 'members'), orderBy('joinedAt', 'asc')) : null, [firestore, groupId]);
  const { data: members, isLoading: membersLoading } = useCollection<Member>(membersQuery);

  // Fetch Tasks
  const tasksQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'groups', groupId, 'tasks'), orderBy('createdAt', 'desc')) : null, [firestore, groupId]);
  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);

  // Fetch Evidence
  const evidenceQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'groups', groupId, 'evidence'), orderBy('createdAt', 'desc')) : null, [firestore, groupId]);
  const { data: evidence, isLoading: evidenceLoading } = useCollection<Evidence>(evidenceQuery);

  const totalStorageUsed = useMemo(() => {
    if (!evidence) return 0;
    return evidence.reduce((acc, item) => acc + (item.fileSize || 0), 0);
  }, [evidence]);

  const filteredEvidence = useMemo(() => {
    if (!evidence) return [];
    if (!evidenceSearchQuery.trim()) return evidence;
    const query = evidenceSearchQuery.toLowerCase();
    return evidence.filter(item => {
        const matchTitleAndDesc = (item.title?.toLowerCase() || '').includes(query) || (item.description?.toLowerCase() || '').includes(query);
        const matchTags = item.tags?.some(tag => tag.toLowerCase().includes(query)) || false;
        const matchAddedBy = (item.addedByName?.toLowerCase() || '').includes(query);
        const matchAPA = item.apaRef?.authors?.toLowerCase().includes(query) || item.apaRef?.title?.toLowerCase().includes(query);
        return matchTitleAndDesc || matchTags || matchAddedBy || matchAPA;
    });
  }, [evidence, evidenceSearchQuery]);

  // Fetch Contacts
  const contactsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'groups', groupId, 'contacts'), orderBy('createdAt', 'desc')) : null, [firestore, groupId]);
  const { data: contacts, isLoading: contactsLoading } = useCollection<GroupContact>(contactsQuery);

  // Fetch Availabilities
  const availabilityQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'groups', groupId, 'availability')) : null, [firestore, groupId]);
  const { data: availabilities, isLoading: availabilityLoading } = useCollection<MemberAvailability>(availabilityQuery);

  // Fetch Portfolio
  const portfolioQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'groups', groupId, 'portfolio'), orderBy('order', 'asc')) : null, [firestore, groupId]);
  const { data: portfolio, isLoading: portfolioLoading } = useCollection<PortfolioEntry>(portfolioQuery);

  const visiblePortfolio = useMemo(() => {
    if (!portfolio || !user) return [];
    return portfolio.filter(p => !p.isPrivate || p.addedById === user.uid);
  }, [portfolio, user]);

  const sharedPortfolio = useMemo(() => visiblePortfolio.filter(p => !p.isPrivate), [visiblePortfolio]);
  const privatePortfolio = useMemo(() => visiblePortfolio.filter(p => p.isPrivate), [visiblePortfolio]);

  const groupedShared = useMemo(() => {
      const groups: { [key: string]: PortfolioEntry[] } = {};
      sharedPortfolio.forEach(p => {
          const name = p.assignment || (locale === 'da' ? 'Hovedopgave' : 'Main Project');
          if (!groups[name]) groups[name] = [];
          groups[name].push(p);
      });
      Object.keys(groups).forEach(key => {
          groups[key].sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      return groups;
  }, [sharedPortfolio, locale]);

  const groupedPrivate = useMemo(() => {
      const groups: { [key: string]: PortfolioEntry[] } = {};
      privatePortfolio.forEach(p => {
          const name = p.assignment || (locale === 'da' ? 'Privat Notearkiv' : 'Private Notes');
          if (!groups[name]) groups[name] = [];
          groups[name].push(p);
      });
      Object.keys(groups).forEach(key => {
          groups[key].sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      return groups;
  }, [privatePortfolio, locale]);

  const existingAssignments = useMemo(() => {
      if (!portfolio) return [];
      const names = portfolio.map(p => p.assignment).filter(Boolean) as string[];
      return Array.from(new Set(names)).sort();
  }, [portfolio]);

  const isAdmin = useMemo(() => {
    if (!user || !members) return false;
    return members.find(m => m.id === user.uid)?.role === 'admin';
  }, [user, members]);

  // Project Insights
  const projectStats = useMemo(() => {
      if (!tasks) return null;
      const total = tasks.length;
      if (total === 0) return null;
      const done = tasks.filter(t => t.status === 'done').length;
      const inProgress = tasks.filter(t => t.status === 'in-progress').length;
      const progress = Math.round((done / total) * 100);
      const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()).length;
      
      const workload: Record<string, number> = {};
      tasks.forEach(t => {
          if (t.assignedToName && t.status !== 'done') {
              workload[t.assignedToName] = (workload[t.assignedToName] || 0) + 1;
          }
      });

      return { total, done, inProgress, progress, overdue, workload };
  }, [tasks]);

  const handleExportPortfolioAsDocx = async (mode: 'shared' | 'private') => {
      try {
          const sections: any[] = [];
          const data = mode === 'shared' ? groupedShared : groupedPrivate;
          const label = mode === 'shared' ? (locale === 'da' ? 'Fælles Portfolio' : 'Shared Portfolio') : (locale === 'da' ? 'Min Private Portfolio' : 'My Private Portfolio');

          const hasForside = Object.values(data).flat().some((e: any) => e.title.toLowerCase().trim() === 'forside' || e.title.toLowerCase().includes('forside'));

          // TITLE PAGE (Fallback if no custom Forside)
          if (!hasForside) {
              sections.push({
                  properties: {},
                  children: [
                      new Paragraph({ text: label, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: `Cohero - ${group?.name || 'Gruppe'}`, alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: `Udskrevet ${new Date().toLocaleDateString()}`, alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: "" }),
                      new Paragraph({ text: "" }),
                  ],
              });
          } else {
              sections.push({ properties: {}, children: [] });
          }

          // ENTRIES
          let isFirstAfterForside = false;

          Object.entries(data).forEach(([name, entries]) => {
              entries.forEach((entry: any) => {
                  const isForside = entry.title.toLowerCase().trim() === 'forside' || entry.title.toLowerCase().includes('forside');
                  
                  // Extract HTML to text blocks
                  const rawHtml = String(entry.content || '');
                  const blocks = rawHtml.replace(/<br\s*\/?>/gi, '\n')
                      .split(/<\/?(?:p|h[1-6]|div)[^>]*>/i)
                      .map((s: string) => s.trim())
                      .filter((s: string) => s.length > 0 && s.replace(/<[^>]*>/g, '').trim().length > 0);

                  if (isForside) {
                      const forsideParagraphs = blocks.map((htmlBlock: string, idx: number) => {
                          const isBold = htmlBlock.includes('<strong>') || htmlBlock.includes('<b>');
                          // Only the very first text block gets the huge title spacing and font
                          const isMainTitle = idx === 0; 
                          const textContent = htmlBlock.replace(/<[^>]*>/g, '').trim();
                          
                          return new Paragraph({
                              children: textContent.split('\n').map((l, i) => new TextRun({ text: l, break: i > 0 ? 1 : 0, bold: isBold || isMainTitle, size: isMainTitle ? 48 : 28 })),
                              alignment: AlignmentType.CENTER,
                              spacing: { before: isMainTitle ? 4000 : 200, after: isMainTitle ? 1000 : 200 }
                          });
                      });

                      sections[0].children.push(...forsideParagraphs);
                      isFirstAfterForside = true;

                  } else {
                      // Standard Entry
                      sections[0].children.push(
                          new Paragraph({
                              text: entry.title,
                              heading: HeadingLevel.HEADING_1,
                              spacing: { before: 400, after: 200 },
                              pageBreakBefore: isFirstAfterForside
                          }),
                          new Paragraph({
                              children: [
                                  new TextRun({ text: `Status: ${entry.status}`, bold: true, size: 20 }),
                                  new TextRun({ text: ` | Sidst opdateret af: ${entry.addedByName}`, size: 20 }),
                              ],
                              spacing: { after: 300 }
                          }),
                          ...blocks.map((htmlBlock: string) => {
                              const isBold = htmlBlock.includes('<strong>') || htmlBlock.includes('<b>');
                              return new Paragraph({
                                  children: htmlBlock.replace(/<[^>]*>/g, '').split('\n').map((l, i) => new TextRun({ text: l, break: i > 0 ? 1 : 0, bold: isBold, size: 22 })),
                                  alignment: AlignmentType.JUSTIFIED,
                                  spacing: { after: 240 }
                              });
                          }),
                          new Paragraph({ text: "" })
                      );
                      isFirstAfterForside = false; // reset
                  }
              });
          });

          const doc = new Document({
              sections
          });

          const blob = await Packer.toBlob(doc);
          const fileName = mode === 'shared' ? `Shared_Portfolio_${new Date().toISOString().split('T')[0]}.docx` : `Private_Portfolio_${new Date().toISOString().split('T')[0]}.docx`;
          saveAs(blob, fileName);
          toast({ title: "Portfolio eksporteret" });
      } catch (e) {
          console.error(e);
          toast({ variant: 'destructive', title: "Eksport fejlede" });
      }
  };

  const handleAnalyzeSchedule = async () => {
    if (!tasks || tasks.length === 0 || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
        const cleanTasks = tasks.map(t => ({
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            assignedToName: t.assignedToName,
            startDate: t.startDate,
            dueDate: t.dueDate,
        }));

        const cleanAvailabilities = availabilities?.map(a => ({
            id: a.id,
            username: a.username,
            slots: Object.fromEntries(
                Object.entries(a.slots).map(([key, val]) => [key, { mode: val.mode, timeframe: val.timeframe }])
            )
        }));

        const result = await analyzeTaskScheduleAction({ tasks: cleanTasks, availabilities: cleanAvailabilities as any });
        setAnalysisResult(result);
    } catch (error) {
        console.error("Analysis failed", error);
        toast({ variant: 'destructive', title: 'Analyse fejlede', description: 'Kunne ikke analysere tidsplanen.' });
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !group || !isAdmin || isSaving) return;
    
    setIsSaving(true);
    const groupDocRef = doc(firestore, 'groups', groupId);
    const updates = {
        name: editGroupData.name.trim(),
        description: editGroupData.description.trim(),
        finalDeadline: editGroupData.finalDeadline || null,
        updatedAt: serverTimestamp()
    };

    updateDoc(groupDocRef, updates)
        .then(() => {
            toast({ title: "Gruppe opdateret" });
            setIsEditingGroup(false);
        })
        .catch(async (err) => {
            console.error(err);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: groupDocRef.path,
                operation: 'update',
                requestResourceData: updates
            }));
        })
        .finally(() => setIsSaving(false));
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newMemberEmail.trim().toLowerCase();
    if (!email || isSaving || !user || !group) return;
    
    setIsSaving(true);
    try {
      const result = await addGroupMemberByEmailAction({
          groupId,
          email,
          inviterId: user.uid,
          inviterName: user.displayName || 'En kollega'
      });

      if (!result.success) {
          toast({ variant: 'destructive', title: "Fejl", description: result.message });
          return;
      }

      // Send Push Notification
      queueNotificationAction({
          title: "Ny studiegruppe!",
          body: `${user.displayName || 'En kollega'} har tilføjet dig til gruppen "${group.name}".`,
          recipientUids: [result.targetUserId!],
          sentBy: user.uid,
          targetGroup: 'individual'
      });

      // Send invitation email in the background
      sendGroupInvitationEmailAction({
          recipientEmail: email,
          inviteeName: result.targetUserName!,
          inviterName: user.displayName || 'En kollega',
          groupName: group.name,
          groupUrl: `${window.location.origin}/rum/groups/view/${groupId}?lang=${locale}`
      });

      toast({ title: "Kollega tilføjet", description: `${email} er nu en del af jeres studiegruppe.` });
      setNewMemberEmail('');
      setIsAddingMember(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: "Fejl", description: "Der skete en fejl under tilføjelse af medlem." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = (member: Member) => {
    if (!user || !firestore || !group || !isAdmin || isRemovingId) return;
    if (member.id === user.uid) {
        toast({ variant: 'destructive', title: "Handling ikke tilladt", description: "Du kan ikke fjerne dig selv som administrator." });
        return;
    }

    if (!window.confirm(`Er du sikker på, at du vil fjerne ${member.email} fra gruppen?`)) return;

    setIsRemovingId(member.id);
    const batch = writeBatch(firestore);
    
    const memberRef = doc(firestore, 'groups', groupId, 'members', member.id);
    batch.delete(memberRef);

    const parentRef = doc(firestore, 'groups', groupId);
    batch.update(parentRef, {
        memberIds: arrayRemove(member.id),
        membersCount: increment(-1)
    });

    batch.commit()
        .then(() => {
            toast({ title: "Medlem fjernet", description: "Kollegaen er ikke længere en del af gruppen." });
        })
        .catch(async (err) => {
            console.error(err);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: memberRef.path,
                operation: 'delete'
            }));
        })
        .finally(() => {
            setIsRemovingId(null);
        });
  };

  const handleUpdateNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !editingMember || !newNickname.trim() || isSaving) return;

    setIsSaving(true);
    const memberDocRef = doc(firestore, 'groups', groupId, 'members', editingMember.id);

    try {
        await updateDoc(memberDocRef, { nickname: newNickname.trim() });
        toast({ title: "Kaldenavn opdateret" });
        setEditingMember(null);
        setNewNickname('');
    } catch (error) {
        console.error("Error updating nickname: ", error);
        toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke opdatere kaldenavn." });
    } finally {
        setIsSaving(false);
    }
};

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || !firestore || isSaving) return;
    setIsSaving(true);
    
    let assignedName = '';
    if (newTask.assignedToId && members) {
        const assignedMember = members.find(m => m.id === newTask.assignedToId);
        assignedName = assignedMember?.nickname || assignedMember?.email.split('@')[0] || '';
    }

    const taskData: any = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        startDate: newTask.startDate || null,
        dueDate: newTask.dueDate || null,
        assignedToId: newTask.assignedToId || null,
        assignedToName: assignedName || null,
        priority: newTask.priority,
        subtasks: newTask.subtasks,
        updatedAt: serverTimestamp()
    };

    if (editingTask) {
        const docRef = doc(firestore, 'groups', groupId, 'tasks', editingTask.id);
        updateDoc(docRef, taskData)
            .then(() => {
                handleCancelTask();
                toast({ title: "Opgave opdateret" });
            })
            .catch(async (err) => {
                console.error(err);
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'update',
                    requestResourceData: taskData
                }));
            })
            .finally(() => setIsSaving(false));
    } else {
        const createData = { ...taskData, status: 'todo', createdAt: serverTimestamp() };
        addDoc(collection(firestore, 'groups', groupId, 'tasks'), createData)
            .then(() => {
                handleCancelTask();
                toast({ title: "Opgave tilføjet" });

                if (user && members && group) {
                    const recipientUids = members.filter(m => m.id !== user.uid).map(m => m.id);
                    if (recipientUids.length > 0) {
                        const senderName = userProfile?.username || user.displayName || 'Et medlem';
                        queueNotificationAction({
                            title: `Ny opgave i ${group.name}`,
                            body: `${senderName} har oprettet opgaven: "${newTask.title.trim()}"`,
                            recipientUids,
                            sentBy: user.uid,
                            targetGroup: 'individual'
                        }).catch(console.error);
                    }
                }
            })
            .catch(async (err) => {
                console.error(err);
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `groups/${groupId}/tasks`,
                    operation: 'create',
                    requestResourceData: createData
                }));
            })
            .finally(() => setIsSaving(false));
    }
  };

  const handleEditTask = (task: Task) => {
      setEditingTask(task);
      setNewTask({
          title: task.title,
          description: task.description || '',
          startDate: task.startDate || '',
          dueDate: task.dueDate || '',
          assignedToId: task.assignedToId || '',
          priority: task.priority || 'medium',
          subtasks: task.subtasks || [],
      });
      setIsAddingTask(true);
  };

  const handleCancelTask = () => {
      setIsAddingTask(false);
      setEditingTask(null);
      setNewTask({ title: '', description: '', startDate: '', dueDate: '', assignedToId: '', priority: 'medium', subtasks: [] });
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
      const task = tasks?.find(t => t.id === taskId);
      if (!task || !firestore) return;

      const updatedSubtasks = (task.subtasks || []).map(st => 
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );

      const docRef = doc(firestore, 'groups', groupId, 'tasks', taskId);
      updateDoc(docRef, { subtasks: updatedSubtasks });
  };

  const handleImportTasks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !firestore || !user) return;
    const file = e.target.files[0];
    setIsImportingTasks(true);

    try {
        const text = await extractTextFromPdf(file);
        const result = await extractTasksFromTextAction({ text });
        
        if (result.tasks && result.tasks.length > 0) {
            const batch = writeBatch(firestore);
            const tasksCol = collection(firestore, 'groups', groupId, 'tasks');
            
            result.tasks.forEach(t => {
                const newDocRef = doc(tasksCol);
                batch.set(newDocRef, {
                    title: t.title,
                    description: t.description || '',
                    dueDate: t.dueDate || null,
                    status: 'todo',
                    priority: 'medium',
                    subtasks: [],
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            });

            await batch.commit();
            toast({ title: "Opgaver importeret", description: `${result.tasks.length} opgaver er blevet tilføjet fra dit dokument.` });

            if (user && members && group) {
                const recipientUids = members.filter(m => m.id !== user.uid).map(m => m.id);
                if (recipientUids.length > 0) {
                    const senderName = userProfile?.username || user.displayName || 'Et medlem';
                    queueNotificationAction({
                        title: `Nye opgaver i ${group.name}`,
                        body: `${senderName} har importeret ${result.tasks.length} nye opgaver.`,
                        recipientUids,
                        sentBy: user.uid,
                        targetGroup: 'individual'
                    }).catch(console.error);
                }
            }
        } else {
            toast({ variant: 'destructive', title: "Ingen opgaver fundet", description: "Vi kunne ikke identificere nogen opgaver i dokumentet." });
        }
    } catch (err) {
        console.error('Task import error:', err);
        toast({ variant: "destructive", title: "Fejl ved analyse", description: "Prøv venligst igen med en anden fil eller kontakt support." });
    } finally {
        setIsImportingTasks(false);
        if (e.target) e.target.value = ''; // Reset input
    }
  };

  const handleImportRegulations = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !firestore || !user) return;
    const file = e.target.files[0];
    setIsImportingPortfolio(true);

    try {
        const text = await extractTextFromPdf(file);
        const result = await processExamRegulationsAction({ text });

        if (result.sections && result.sections.length > 0) {
            const portfolioCol = collection(firestore, 'groups', groupId, 'portfolio');
            const batch = writeBatch(firestore);

            // ALWAYS create a Title Page (Forside) when importing structure
            const baseDate = new Date().toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US');
            const memberText = members ? members.map(m => m.nickname || m.email.split('@')[0]).join('<br>') : '';
            const vejledere = contacts ? contacts.filter((c: any) => c.title && c.title.toLowerCase().includes('vejleder')) : [];
            const contactText = vejledere.length > 0 ? vejledere.map((c: any) => `${c.title}: ${c.name}`).join('<br>') : '';
            
            const titlePageContent = `
                <h1 style="text-align: center; font-size: 3em;">${group?.name || 'Projekt'}</h1>
                <p style="text-align: center;"><br></p>
                ${memberText ? `<p style="text-align: center;"><strong>Udarbejdet af:</strong></p><p style="text-align: center;">${memberText}</p><p style="text-align: center;"><br></p>` : ''}
                ${contactText ? `<p style="text-align: center;"><strong>Kontakter:</strong></p><p style="text-align: center;">${contactText}</p><p style="text-align: center;"><br></p>` : ''}
                <p style="text-align: center;"><strong>Afleveringsdato:</strong> ${baseDate}</p>
                <p style="text-align: center;"><br></p>
            `;

            const forsideRef = doc(portfolioCol);
            batch.set(forsideRef, {
                title: 'Forside',
                content: titlePageContent,
                status: 'final',
                linkedEvidenceIds: [],
                isPrivate: portfolioView === 'private',
                assignment: 'Opgavens forside',
                characterLimit: '',
                order: -1, 
                addedById: user.uid,
                addedByName: userProfile?.username || user.displayName || 'Anonym',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            result.sections
                .filter(s => !s.title.toLowerCase().includes('forside') && s.title.toLowerCase().trim() !== 'forside')
                .forEach((s, index) => {
                const newDocRef = doc(portfolioCol);
                batch.set(newDocRef, {
                    title: s.title,
                    content: '',
                    status: 'draft',
                    linkedEvidenceIds: [],
                    isPrivate: portfolioView === 'private',
                    assignment: s.assignment,
                    characterLimit: s.characterLimit || '',
                    order: index,
                    addedById: user.uid,
                    addedByName: userProfile?.username || user.displayName || 'Anonym',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            });

            await batch.commit();
            toast({ 
                title: locale === 'da' ? "Portfolio-struktur oprettet!" : "Portfolio structure created!",
                description: locale === 'da' ? `Vi har oprettet ${result.sections.length} afsnit ud fra prøvebestemmelserne.` : `Created ${result.sections.length} sections from the regulations.`
            });
        } else {
            toast({ 
                variant: 'destructive',
                title: locale === 'da' ? "Ingen struktur fundet" : "No structure found",
                description: locale === 'da' ? "Vi kunne ikke udtrække en klar struktur fra dokumentet." : "Could not identify a clear structure in the document."
            });
        }
    } catch (err) {
        console.error('Portfolio import error:', err);
        toast({ variant: "destructive", title: locale === 'da' ? "Fejl ved analyse" : "Analysis error", description: "Prøv venligst igen med en anden fil eller kontakt support." });
    } finally {
        setIsImportingPortfolio(false);
        if (e.target) e.target.value = '';
    }
  };

  const handleDownloadFile = async (item: Evidence) => {
      if (!storage || !item.storagePath) {
          // Fallback if legacy item or storage not init
          if (item.fileUrl) window.open(item.fileUrl, '_blank');
          return;
      }

      toast({ title: "Henter fil...", description: "Verificerer din adgang..." });
      
      try {
          const storageRef = ref(storage, item.storagePath);
          const blob = await getBlob(storageRef);

          // Track view if not already tracked (or simple history)
          if (firestore && user && userProfile && !item.viewedBy?.some(v => v.userId === user.uid)) {
              const viewerData = {
                  userId: user.uid,
                  userName: (userProfile as any).nickname || userProfile.username || user.displayName || user.email?.split('@')[0] || 'Bruger',
                  viewedAt: new Date().toISOString()
              };
              updateDoc(doc(firestore, `groups/${groupId}/evidence`, item.id), {
                  viewedBy: arrayUnion(viewerData)
              }).catch(e => console.error("Tracking error:", e));
          }

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = item.fileName || 'dokument';
          // For images/PDFs we might want to just open in new tab
          if (item.fileName?.toLowerCase().endsWith('.pdf') || item.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/i)) {
              window.open(url, '_blank');
          } else {
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
          }
          // Note: Object URL remains valid until document is closed or manually revoked
      } catch (err) {
          console.error('Secure download error:', err);
          toast({ variant: "destructive", title: "Adgang nægtet", description: "Du har ikke rettigheder til at se dette dokument." });
      }
  };

  const handleRenameEvidence = async (id: string) => {
      if (!editingEvidenceTitle.trim() || !firestore) return;
      try {
          await updateDoc(doc(firestore, `groups/${groupId}/evidence`, id), {
              title: editingEvidenceTitle.trim()
          });
          toast({ title: locale === 'da' ? "Omdøbt" : "Renamed", description: locale === 'da' ? "Dokumentet blev omdøbt." : "The document was renamed." });
      } catch (e) {
          toast({ title: locale === 'da' ? "Fejl" : "Error", description: locale === 'da' ? "Kunne ikke omdøbe dokumentet." : "Could not rename document.", variant: "destructive" });
      }
      setEditingEvidenceId(null);
  };

  const handleExtractEvidenceText = async (item: Evidence) => {
      let text = item.description || item.title || "";
      if (item.fileUrl || item.storagePath) {
          try {
              let blob;
              if (storage && item.storagePath) {
                  const storageRef = ref(storage, item.storagePath);
                  blob = await getBlob(storageRef);
              } else {
                  const response = await fetch(item.fileUrl || '');
                  blob = await response.blob();
              }
              const file = new File([blob], item.fileName || "doc.pdf", { type: "application/pdf" });
              const pdfText = await extractTextFromPdf(file);
              if (pdfText) text += "\n\n" + pdfText;
          } catch(e) { console.error("Could not read individual PDF in multi-chat", e); }
      }
      return text;
  };

  const handleOpenChat = async (items: Evidence[]) => {
    setChattingEvidence(items);
    if (items.length === 1 && items[0].chatHistory) {
         setChatMessages(items[0].chatHistory);
    } else {
         setChatMessages([]);
    }
    setChatInput('');
    setExtractedChatDocuments([]);
    setIsExtractingChatText(true);

    try {
        const extDocs: {title: string, content: string}[] = [];
        for (const item of items) {
             const text = await handleExtractEvidenceText(item);
             extDocs.push({ title: item.title, content: text });
        }
        setExtractedChatDocuments(extDocs);
    } catch (e) {
        toast({ title: locale === 'da' ? "Kunne ikke læse filer" : "Could not read the files", variant: "destructive" });
    } finally {
        setIsExtractingChatText(false);
    }
  };

  const handleCreateSeminarFromEvidence = async (items: Evidence[]) => {
    if (!items || items.length === 0 || !group || !firestore) return;

    setIsAnalyzingPortfolio(true);
    try {
        // Prepare evidence for AI flow
        const evidenceToAnalyze = await Promise.all(items.map(async (item) => ({
            id: item.id,
            title: item.title,
            type: item.type,
            content: await handleExtractEvidenceText(item),
            tags: item.tags || [],
            fileName: item.fileName
        })));

        const result = await organizeEvidenceIntoSeminarAction({
            evidenceItems: evidenceToAnalyze,
            groupName: group.name,
            learningGoals: group.description,
            numSections: 5,
            locale
        });

        // Create portfolio entries from AI output
        if (result.data && result.data.sections) {
            const batch = writeBatch(firestore);
            const portfolioRef = collection(firestore, `groups/${groupId}/portfolio`);
            
            // Create Forside (cover page)
            const forsideId = doc(portfolioRef).id;
            batch.set(doc(portfolioRef, forsideId), {
                id: forsideId,
                title: result.data.forsideTitel,
                content: result.data.forsideDescription,
                status: 'draft',
                linkedEvidenceIds: items.map(e => e.id),
                addedById: user?.uid,
                addedByName: userProfile?.username || user?.displayName || 'Bruger',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                order: 0,
                isPrivate: false
            });

            // Create sections
            result.data.sections.forEach((section, idx) => {
                const sectionId = doc(portfolioRef).id;
                const linkedIds = section.suggestedEvidenceIndices
                    .map(i => evidenceToAnalyze[i]?.id)
                    .filter(Boolean) || [];
                
                batch.set(doc(portfolioRef, sectionId), {
                    id: sectionId,
                    title: section.title,
                    content: `${section.startingSentence}\n\n${section.description}`,
                    status: 'draft',
                    linkedEvidenceIds: linkedIds,
                    addedById: user?.uid,
                    addedByName: userProfile?.username || user?.displayName || 'Bruger',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    order: idx + 1,
                    isPrivate: false,
                    metadata: {
                        learningObjectives: section.learningObjectives,
                        conceptsToExplore: section.conceptsToExplore
                    }
                });
            });

            await batch.commit();
            
            // Clear selection and show success
            setSelectedEvidenceIds([]);
            setActiveTab('portfolio');
            toast({
                title: locale === 'da' ? "Seminar oprettet!" : "Seminar created!",
                description: locale === 'da' ? `Vi har oprettet ${result.data.sections.length} sektioner baseret på jeres empiri.` : `Created ${result.data.sections.length} sections from your evidence.`
            });
        }
    } catch (err) {
        console.error('Seminar creation error:', err);
        toast({
            variant: "destructive",
            title: locale === 'da' ? "Fejl ved organisering" : "Organization error",
            description: locale === 'da' ? "Prøv venligst igen med færre filer eller mindre tekst." : "Try again with fewer files or less text."
        });
    } finally {
        setIsAnalyzingPortfolio(false);
    }
  };

  const handleSendChat = async (e?: React.FormEvent, overrideMsg?: string) => {
      if (e) e.preventDefault();
      const userMsg = overrideMsg || chatInput.trim();
      if (!userMsg || !chattingEvidence || extractedChatDocuments.length === 0) return;

      const newMessages = [...chatMessages, { role: "user", content: userMsg }];
      setChatMessages(newMessages);
      setChatInput('');
      setIsSendingChat(true);

      try {
          const res = await chatWithEvidenceContentAction({
              documents: extractedChatDocuments,
              question: userMsg,
              chatHistory: chatMessages,
          });
          if (res.data) {
              const updatedMessages = [...newMessages, { role: "assistant", content: res.data.answer }];
              setChatMessages(updatedMessages);

              if (firestore && chattingEvidence.length === 1) {
                  try {
                      await updateDoc(doc(firestore, `groups/${groupId}/evidence`, chattingEvidence[0].id), {
                          chatHistory: updatedMessages
                      });
                  } catch (e) {
                      console.error("Could not save chat history to database:", e);
                  }
              }
          }
      } catch (err) {
          console.error("Chat error:", err);
          toast({ title: locale === 'da' ? "Fejl ved chat" : "Chat error", variant: "destructive" });
      } finally {
          setIsSendingChat(false);
      }
  };

  const handleAddEvidence = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newEvidence.title.trim() || !firestore || !user || !userProfile || isSaving) return;
      setIsSaving(true);
      
      const saveEvidence = async (fileUrl?: string, fileName?: string, fileSize?: number, storagePath?: string) => {
          // AI TAGS
          let tags: string[] = [];
          try {
              const tagRes = await generateEvidenceTagsAction({
                  title: newEvidence.title.trim(),
                  description: newEvidence.description.trim(),
                  type: newEvidence.type,
                  fileName: fileName || null
              });
              tags = tagRes.tags || [];
          } catch (e) {
              console.error("AI Tags error:", e);
          }

          // AI APA Metadata
          let apaRef: Evidence['apaRef'] = undefined;
          if (newEvidence.file) {
              try {
                  let text = '';
                  if (newEvidence.file.type === 'application/pdf') {
                      text = await extractTextFromPdf(newEvidence.file);
                  } else if (newEvidence.file.type.startsWith('text/')) {
                      text = await newEvidence.file.text();
                  }

                  if (text) {
                      const res = await extractApaMetadataAction({
                          fileName: newEvidence.file.name,
                          fileContent: text
                      });
                      apaRef = res.data;
                  }
              } catch (e) {
                  console.error("APA Metadata extraction error:", e);
              }
          }

          const evidenceData: any = {
              title: newEvidence.title.trim(),
              description: newEvidence.description.trim(),
              type: newEvidence.type,
              url: newEvidence.url.trim() || null,
              fileUrl: fileUrl || null,
              fileName: fileName || null,
              fileSize: fileSize || null,
              storagePath: storagePath || null,
              addedById: user.uid,
              addedByName: userProfile.username || user.displayName || 'Anonym',
              createdAt: serverTimestamp(),
              tags
          };
          if (apaRef !== undefined) evidenceData.apaRef = apaRef;

          addDoc(collection(firestore, 'groups', groupId, 'evidence'), evidenceData)
              .then(() => {
                  setNewEvidence({ title: '', description: '', type: 'interview', url: '', file: null });
                  setIsAddingEvidence(false);
                  toast({ title: "Empiri tilføjet" });

                  if (user && members && group) {
                    const recipientUids = members.filter(m => m.id !== user.uid).map(m => m.id);
                    if (recipientUids.length > 0) {
                      const senderName = userProfile?.username || user.displayName || 'Et medlem';
                      queueNotificationAction({
                          title: `Ny empiri i ${group.name}`,
                          body: `${senderName} har tilføjet "${newEvidence.title.trim()}" til gruppen.`,
                          recipientUids,
                          sentBy: user.uid,
                          targetGroup: 'individual'
                      }).catch(console.error);
                    }
                  }
              })
              .catch(async (err) => {
                  console.error(err);
                  errorEmitter.emit('permission-error', new FirestorePermissionError({
                      path: `groups/${groupId}/evidence`,
                      operation: 'create',
                      requestResourceData: evidenceData
                  }));
              })
              .finally(() => {
                  setIsSaving(false);
              });
      };

      if (newEvidence.file && storage) {
          const file = newEvidence.file;
          const storagePath = `groups/${groupId}/evidence/${Date.now()}_${file.name}`;
          const storageRef = ref(storage, storagePath);
          uploadBytes(storageRef, file).then(async (snapshot) => {
              // VIKTIGT: Vi undgår bevidst getDownloadURL for at sikre at filen KUN kan tilgås via SDK (låst af regler)
              saveEvidence(undefined, file.name, file.size, storagePath);
          }).catch(err => {
              console.error('File upload error:', err);
              toast({ variant: "destructive", title: "Fejl ved upload af fil", description: "Prøv venligst igen senere." });
              setIsSaving(false);
          });
      } else {
          saveEvidence();
      }
  };

  const handleSaveApaRef = async (id: string, apaRef: ApaReference) => {
    if (!firestore) return;
    try {
        await updateDoc(doc(firestore, 'groups', groupId, 'evidence', id), {
            apaRef: apaRef
        });
        toast({ title: "APA reference opdateret" });
        setIsEditingApa(false);
        setEditingApaItem(null);
    } catch (e) {
        console.error("Error updating APA reference:", e);
        toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke opdatere APA referencen." });
    }
  };

  const handleAddContact = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newContact.name.trim() || !firestore || !user || !userProfile || isSaving) return;
      setIsSaving(true);

      const contactData = {
          ...newContact,
          addedById: user.uid,
          addedByName: userProfile.username || user.displayName || 'Anonym',
          createdAt: serverTimestamp()
      };

      addDoc(collection(firestore, 'groups', groupId, 'contacts'), contactData)
          .then(() => {
              setNewContact({ name: '', title: '', organization: '', email: '', phone: '', notes: '', });
              setIsAddingContact(false);
              toast({ title: "Kontakt tilføjet" });

              if (user && members && group) {
                const recipientUids = members.filter(m => m.id !== user.uid).map(m => m.id);
                if (recipientUids.length > 0) {
                  const senderName = userProfile?.username || user.displayName || 'Et medlem';
                  queueNotificationAction({
                      title: `Ny kontakt i ${group.name}`,
                      body: `${senderName} har tilføjet ${newContact.name.trim()} til projektets kontaktbog.`,
                      recipientUids,
                      sentBy: user.uid,
                      targetGroup: 'individual'
                  }).catch(console.error);
                }
              }
          })
          .catch(async (err) => {
              console.error(err);
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                  path: `groups/${groupId}/contacts`,
                  operation: 'create',
                  requestResourceData: contactData
              }));
          })
          .finally(() => setIsSaving(false));
  };

  const handleMovePortfolioEntry = async (currentIndex: number, direction: 'up' | 'down', entries: PortfolioEntry[]) => {
      if (!firestore) return;
      
      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= entries.length) return;

      const currentEntry = entries[currentIndex];
      const swapEntry = entries[swapIndex];

      const batch = writeBatch(firestore);
      const currentCol = doc(firestore, 'groups', groupId, 'portfolio', currentEntry.id);
      const swapCol = doc(firestore, 'groups', groupId, 'portfolio', swapEntry.id);

      const currentOrder = currentEntry.order ?? currentIndex;
      const swapOrder = swapEntry.order ?? swapIndex;

      batch.update(currentCol, { order: swapOrder });
      batch.update(swapCol, { order: currentOrder });

      try {
          await batch.commit();
      } catch (e) {
          toast({ title: locale === 'da' ? "Fejl" : "Error", description: locale === 'da' ? "Kunne ikke ændre rækkefølgen." : "Could not move section.", variant: "destructive" });
      }
  };

  const handleDeleteContact = (id: string) => {
      if (!firestore || !window.confirm('Vil du slette denne kontakt?')) return;
      const docRef = doc(firestore, 'groups', groupId, 'contacts', id);
      deleteDoc(docRef).then(() => toast({ title: "Kontakt slettet" }));
  };

  const handleDropLink = async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (activeTab !== 'evidence') return;
      
      const { files } = e.dataTransfer;
      if (files && files.length > 0) {
          if (!user || !firestore || !userProfile || !storage) return;
          
          for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const storagePath = `groups/${groupId}/evidence/${Date.now()}_${file.name}`;
              const storageRef = ref(storage, storagePath);
              
              toast({ title: `Uploader ${i + 1} af ${files.length}`, description: `Arbejder på: ${file.name}...` });

              try {
                  const snapshot = await uploadBytes(storageRef, file);
                  // VIKTIGT: Vi undgår bevidst getDownloadURL for at sikre at filen KUN kan tilgås via SDK (låst af regler)
                  // AI TAGS
                  let tags: string[] = [];
                  try {
                      const tagRes = await generateEvidenceTagsAction({
                          title: file.name,
                          description: 'Automatisk gemt via drag-and-drop.',
                          type: 'document',
                          fileName: file.name
                      });
                      tags = tagRes.tags || [];
                  } catch (e) {
                      console.error("AI Tags error:", e);
                  }

                  // AI APA Metadata
                  let apaRef: Evidence['apaRef'] = undefined;
                  try {
                      let text = '';
                      if (file.type === 'application/pdf') {
                          text = await extractTextFromPdf(file);
                      } else if (file.type.startsWith('text/')) {
                          text = await file.text();
                      }

                      if (text) {
                          const res = await extractApaMetadataAction({
                              fileName: file.name,
                              fileContent: text
                          });
                          apaRef = res.data;
                      }
                  } catch (e) {
                      console.error("APA Metadata extraction error:", e);
                  }

                  const evidenceData: any = {
                      title: file.name,
                      description: 'Automatisk gemt via drag-and-drop.',
                      type: 'document' as Evidence['type'],
                      url: null,
                      fileUrl: null,
                      fileName: file.name,
                      fileSize: file.size,
                      storagePath: storagePath,
                      addedById: user.uid,
                      addedByName: userProfile.username || user.displayName || 'Anonym',
                      createdAt: serverTimestamp(),
                      tags
                  };
                  if (apaRef !== undefined) evidenceData.apaRef = apaRef;

                  await addDoc(collection(firestore, 'groups', groupId, 'evidence'), evidenceData);
              } catch (err) {
                  console.error('Error uploading dropped file:', err);
                  toast({ variant: "destructive", title: `Fejl ved upload af ${file.name}` });
              }
          }

          if (user && members && group) {
              const recipientUids = members.filter(m => m.id !== user.uid).map(m => m.id);
              if (recipientUids.length > 0) {
                  const senderName = userProfile?.username || user.displayName || 'Et medlem';
                  const title = files.length > 1 ? `Nye dokumenter i ${group.name}` : `Nyt dokument i ${group.name}`;
                  const body = files.length > 1 
                      ? `${senderName} har uploadet ${files.length} dokumenter til projektet.`
                      : `${senderName} har uploadet "${files[0].name}" til projektet.`;
                  
                  queueNotificationAction({
                      title,
                      body,
                      recipientUids,
                      sentBy: user.uid,
                      targetGroup: 'individual'
                  }).catch(console.error);
              }
          }

          toast({ title: files.length > 1 ? "Alle filer uploade!" : "Fil uploade!", description: `${files.length} dokument(er) er nu gemt i jeres arkiv.` });
          return;
      }

      const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
      
      if (url && url.startsWith('http')) {
          if (!user || !firestore || !userProfile) return;
          
          // AI TAGS
          let tags: string[] = [];
          try {
              const tagRes = await generateEvidenceTagsAction({
                  title: 'Link: ' + new URL(url).hostname,
                  description: 'Link gemt via drag-and-drop.',
                  type: 'document'
              });
              tags = tagRes.tags || [];
          } catch (e) {
              console.error("AI Tags error:", e);
          }

          const evidenceData = {
              title: 'Link: ' + new URL(url).hostname,
              description: 'Automatisk gemt via drag-and-drop.',
              type: 'document' as Evidence['type'],
              url: url,
              addedById: user.uid,
              addedByName: userProfile.username || user.displayName || 'Anonym',
              createdAt: serverTimestamp(),
              tags
          };

          addDoc(collection(firestore, 'groups', groupId, 'evidence'), evidenceData)
              .then(() => {
                  toast({ title: "Link gemt i arkivet" });

                  if (user && members && group) {
                      const recipientUids = members.filter(m => m.id !== user.uid).map(m => m.id);
                      if (recipientUids.length > 0) {
                          const senderName = userProfile?.username || user.displayName || 'Et medlem';
                          queueNotificationAction({
                              title: `Nyt link i ${group.name}`,
                              body: `${senderName} har delt et link i arkivet: "${new URL(url).hostname}"`,
                              recipientUids,
                              sentBy: user.uid,
                              targetGroup: 'individual'
                          }).catch(console.error);
                      }
                  }
              })
              .catch(async (err) => {
                  console.error(err);
                  errorEmitter.emit('permission-error', new FirestorePermissionError({
                      path: `groups/${groupId}/evidence`,
                      operation: 'create',
                      requestResourceData: evidenceData
                  }));
              });
      }
  };

  const handleSavePortfolioEntry = async (e?: React.FormEvent, silent = false) => {
    if (e) e.preventDefault();
    if (!newPortfolioEntry.title.trim() || !firestore || (isSaving && !silent) || (isAutoSaving && silent) || !user) return;
    
    if (silent) setIsAutoSaving(true);
    else setIsSaving(true);
    
    const entryData = {
        title: newPortfolioEntry.title.trim(),
        content: newPortfolioEntry.content.trim(),
        status: newPortfolioEntry.status,
        linkedEvidenceIds: newPortfolioEntry.linkedEvidenceIds,
        isPrivate: newPortfolioEntry.isPrivate,
        characterLimit: newPortfolioEntry.characterLimit,
        order: newPortfolioEntry.order,
        addedById: user.uid,
        addedByName: userProfile?.username || user.displayName || 'Anonym',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    if (editingPortfolioEntry) {
        const docRef = doc(firestore, 'groups', groupId, 'portfolio', editingPortfolioEntry.id);
        updateDoc(docRef, {
            title: newPortfolioEntry.title.trim(),
            content: newPortfolioEntry.content.trim(),
            status: newPortfolioEntry.status,
            linkedEvidenceIds: newPortfolioEntry.linkedEvidenceIds,
            isPrivate: newPortfolioEntry.isPrivate,
            assignment: newPortfolioEntry.assignment.trim() || '',
            characterLimit: newPortfolioEntry.characterLimit,
            order: newPortfolioEntry.order,
            updatedAt: serverTimestamp()
        })
            .then(() => {
                setLastSaved(new Date());
                if (!silent) {
                    setIsAddingPortfolioEntry(false);
                    setEditingPortfolioEntry(null);
                    toast({ title: locale === 'da' ? "Afsnit opdateret" : "Section updated" });
                }
            })
            .finally(() => {
                setIsSaving(false);
                setIsAutoSaving(false);
            });
    } else {
        const portfolioCol = collection(firestore, 'groups', groupId, 'portfolio');
        addDoc(portfolioCol, entryData)
            .then((docRef) => {
                setLastSaved(new Date());
                // Set editing mode to the new doc so subseqent auto-saves update it
                setEditingPortfolioEntry({ id: docRef.id, ...entryData } as unknown as PortfolioEntry);
                if (!silent) {
                    setIsAddingPortfolioEntry(false);
                    toast({ title: locale === 'da' ? "Afsnit oprettet" : "Section created" });
                }
            })
            .finally(() => {
                setIsSaving(false);
                setIsAutoSaving(false);
            });
    }
  };

  const handleDeletePortfolioEntry = async (id: string) => {
      if (!firestore || !window.confirm('Vil du slette denne del af jeres portfolio permanent?')) return;
      try {
          await deleteDoc(doc(firestore, 'groups', groupId, 'portfolio', id));
          toast({ title: "Del slettet" });
      } catch (e) {
          console.error(e);
          toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke slette portfolio-delen." });
      }
  };

  const handleDeleteEvidence = async (id: string) => {
      const item = evidence?.find(e => e.id === id);
      if (!firestore || !window.confirm('Er du sikker på, at du vil slette denne empiri permanent?')) return;
      
      const proceedWithDeletion = async () => {
          const docRef = doc(firestore, 'groups', groupId, 'evidence', id);
          deleteDoc(docRef)
              .then(() => {
                  toast({ title: "Empiri slettet fra arkivet" });
              })
              .catch(async (err) => {
                  console.error(err);
                  errorEmitter.emit('permission-error', new FirestorePermissionError({
                      path: docRef.path,
                      operation: 'delete'
                  }));
              });
      };

      if (item?.storagePath && storage) {
          const storageRef = ref(storage, item.storagePath);
          deleteObject(storageRef)
              .then(() => proceedWithDeletion())
              .catch((err) => {
                  console.error('Storage deletion error:', err);
                  // Slet stadig dokumentet i databasen selv hvis filen ikke findes i storage
                  proceedWithDeletion();
              });
      } else {
          proceedWithDeletion();
      }
  };

  const handleCycleStatus = (taskId: string, currentStatus: Task['status']) => {
    if (!firestore) return;
    
    let nextStatus: Task['status'] = 'todo';
    if (currentStatus === 'todo') nextStatus = 'in-progress';
    else if (currentStatus === 'in-progress') nextStatus = 'done';
    else nextStatus = 'todo';

    const docRef = doc(firestore, 'groups', groupId, 'tasks', taskId);
    updateDoc(docRef, { status: nextStatus })
        .catch(async (err) => {
            console.error(err);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: { status: nextStatus }
            }));
        });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!firestore || !window.confirm('Slet opgave?')) return;
    const docRef = doc(firestore, 'groups', groupId, 'tasks', taskId);
    deleteDoc(docRef)
        .catch(async (err) => {
            console.error(err);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete'
            }));
        });
  };

  const handleOpenSlotEditor = (dayId: string, slotId: string) => {
    if (!user) return;
    const userAvail = availabilities?.find(a => a.id === user.uid);
    const slotData = userAvail?.slots?.[`${dayId}-${slotId}`];
    
    setEditingSlot({ dayId, slotId });
    
    let from = '';
    let to = '';
    if (slotData?.timeframe && slotData.timeframe.includes('-')) {
        const parts = slotData.timeframe.split('-').map(p => p.trim());
        from = parts[0] || '';
        to = parts[1] || '';
    }

    setSlotFormData({ 
        mode: slotData?.mode || null, 
        from,
        to
    });
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !firestore || !userProfile || !editingSlot) return;
      
      setIsSaving(true);
      const userAvail = availabilities?.find(a => a.id === user.uid);
      const currentSlots = userAvail?.slots || {};
      const key = `${editingSlot.dayId}-${editingSlot.slotId}`;
      
      const timeframe = (slotFormData.from && slotFormData.to) ? `${slotFormData.from} - ${slotFormData.to}` : '';

      const newSlots = { 
          ...currentSlots, 
          [key]: { 
              mode: slotFormData.mode, 
              timeframe: timeframe || undefined 
          } 
      };

      const availRef = doc(firestore, 'groups', groupId, 'availability', user.uid);
      const myMemberData = members?.find(m => m.id === user.uid);
      const username = myMemberData?.nickname || userProfile.username || user.displayName || 'Anonym';
      
      try {
          await setDoc(availRef, {
              username: username,
              slots: newSlots,
              icalUrl: icalUrlInput.trim(),
              updatedAt: serverTimestamp()
          }, { merge: true });
          
          toast({ title: "Tilgængelighed opdateret" });
          setEditingSlot(null);
      } catch (err: any) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: availRef.path,
              operation: 'write',
              requestResourceData: { slots: newSlots }
          }));
      } finally {
          setIsSaving(false);
      }
  };

  const handleSyncIcal = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!user || !firestore || !userProfile || !icalUrlInput.trim()) return;

      setIsSyncing(true);
      try {
          setIsSyncing(true);
          const { slots, busyEvents } = await syncCalendarAvailability(icalUrlInput.trim(), { start: syncRange.start, end: syncRange.end });
          const availRef = doc(firestore, 'groups', groupId, 'availability', user.uid);
          await setDoc(availRef, {
              id: user.uid,
              username: user.displayName || user.email?.split('@')[0] || 'Unavngivet',
              slots: slots,
              busyEvents: busyEvents,
              updatedAt: serverTimestamp(),
              icalUrl: icalUrlInput.trim()
          }, { merge: true });
          
          toast({ title: "Kalender synkroniseret", description: "Dine ledige tider er blevet opdateret automatisk." });
          setShowIcalInput(false);
      } catch (err: any) {
          console.error(err);
          toast({ variant: 'destructive', title: "Synkronisering fejlede", description: "Kunne ikke hente eller tolke din kalender." });
      } finally {
          setIsSyncing(false);
      }
  };

  useEffect(() => {
      const myAvail = availabilities?.find(a => a.id === user?.uid);
      if (myAvail?.icalUrl) {
          setIcalUrlInput(myAvail.icalUrl);
      }
  }, [availabilities, user]);

  const ganttData = useMemo(() => {
      if (!tasks) return null;
      const tasksWithDates = tasks.filter(t => t.dueDate);
      
      const allBusyEvents: { start: Date; end: Date; title: string; memberName: string; type: 'calendar' }[] = [];
      availabilities?.forEach(avail => {
          avail.busyEvents?.forEach(event => {
              allBusyEvents.push({
                  start: new Date(event.start),
                  end: new Date(event.end),
                  title: event.title,
                  memberName: avail.username,
                  type: 'calendar'
              });
          });
      });

      const earliestStart = Math.min(
          ...tasks.map(t => {
              if (t.startDate) return new Date(t.startDate).getTime();
              return t.createdAt?.toDate?.()?.getTime() || Date.now();
          }),
          ...allBusyEvents.map(e => e.start.getTime())
      );
      
      const latestEnd = Math.max(
          ...tasksWithDates.map(t => new Date(t.dueDate!).getTime()),
          ...allBusyEvents.map(e => e.end.getTime()),
          Date.now()
      );

      const start = new Date(earliestStart);
      const end = new Date(latestEnd);
      
      // Ensure range is at least a week
      if (end.getTime() - start.getTime() < 7 * 24 * 60 * 60 * 1000) {
          end.setDate(start.getDate() + 14);
      } else {
          end.setDate(end.getDate() + 3); // add some padding
      }

      const days: Date[] = [];
      const curr = new Date(start);
      curr.setHours(0,0,0,0);
      while (curr <= end) {
          days.push(new Date(curr));
          curr.setDate(curr.getDate() + 1);
      }

      return { tasks: tasksWithDates.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()), calendarEvents: allBusyEvents, days, start, end };
  }, [tasks, availabilities]);

  const deadlineInfo = useMemo(() => {
      if (!group?.finalDeadline) return null;
      const dl = new Date(group.finalDeadline);
      const today = new Date();
      today.setHours(0,0,0,0);
      const diffTime = dl.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { date: dl, daysLeft: diffDays };
  }, [group?.finalDeadline]);

  if (isUserLoading || groupLoading || membersLoading) return <AuthLoadingScreen />;
  if (!group) return <div className="p-20 text-center">Gruppen blev ikke fundet.</div>;

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] flex flex-col lg:flex-row text-slate-900 selection:bg-amber-100 overflow-x-hidden pt-0 sm:pt-0">
      
      {/* MOBILE SIDEBAR OVERLAY */}
      <AnimatePresence>
        {showMobileSidebar && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
                    onClick={() => setShowMobileSidebar(false)}
                />
                <motion.aside 
                    initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[70] shadow-2xl lg:hidden flex flex-col pt-8"
                >
                    <div className="px-6 flex items-center justify-between mb-8">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black">C</div>
                        <button onClick={() => setShowMobileSidebar(false)} className="p-2 text-slate-400"><X className="w-6 h-6" /></button>
                    </div>
                    {/* Reuse Sidebar Nav Logic or separate component */}
                    <nav className="flex-1 space-y-2 px-4">
                        {[
                            { id: 'tasks', label: currentT.tasks, icon: ClipboardList, count: tasks?.length },
                            { id: 'timeline', label: currentT.timeline, icon: GanttChart },
                            { id: 'evidence', label: currentT.evidence, icon: FileSearch, count: evidence?.length },
                            { id: 'contacts', label: currentT.contacts, icon: Contact, count: contacts?.length },
                            { id: 'availability', label: currentT.availability, icon: CalendarCheck },
                            { id: 'members', label: currentT.members, icon: Users, count: members?.length },
                        ].map((item) => (
                            <button 
                                key={item.id}
                                onClick={() => { setActiveTab(item.id as any); setShowMobileSidebar(false); }} 
                                className={`w-full text-left px-5 py-4 rounded-2xl text-[14px] font-black transition-all flex items-center justify-between group active:scale-[0.98] ${
                                    activeTab === item.id 
                                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                        activeTab === item.id 
                                        ? 'bg-white/10 text-white' 
                                        : 'bg-slate-50 text-slate-400'
                                    }`}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <span className="tracking-tight">{item.label}</span>
                                </div>
                            </button>
                        ))}
                    </nav>
                </motion.aside>
            </>
        )}
      </AnimatePresence>
      
      {/* SIDEBAR NAVIGATION - Premium Slate Look */}
      <aside className="w-full lg:w-80 bg-white border-r border-slate-100 flex flex-col h-screen z-30 shadow-sm shrink-0">
        <div className="p-8 flex items-center gap-4 border-b border-slate-50">
            <button 
              onClick={() => router.push(`/rum/groups?lang=${locale}`)} 
              className="w-12 h-12 bg-slate-50 text-slate-900 rounded-[18px] flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shrink-0 active:scale-90"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
                <h1 className="text-lg font-black text-slate-900 leading-tight tracking-tight truncate">{group.name}</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{currentT.studyGroup}</p>
            </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <nav className="p-4 space-y-2 overflow-y-auto custom-scrollbar flex-1">
                {[
                    { id: 'tasks', label: currentT.tasks, icon: CheckSquare, count: tasks?.length },
                    { id: 'portfolio', label: locale === 'da' ? 'Portfolio' : 'Portfolio', icon: BookOpen, count: portfolio?.length },
                    { id: 'timeline', label: currentT.timeline, icon: GanttChart },
                    { id: 'evidence', label: currentT.evidence, icon: FileSearch, count: evidence?.length },
                    { id: 'contacts', label: currentT.contacts, icon: Contact, count: contacts?.length },
                    { id: 'availability', label: currentT.availability, icon: CalendarCheck },
                    { id: 'members', label: currentT.members, icon: Users, count: members?.length },
                ].map((item) => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)} 
                        className={`w-full text-left px-5 py-4 rounded-2xl text-[14px] font-black transition-all flex items-center justify-between group relative overflow-hidden active:scale-[0.98] transition-all ${
                            activeTab === item.id 
                            ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/10' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        <div className="flex items-center gap-3 relative z-10">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                activeTab === item.id 
                                ? 'bg-white/10 text-white' 
                                : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:shadow-sm'
                            }`}>
                                <item.icon className="w-4 h-4" />
                            </div>
                            <span className="tracking-tight">{item.label}</span>
                        </div>
                        {item.count !== undefined && (
                            <span className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-lg relative z-10 transition-all ${
                                activeTab === item.id 
                                ? 'bg-white/10 text-white' 
                                : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                            }`}>
                                {item.count}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            <div className="mt-auto p-6 border-t border-slate-50 bg-slate-50/20">
                {deadlineInfo && (
                    <div className="mb-8 p-6 bg-white rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-12 h-12 bg-rose-50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-2 mb-3">
                            <Flag className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{currentT.deadline}</span>
                        </div>
                        <p className="text-base font-black text-slate-900 tracking-tight">{deadlineInfo.date.toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US', { day: 'numeric', month: 'long' })}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <div className={`w-2 h-2 rounded-full ${deadlineInfo.daysLeft < 7 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                            <p className="text-[11px] font-bold text-slate-500">
                                {deadlineInfo.daysLeft > 0 ? `${deadlineInfo.daysLeft} ${currentT.daysLeft}` : deadlineInfo.daysLeft === 0 ? currentT.deadlineToday : currentT.deadlinePassed}
                            </p>
                        </div>
                    </div>
                )}
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100"><Info className="w-5 h-5 text-slate-400" /></div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{currentT.groupInfo}</h4>
                    </div>
                    {isAdmin && (
                        <button 
                            onClick={() => {
                                setEditGroupData({ 
                                    name: group.name, 
                                    description: group.description,
                                    finalDeadline: group.finalDeadline || ''
                                });
                                setIsEditingGroup(true);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-900 transition-all hover:bg-white rounded-lg"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <p className="text-[12px] text-slate-500 font-medium leading-relaxed px-2 line-clamp-3">{group.description || currentT.noDescription}</p>
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#FDFBF7]">
        <header className="h-24 bg-white/70 backdrop-blur-2xl border-b border-slate-100 px-8 flex items-center justify-between shrink-0 shadow-sm z-40 sticky top-0">
            <div className="flex items-center gap-6">
                <div className="lg:hidden">
                    <button onClick={() => setShowMobileSidebar(true)} className="p-3 bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 group transition-all"><Menu className="w-5 h-5" /></button>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        {activeTab === 'tasks' ? currentT.tasks : 
                         activeTab === 'timeline' ? currentT.timeline : 
                         activeTab === 'members' ? currentT.members : 
                         activeTab === 'evidence' ? currentT.evidence : 
                         activeTab === 'contacts' ? currentT.contacts :
                         currentT.availability}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mt-1">{group.name}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {activeTab === 'timeline' && (
                    <Button onClick={handleAnalyzeSchedule} disabled={isAnalyzing || !ganttData} size="lg" className="rounded-2xl h-12 px-6 shadow-xl shadow-slate-900/10 font-black uppercase tracking-widest text-[11px] bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3">
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4 text-amber-400"/>}
                        {currentT.analyzeTimeline}
                    </Button>
                )}
                {activeTab === 'availability' && (
                     <Button onClick={() => setShowIcalInput(!showIcalInput)} variant="outline" size="lg" className="rounded-2xl h-12 px-6 border-slate-200 font-black uppercase tracking-widest text-[11px] text-slate-900 hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2">
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {icalUrlInput ? currentT.updateCalendar : currentT.syncCalendar}
                    </Button>
                )}
                {activeTab === 'evidence' && (
                    <Button onClick={() => setIsAddingEvidence(true)} size="lg" className="rounded-2xl h-12 px-6 shadow-xl shadow-slate-900/10 font-black uppercase tracking-widest text-[11px] bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-2">
                        <Plus className="w-4 h-4 text-amber-400"/> {currentT.addManual}
                    </Button>
                )}
                {activeTab === 'contacts' && (
                    <Button onClick={() => setIsAddingContact(true)} size="lg" className="rounded-2xl h-12 px-6 shadow-xl shadow-slate-900/10 font-black uppercase tracking-widest text-[11px] bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-2">
                        <Plus className="w-4 h-4 text-amber-400"/> {currentT.newContact}
                    </Button>
                )}
                {activeTab === 'tasks' && (
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-100 shadow-inner">
                            <button onClick={() => setTaskViewMode('list')} className={`p-2 px-3.5 rounded-[14px] transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${taskViewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><ListIcon className="w-4 h-4" /> <span className="hidden xl:inline">Liste</span></button>
                            <button onClick={() => setTaskViewMode('scrum')} className={`p-2 px-3.5 rounded-[14px] transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${taskViewMode === 'scrum' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><LayoutGrid className="w-4 h-4" /> <span className="hidden xl:inline">Scrum</span></button>
                        </div>
                        <label className="cursor-pointer group">
                            <div className="px-6 h-12 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 group-hover:bg-slate-50 group-hover:border-slate-900 transition-all shadow-sm">
                                {isImportingTasks ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileUp className="w-4 h-4 text-amber-600" />}
                                {isImportingTasks ? 'Analyserer...' : currentT.importPdf}
                            </div>
                            <input type="file" className="sr-only" accept=".pdf" onChange={handleImportTasks} disabled={isImportingTasks} />
                        </label>
                        <Button onClick={() => setIsAddingTask(true)} size="lg" className="rounded-2xl h-12 px-6 shadow-xl shadow-slate-900/10 font-black uppercase tracking-widest text-[11px] bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-2">
                            <Plus className="w-4 h-4 text-amber-400"/> {currentT.newTask}
                        </Button>
                    </div>
                )}
                {activeTab === 'portfolio' && (
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-100 shadow-inner h-12 items-center">
                            <button 
                                onClick={() => setPortfolioView('shared')}
                                className={`px-4 h-full rounded-[14px] text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    portfolioView === 'shared' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                <Users className="w-3.5 h-3.5" /> {locale === 'da' ? 'Fælles' : 'Shared'}
                            </button>
                            <button 
                                onClick={() => setPortfolioView('private')}
                                className={`px-4 h-full rounded-[14px] text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    portfolioView === 'private' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                <UserIcon className="w-3.5 h-3.5" /> {locale === 'da' ? 'Privat' : 'Private'}
                            </button>
                        </div>

                        <label className="cursor-pointer group">
                            <div className="px-4 h-12 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group-hover:bg-slate-50 group-hover:border-slate-900 transition-all shadow-sm">
                                {isImportingPortfolio ? <Loader2 className="w-4 h-4 animate-spin"/> : <ScrollText className="w-4 h-4 text-amber-600" />}
                                {isImportingPortfolio ? (locale === 'da' ? 'Analyserer...' : 'Analyzing...') : (locale === 'da' ? 'Importér PDF' : 'Import PDF')}
                            </div>
                            <input type="file" className="sr-only" accept=".pdf" onChange={handleImportRegulations} disabled={isImportingPortfolio} />
                        </label>

                        <div className="h-8 w-px bg-slate-100 mx-1 hidden sm:block" />

                        <Button 
                            onClick={() => handleExportPortfolioAsDocx(portfolioView === 'shared' ? 'shared' : 'private')}
                            variant="outline"
                            className="h-12 px-4 border-slate-200 text-slate-900 hover:bg-slate-50 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
                        >
                            <Download className="w-4 h-4 text-indigo-600" />
                        </Button>

                        <Button 
                            onClick={() => {
                                setNewPortfolioEntry({
                                    title: '',
                                    content: '',
                                    status: 'draft',
                                    linkedEvidenceIds: [],
                                    isPrivate: portfolioView === 'private',
                                    assignment: '',
                                    characterLimit: '',
                                    order: 0
                                });
                                setEditingPortfolioEntry(null);
                                setIsAddingPortfolioEntry(true);
                            }} 
                            size="lg" 
                            className="h-12 px-6 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl flex items-center justify-center gap-2 group/btn shadow-xl shadow-slate-900/10 text-[11px] font-black tracking-widest uppercase border-none transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4 text-amber-400 group-hover/btn:rotate-90 transition-transform" /> 
                            {locale === 'da' ? 'Nyt afsnit' : 'New section'}
                        </Button>
                    </div>
                )}
                {activeTab === 'members' && (
                    <Button onClick={() => setIsAddingMember(true)} size="lg" className="rounded-2xl h-12 px-6 shadow-xl shadow-slate-900/10 font-black uppercase tracking-widest text-[11px] bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-amber-400"/> {currentT.inviteColleague}
                    </Button>
                )}
            </div>
        </header>

        <div 
            className={`flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar transition-colors ${isDragging ? 'bg-amber-50/50 ring-4 ring-inset ring-amber-400/20' : ''}`}
            onDragOver={(e) => { e.preventDefault(); if(activeTab === 'evidence') setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDropLink}
        >
            <AnimatePresence mode="wait">
                {activeTab === 'portfolio' && (
                    <motion.div 
                        key="portfolio" 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -20 }} 
                        className="max-w-6xl mx-auto space-y-12"
                    >
                        {/* PORTFOLIO OVERVIEW & TOGGLE */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 px-10 py-8 bg-white rounded-[40px] border border-slate-100 shadow-sm group hover:shadow-2xl transition-all duration-700">
                            <div className="flex flex-col sm:flex-row items-center gap-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-slate-900 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-slate-900/20 group-hover:rotate-6 transition-transform">
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">{locale === 'da' ? 'Portfolio' : 'Portfolio'}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{portfolio?.length || 0} {locale === 'da' ? 'AKTIVE AFSNIT' : 'ACTIVE SECTIONS'}</p>
                                    </div>
                                </div>
                                <div className="hidden lg:block w-px h-12 bg-slate-100" />
                                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner">
                                    <button 
                                        onClick={() => setPortfolioView('shared')}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                            portfolioView === 'shared' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        <Users className="w-4 h-4" /> {locale === 'da' ? 'Fælles' : 'Shared'}
                                    </button>
                                    <button 
                                        onClick={() => setPortfolioView('private')}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                            portfolioView === 'private' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        <UserIcon className="w-4 h-4" /> {locale === 'da' ? 'Privat' : 'Private'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex flex-col items-end gap-2 pr-6 border-r border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{locale === 'da' ? 'Samlet Progression' : 'Total Progress'}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="h-1.5 w-32 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round(Math.min(100, (portfolio?.filter(p => p.status === 'final').length || 0) / (portfolio?.length || 1) * 100))}%` }} className="h-full bg-emerald-500" />
                                        </div>
                                        <span className="text-[12px] font-black text-emerald-600">{Math.round(Math.min(100, (portfolio?.filter(p => p.status === 'final').length || 0) / (portfolio?.length || 1) * 100))}%</span>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => handleExportPortfolioAsDocx(portfolioView === 'shared' ? 'shared' : 'private')}
                                    variant="outline"
                                    className="h-14 px-6 border-slate-100 text-slate-900 hover:bg-slate-50 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-sm flex items-center gap-2 group/dl"
                                >
                                    <Download className="w-4 h-4 text-indigo-600 group-hover/dl:translate-y-0.5 transition-transform" /> {locale === 'da' ? 'HENT DOCX' : 'GET DOCX'}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-16">
                            {(portfolioView === 'shared' ? Object.entries(groupedShared) : Object.entries(groupedPrivate)).length > 0 ? (
                                (portfolioView === 'shared' ? Object.entries(groupedShared) : Object.entries(groupedPrivate)).map(([assignmentName, entries]) => (
                                    <div key={assignmentName} className="space-y-10">
                                        <div className="flex items-center gap-6">
                                            <div className="h-px bg-slate-200/50 flex-grow"></div>
                                            <div className="px-6 py-2 bg-slate-50 rounded-full border border-slate-100 shadow-inner">
                                                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                    <Flag className="w-4 h-4" /> {assignmentName}
                                                </h5>
                                            </div>
                                            <div className="h-px bg-slate-200/50 flex-grow"></div>
                                        </div>
                                        <div className="grid gap-8">
                                            {entries.map((entry, index) => (
                                                <PortfolioCard 
                                                    key={entry.id} 
                                                    entry={entry} 
                                                    onMoveUp={index > 0 ? () => handleMovePortfolioEntry(index, 'up', entries) : undefined}
                                                    onMoveDown={index < entries.length - 1 ? () => handleMovePortfolioEntry(index, 'down', entries) : undefined}
                                                    onEdit={() => { 
                                                        setEditingPortfolioEntry(entry); 
                                                        setNewPortfolioEntry({
                                                            title: entry.title,
                                                            content: entry.content || '',
                                                            status: entry.status,
                                                            linkedEvidenceIds: entry.linkedEvidenceIds || [],
                                                            isPrivate: entry.isPrivate ?? false,
                                                            assignment: entry.assignment || '',
                                                            characterLimit: entry.characterLimit || '',
                                                            order: entry.order ?? 0
                                                        });
                                                        setIsAddingPortfolioEntry(true);
                                                    }} 
                                                    onDelete={() => handleDeletePortfolioEntry(entry.id)}
                                                    evidence={evidence}
                                                    locale={locale}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div key="empty-portfolio-state" className="py-32 text-center bg-white rounded-[48px] border border-slate-100 shadow-sm transition-all hover:shadow-2xl group relative overflow-hidden">
                                     <div className="absolute inset-0 bg-slate-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                     <div className="relative z-10">
                                        <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all duration-700 shadow-inner">
                                            <BookOpen className="w-12 h-12" />
                                        </div>
                                        <h5 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                                            {portfolioView === 'shared' ? (locale === 'da' ? 'Ingen fælles afsnit' : 'No shared sections') : (locale === 'da' ? 'Ingen private noter' : 'No private notes')}
                                        </h5>
                                        <p className="text-slate-400 text-[15px] font-medium mb-12 max-w-sm mx-auto leading-relaxed">
                                            {portfolioView === 'shared' ? (locale === 'da' ? 'Start jeres fælles rejse ved at oprette det første afsnit eller importér en PDF.' : 'Start your shared journey by creating the first section or import a PDF.') : (locale === 'da' ? 'Her gemmes dine personlige noter og kladder.' : 'Your personal notes and drafts will be saved here.')}
                                        </p>
                                        <Button onClick={() => {
                                            setNewPortfolioEntry({
                                                title: '',
                                                content: '',
                                                status: 'draft',
                                                linkedEvidenceIds: [],
                                                isPrivate: portfolioView === 'private',
                                                assignment: '',
                                                characterLimit: '',
                                                order: portfolio?.length || 0
                                            });
                                            setIsAddingPortfolioEntry(true);
                                        }} className="h-16 px-10 bg-slate-900 text-white hover:bg-black rounded-2xl font-black uppercase tracking-widest text-[12px] shadow-2xl transition-all active:scale-95 border-none">
                                            {locale === 'da' ? 'OPRET FØRSTE DEL' : 'CREATE FIRST PART'}
                                        </Button>
                                     </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'tasks' && (
                    <motion.div key="tasks" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto space-y-12">
                        
                        {/* PROJECT INSIGHTS DASHBOARD - Premium Modernized */}
                        {projectStats && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    whileHover={{ y: -5, shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)' }}
                                    className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm group transition-all relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-all">
                                        <TrendingUp className="w-24 h-24" />
                                    </div>
                                    <p className="text-[11px] font-black uppercase text-slate-400 mb-4 tracking-[0.2em] relative z-10">{locale === 'da' ? 'Fremdrift' : 'Progress'}</p>
                                    <div className="flex items-center justify-between relative z-10">
                                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{projectStats.progress}%</span>
                                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:rotate-6 transition-transform">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="w-full h-2 bg-slate-50 rounded-full mt-6 overflow-hidden relative z-10 border border-slate-100/50">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${projectStats.progress}%` }} 
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" 
                                        />
                                    </div>
                                </motion.div>

                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    transition={{ delay: 0.1 }}
                                    whileHover={{ y: -5, shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)' }}
                                    className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm group transition-all relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-all">
                                        <ClipboardList className="w-24 h-24" />
                                    </div>
                                    <p className="text-[11px] font-black uppercase text-slate-400 mb-4 tracking-[0.2em] relative z-10">{locale === 'da' ? 'Udestående' : 'Pending'}</p>
                                    <div className="flex items-center justify-between relative z-10">
                                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{projectStats.total - projectStats.done}</span>
                                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-400 shadow-xl group-hover:rotate-6 transition-transform">
                                            <ClipboardList className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 relative z-10">
                                        <div className="flex -space-x-1.5 overflow-hidden">
                                            {members?.slice(0, 3).map((m, i) => (
                                                <div key={m.id} className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[8px] font-black text-slate-400 uppercase">{m.email[0]}</div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{projectStats.inProgress} {locale === 'da' ? 'I GANG' : 'IN PROGRESS'}</p>
                                    </div>
                                </motion.div>

                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    transition={{ delay: 0.2 }}
                                    whileHover={{ y: -5, shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)' }}
                                    className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm group transition-all relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-all">
                                        <AlertCircle className="w-24 h-24" />
                                    </div>
                                    <p className="text-[11px] font-black uppercase text-slate-400 mb-4 tracking-[0.2em] relative z-10">{locale === 'da' ? 'Risiko' : 'Risk'}</p>
                                    <div className="flex items-center justify-between relative z-10">
                                        <span className={`text-4xl font-black tracking-tighter ${projectStats.overdue > 0 ? 'text-rose-500' : 'text-slate-900'}`}>{projectStats.overdue}</span>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${projectStats.overdue > 0 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-200'}`}>
                                            <AlertCircle className={`w-6 h-6 ${projectStats.overdue > 0 ? 'animate-pulse' : ''}`} />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-4 font-black uppercase tracking-widest relative z-10">{locale === 'da' ? 'FORSINKET' : 'OVERDUE'}</p>
                                </motion.div>

                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    transition={{ delay: 0.3 }}
                                    whileHover={{ y: -5, shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)' }}
                                    className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-xl group transition-all relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-50"></div>
                                    <p className="text-[11px] font-black uppercase text-slate-400 mb-4 tracking-[0.2em] relative z-10">{locale === 'da' ? 'Tidligst færdig' : 'Earliest Finish'}</p>
                                    <div className="flex items-center justify-between relative z-10">
                                        <span className="text-xl font-black text-white tracking-tight">{deadlineInfo?.daysLeft !== undefined ? `${deadlineInfo.daysLeft} ${currentT.daysLeft}` : 'N/A'}</span>
                                        <div className="w-12 h-12 bg-white/10 text-amber-400 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-xl group-hover:-rotate-6 transition-transform">
                                            <Target className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 relative z-10">
                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-0.5">{locale === 'da' ? 'Fælles deadline' : 'Joint deadline'}</p>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {isAddingTask && (
                            <form onSubmit={handleSaveTask} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8 max-w-2xl mx-auto">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-900 rounded-[14px] flex items-center justify-center text-white shadow-lg">
                                            <Pencil className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{editingTask ? 'Rediger Opgave' : 'Ny Opgave'}</h3>
                                    </div>
                                    <button type="button" onClick={handleCancelTask} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"><X className="w-5 h-5"/></button>
                                </div>
                                <div className="space-y-6">
                                    <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Opgavens titel</label><Input autoFocus value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="F.eks. Læs kapitel 4 i Socialret..." required className="h-16 px-6 bg-slate-50 border-transparent rounded-[20px] text-[15px] font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner" /></div>
                                    <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Uddybende beskrivelse (valgfri)</label><Textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="Noter om opgaven..." className="p-6 bg-slate-50 border-transparent rounded-[24px] text-[14px] font-medium min-h-[140px] focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner" /></div>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Start dato</label><div className="relative"><CalendarDays className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input type="date" value={newTask.startDate} onChange={e => setNewTask({...newTask, startDate: e.target.value})} className="h-14 pl-12 rounded-[20px] bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner font-bold" /></div></div>
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Deadline</label><div className="relative"><CalendarDays className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="h-14 pl-12 rounded-[20px] bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner font-bold" /></div></div>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Ansvarlig</label>
                                            <div className="relative"><UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><select value={newTask.assignedToId} onChange={e => setNewTask({...newTask, assignedToId: e.target.value})} className="w-full h-14 pl-12 pr-4 bg-slate-50 border-transparent rounded-[20px] text-[14px] appearance-none focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all font-black text-slate-900 shadow-inner"><option value="">Ingen tildelt</option>{members?.map(m => <option key={m.id} value={m.id}>{m.nickname || m.email.split('@')[0]}</option>)}</select></div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Prioritering</label>
                                            <div className="relative"><Zap className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as any})} className="w-full h-14 pl-12 pr-4 bg-slate-50 border-transparent rounded-[20px] text-[14px] appearance-none focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all font-black text-slate-900 shadow-inner"><option value="low">Lav</option><option value="medium">Middel</option><option value="high">Høj</option></select></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
                                    <Button type="button" variant="ghost" onClick={handleCancelTask} className="order-2 sm:order-1 h-14 rounded-[20px] font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 px-8">Afbryd</Button>
                                    <Button type="submit" className="order-1 sm:order-2 flex-1 h-14 rounded-[20px] bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-900/10 active:scale-95 transition-all" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : (editingTask ? 'Opdater Opgave' : 'Opret Opgave')}</Button>
                                </div>
                            </form>
                        )}

                        {taskViewMode === 'list' ? (
                            <div className="grid gap-4">
                                {tasks?.map(task => {
                                    const isExpanded = expandedTaskId === task.id;
                                    const subtaskCount = task.subtasks?.length || 0;
                                    const subtaskCompleted = task.subtasks?.filter(s => s.completed).length || 0;
                                    
                                    return (
                                            <motion.div 
                                                key={task.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`bg-white rounded-[32px] border transition-all overflow-hidden shadow-sm ${task.status === 'done' ? 'opacity-60 bg-slate-50/50' : 'border-slate-100 hover:border-slate-900 hover:shadow-2xl hover:shadow-slate-200/50'}`}
                                            >
                                                <div className="p-6 md:p-8 flex items-center justify-between cursor-pointer group" onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}>
                                                    <div className="flex items-center gap-6 flex-1 min-w-0">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleCycleStatus(task.id, task.status); }} 
                                                            className={`w-12 h-12 rounded-[18px] border-2 flex items-center justify-center transition-all shrink-0 active:scale-90 ${
                                                                task.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
                                                                task.status === 'in-progress' ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20' : 
                                                                'border-slate-200 bg-white hover:border-slate-900 hover:text-slate-900 text-transparent'
                                                            }`}
                                                        >
                                                            {task.status === 'done' ? <CheckCircle2 className="w-7 h-7" /> : task.status === 'in-progress' ? <PlayCircle className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
                                                        </button>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                                                                    task.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                                    task.status === 'in-progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                                                                    'bg-slate-50 text-slate-400 border-slate-100'
                                                                }`}>
                                                                    {task.status === 'done' ? (locale === 'da' ? 'Færdig' : 'Done') : 
                                                                     task.status === 'in-progress' ? (locale === 'da' ? 'I gang' : 'Active') : 
                                                                     (locale === 'da' ? 'To-do' : 'To-do')}
                                                                </span>
                                                                {task.priority === 'high' && <span className="text-[9px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 flex items-center gap-1.5"><Zap className="w-3 h-3 fill-current" /> KRITISK</span>}
                                                                {task.dueDate && <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100"><Calendar className="w-3.5 h-3.5" /> {new Date(task.dueDate).toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US')}</span>}
                                                            </div>
                                                            <h4 className={`text-[17px] font-black text-slate-900 truncate tracking-tight transition-all ${task.status === 'done' ? 'line-through text-slate-400 opacity-70' : ''}`}>{task.title}</h4>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {subtaskCount > 0 && (
                                                            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
                                                                <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-600">
                                                                    {Math.round((subtaskCompleted / subtaskCount) * 100)}%
                                                                </div>
                                                                <span className="text-[11px] font-black text-slate-600">{subtaskCompleted}/{subtaskCount}</span>
                                                            </div>
                                                        )}
                                                        {task.assignedToName && (
                                                            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-amber-50 rounded-xl border border-amber-200/50">
                                                                <div className="w-5 h-5 bg-amber-200 text-amber-900 rounded-lg flex items-center justify-center text-[10px] font-black uppercase shadow-sm">{task.assignedToName.charAt(0)}</div>
                                                                <span className="text-[11px] font-black text-amber-900 tracking-tight">{task.assignedToName}</span>
                                                            </div>
                                                        )}
                                                        <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-300 group-hover:text-slate-900'}`}>
                                                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }} className="overflow-hidden bg-slate-50/50 border-t border-slate-100">
                                                            <div className="p-8 md:p-10 space-y-10">
                                                                {task.description && (
                                                                    <div className="space-y-4">
                                                                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Beskrivelse</h5>
                                                                        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm italic text-[15px] font-medium text-slate-600 leading-relaxed min-h-[100px] flex items-center">
                                                                            "{task.description}"
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                
                                                                {subtaskCount > 0 && (
                                                                    <div className="space-y-4">
                                                                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Underopgaver</h5>
                                                                        <div className="grid gap-3">
                                                                            {task.subtasks?.map(st => (
                                                                                <button 
                                                                                    key={st.id} 
                                                                                    onClick={() => handleToggleSubtask(task.id, st.id)} 
                                                                                    className="flex items-center gap-4 text-left group/st w-full bg-white p-4 rounded-[20px] transition-all border border-slate-100 hover:border-slate-900 hover:shadow-lg active:scale-[0.99]"
                                                                                >
                                                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${st.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-100 group-hover/st:border-slate-900'}`}>
                                                                                        {st.completed && <CheckCircle2 className="w-4 h-4" />}
                                                                                    </div>
                                                                                    <span className={`text-[15px] font-bold ${st.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>{st.text}</span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="flex flex-wrap items-center justify-between gap-6 pt-10 border-t border-slate-200/50">
                                                                    <div className="flex gap-3">
                                                                        <Button onClick={() => handleCycleStatus(task.id, task.status)} variant="outline" size="sm" className="h-11 rounded-xl px-5 border-slate-200 font-bold hover:bg-slate-50 transition-colors">
                                                                            <RefreshCw className="w-4 h-4 mr-2" /> Næste status
                                                                        </Button>
                                                                        <Button onClick={() => handleEditTask(task)} variant="outline" size="sm" className="h-11 rounded-xl px-5 border-slate-200 text-slate-600 font-bold hover:bg-slate-50">
                                                                            <Pencil className="w-4 h-4 mr-2" /> Rediger
                                                                        </Button>
                                                                    </div>
                                                                    <Button 
                                                                        onClick={() => handleDeleteTask(task.id)} 
                                                                        variant="ghost" 
                                                                        size="sm" 
                                                                        className="h-11 rounded-xl px-5 text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-black uppercase tracking-widest text-[11px]"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 mr-2" /> Slet opgave
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                    )
                                })}
                            </div>
                        ) : (
                            /* KANBAN BOARD VIEW */
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {(['todo', 'in-progress', 'done'] as Task['status'][]).map(status => (
                                    <div key={status} className="space-y-6">
                                        <div className="flex items-center justify-between px-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {status === 'todo' ? 'To-Do' : status === 'in-progress' ? 'I gang' : 'Færdig'}
                                            </h3>
                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-900 px-2 py-0.5 rounded-full border border-slate-200">
                                                {tasks?.filter(t => t.status === status).length || 0}
                                            </span>
                                        </div>
                                        <div className="space-y-4">
                                            {tasks?.filter(t => t.status === status).map(task => (
                                                <div key={task.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-slate-900 hover:shadow-xl transition-all group">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        {task.priority === 'high' && <Zap className="w-4 h-4 text-rose-500 fill-current" />}
                                                        <span className={`text-[9px] font-black uppercase tracking-tighter ${task.priority === 'high' ? 'text-rose-600' : 'text-slate-300'}`}>{task.priority}</span>
                                                    </div>
                                                    <h4 className={`text-[15px] font-bold text-slate-900 mb-4 leading-snug line-clamp-2 ${task.status === 'done' ? 'line-through text-slate-400 opacity-60' : ''}`}>{task.title}</h4>
                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-black uppercase">{task.assignedToName?.charAt(0) || '?'}{task.assignedToName?.charAt(1) || ''}</div>
                                                            {task.dueDate && <span className="text-[10px] font-bold text-slate-400">{new Date(task.dueDate).toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US', { day: 'numeric', month: 'short' })}</span>}
                                                        </div>
                                                        <button onClick={() => handleEditTask(task)} className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Pencil className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {tasks?.filter(t => t.status === status).length === 0 && (
                                                <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-300 italic text-[13px] font-medium">Ingen her</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(!tasks || tasks.length === 0) && !isAddingTask && (<div className="py-24 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm"><ClipboardList className="w-16 h-16 text-slate-200 mx-auto mb-6" /><h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Ingen opgaver endnu</h3><p className="text-[15px] font-medium text-slate-500 mb-10 max-w-sm mx-auto">Start jeres samarbejde ved at tilføje den første opgave eller importér fra et dokument.</p><div className="flex gap-4 justify-center"><Button size="lg" className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] bg-slate-900 shadow-xl shadow-slate-900/10 active:scale-95 transition-transform" onClick={() => setIsAddingTask(true)}>Opret opgave</Button></div></div>)}
                    </motion.div>
                )}

                {activeTab === 'timeline' && (
                    <motion.div key="timeline" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-6xl mx-auto">
                        {!ganttData ? (
                            <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm">
                                <GanttChart className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Ingen tidslinje tilgængelig</h3>
                                <p className="text-[15px] font-medium text-slate-500 mb-10 max-w-sm mx-auto">Tilføj deadlines til jeres opgaver for at se dem her i et Gantt-diagram.</p>
                                <Button size="lg" className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] bg-slate-900 shadow-xl shadow-slate-900/10 active:scale-95 transition-transform" onClick={() => setActiveTab('tasks')}>Gå til opgaver</Button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-900 text-amber-400 rounded-xl flex items-center justify-center shadow-lg"><Zap className="w-5 h-5" /></div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Projektets Fremdrift</h3>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-400 tracking-widest px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <span>Start: {ganttData.start.toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                        <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                        <span>Slut: {ganttData.end.toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto custom-scrollbar">
                                    <div className="min-w-[800px]">
                                        {/* Date header */}
                                        <div className="flex border-b border-slate-100">
                                            <div className="w-64 shrink-0 bg-white border-r border-slate-100 p-4 sticky left-0 z-10 text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center">Opgave</div>
                                            <div className="flex">
                                                {ganttData.days.map((day, i) => (
                                                    <div key={i} className={`w-12 shrink-0 p-4 text-center border-r border-slate-100 flex flex-col items-center justify-center ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-slate-50' : ''}`}>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">{day.toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US', { weekday: 'short' }).charAt(0)}</span>
                                                        <span className="text-[10px] font-bold text-slate-900">{day.getDate()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Task rows */}
                                        <div className="divide-y divide-slate-100">
                                            {ganttData.tasks.map((task) => {
                                                const taskStart = task.startDate ? new Date(task.startDate) : new Date(task.createdAt?.toDate?.() || Date.now());
                                                const taskDueDate = new Date(task.dueDate!);
                                                
                                                // Calculate offsets
                                                const startDiff = Math.max(0, Math.floor((taskStart.getTime() - ganttData.start.getTime()) / (1000 * 60 * 60 * 24)));
                                                const duration = Math.max(1, Math.ceil((taskDueDate.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)));
                                                
                                                return (
                                                    <div key={task.id} className="flex hover:bg-slate-50/50 transition-colors group">
                                                        <div className="w-64 shrink-0 bg-white border-r border-slate-100 p-4 sticky left-0 z-10 text-[12px] font-black tracking-tight text-slate-900 truncate flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'done' ? 'bg-emerald-500' : task.status === 'in-progress' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                                                            <span className={`truncate transition-colors ${task.status === 'done' ? 'line-through text-slate-400' : 'group-hover:text-indigo-600'}`}>{task.title}</span>
                                                        </div>
                                                        <div className="flex relative items-center py-4">
                                                            {ganttData.days.map((_, i) => (
                                                                <div key={i} className="w-12 shrink-0 h-full border-r border-slate-100/50" />
                                                            ))}
                                                            {/* The Bar */}
                                                            <motion.div 
                                                                initial={{ scaleX: 0 }}
                                                                animate={{ scaleX: 1 }}
                                                                style={{ 
                                                                    position: 'absolute', 
                                                                    left: `${startDiff * 48 + 8}px`, 
                                                                    width: `${duration * 48 - 16}px`,
                                                                    transformOrigin: 'left'
                                                                }}
                                                                className={`h-8 rounded-[12px] shadow-sm flex items-center px-3 overflow-hidden ${
                                                                    task.status === 'done' ? 'bg-emerald-500 text-white' :
                                                                    task.status === 'in-progress' ? 'bg-indigo-600 text-white' :
                                                                    'bg-slate-200 text-slate-600'
                                                                }`}
                                                            >
                                                                <span className="text-[8px] font-black uppercase tracking-widest truncate">{task.status}</span>
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center gap-8 justify-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{locale === 'da' ? 'Færdig' : 'Done'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-indigo-600" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{locale === 'da' ? 'I gang' : 'In Progress'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-slate-200" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{locale === 'da' ? 'Planlagt' : 'Planned'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'evidence' && (
                    <motion.div key="evidence" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto space-y-8">
                        {!isAddingEvidence && (<section className="bg-slate-900 p-8 sm:p-12 rounded-[40px] text-white shadow-2xl relative overflow-hidden group"><div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 group-hover:scale-110 transition-transform"><UploadCloud className="w-48 h-48" /></div><div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12"><div className="space-y-6 max-w-lg"><div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md"><Zap className="w-3.5 h-3.5 text-amber-400" /> {locale === 'da' ? 'Nyt: Multi-upload' : 'New: Multi-upload'}</div><h3 className="text-4xl font-black tracking-tighter leading-none">{locale === 'da' ? 'Træk filer eller links herind.' : 'Drag files or links here.'}</h3><p className="text-slate-400 text-[15px] font-medium">{locale === 'da' ? 'Du kan trække flere dokumenter eller links direkte ind for at gemme dem med det samme.' : 'You can drag multiple documents or links directly here to save them instantly.'}</p></div><div className="w-40 h-40 rounded-[28px] border-4 border-dashed border-white/20 flex flex-col items-center justify-center animate-pulse gap-3"><FileUp className="w-10 h-10 text-white/50" /></div></div></section>)}
                        
                        {evidence && evidence.length > 0 && (
                            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                        <UploadCloud className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{locale === 'da' ? 'Samlet lagerplads' : 'Total Storage Space'}</p>
                                        <p className="text-xl font-black text-slate-900">{formatFileSize(totalStorageUsed || 0)}</p>
                                    </div>
                                </div>
                                <div className="flex-grow max-w-md w-full">
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((totalStorageUsed / (500 * 1024 * 1024)) * 100, 100)}%` }}
                                            className="h-full bg-indigo-600"
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <p className="text-[9px] font-bold text-slate-400">{locale === 'da' ? 'Brugt af 500 MB' : 'Used of 500 MB'}</p>
                                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{Math.round((totalStorageUsed / (500 * 1024 * 1024)) * 100)}%</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {evidence && evidence.length > 0 && !isAddingEvidence && (
                            <div className="flex items-center justify-between mb-2 px-2">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{locale === 'da' ? 'Jeres Arkiv' : 'Your Archive'}</h3>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest">{evidence.length} {locale === 'da' ? 'kilder' : 'sources'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={evidenceSearchQuery}
                                            onChange={(e) => setEvidenceSearchQuery(e.target.value)}
                                            placeholder={locale === 'da' ? 'Søg i empiri...' : 'Search evidence...'}
                                            className="h-11 pl-10 pr-4 rounded-xl text-[12px] font-medium text-slate-900 bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all w-[240px]"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                                        <button onClick={() => setEvidenceViewMode('grid')} className={`h-11 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${evidenceViewMode === 'grid' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:bg-white/50'}`}>Gallerivising</button>
                                        <button onClick={() => setEvidenceViewMode('list')} className={`h-11 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${evidenceViewMode === 'list' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:bg-white/50'}`}>Listevisning</button>
                                        <button onClick={() => setEvidenceViewMode('bib')} className={`h-11 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${evidenceViewMode === 'bib' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:bg-indigo-50/50'}`}>Litteraturliste</button>
                                    </div>
                                    <AnimatePresence>
                                        {selectedEvidenceIds.length > 0 && (
                                            <motion.div initial={{ opacity: 0, scale: 0.9, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: 20 }} className="flex items-center gap-2">
                                                <Button 
                                                    onClick={() => {
                                                        const selectedItems = evidence?.filter(e => selectedEvidenceIds.includes(e.id)) || [];
                                                        handleOpenChat(selectedItems);
                                                    }} 
                                                    className="h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg active:scale-95 transition-all flex items-center gap-2"
                                                >
                                                    <MessageSquare className="w-4 h-4" /> {locale === 'da' ? 'Snak med valgte' : 'Chat with selected'} ({selectedEvidenceIds.length})
                                                </Button>
                                                <Button 
                                                    onClick={() => {
                                                        const selectedItems = evidence?.filter(e => selectedEvidenceIds.includes(e.id)) || [];
                                                        handleCreateSeminarFromEvidence(selectedItems);
                                                    }} 
                                                    className="h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] bg-purple-500 hover:bg-purple-600 text-white shadow-lg active:scale-95 transition-all flex items-center gap-2"
                                                >
                                                    <Sparkles className="w-4 h-4" /> {locale === 'da' ? 'Organiser til seminar' : 'Organize to seminar'} 
                                                </Button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                            
                        {evidence && evidence.length > 0 && !isAddingEvidence && filteredEvidence?.length === 0 && (
                            <div className="col-span-full mb-8 pt-8 px-4 text-center flex flex-col items-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-[20px] mb-6 border border-slate-100 flex items-center justify-center">
                                    <Search className="w-8 h-8 text-slate-300" />
                                </div>
                                <h4 className="text-[24px] font-black text-slate-900 tracking-tight mb-2">
                                    {locale === 'da' ? 'Ingen resultater fundet' : 'No results found'}
                                </h4>
                                <p className="text-[15px] font-medium text-slate-500 max-w-sm">
                                    {locale === 'da' 
                                        ? `Vi kunne ikke finde noget empiri der matcher "${evidenceSearchQuery}". Prøv at søge på noget andet.`
                                        : `We couldn't find any evidence matching "${evidenceSearchQuery}". Try a different search.`}
                                </p>
                            </div>
                        )}
                        {isAddingEvidence && (
                            <form onSubmit={handleAddEvidence} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8 max-w-2xl mx-auto">
                                <div className="flex justify-between items-center"><h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{locale === 'da' ? 'Tilføj Empiri' : 'Add Evidence'}</h3><button type="button" onClick={() => setIsAddingEvidence(false)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"><X className="w-5 h-5"/></button></div>
                                <div className="space-y-6">
                                    <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Titel på data/kilde' : 'Title of data/source'}</label><Input autoFocus value={newEvidence.title} onChange={e => setNewEvidence({...newEvidence, title: e.target.value})} placeholder={locale === 'da' ? 'F.eks. Interview med socialrådgiver...' : 'E.g. Interview with social worker...'} required className="h-16 px-6 bg-slate-50 border-transparent rounded-[20px] text-[15px] font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner" /></div>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Type empiri' : 'Type of evidence'}</label><select value={newEvidence.type} onChange={e => setNewEvidence({...newEvidence, type: e.target.value as any})} className="w-full h-16 px-6 bg-slate-50 border-transparent rounded-[20px] text-[14px] appearance-none focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all font-black text-slate-900 shadow-inner"><option value="interview">{locale === 'da' ? 'Interview' : 'Interview'}</option><option value="survey">{locale === 'da' ? 'Spørgeskema' : 'Survey'}</option><option value="observation">{locale === 'da' ? 'Observation' : 'Observation'}</option><option value="document">{locale === 'da' ? 'Dokumentanalyse' : 'Document Analysis'}</option><option value="other">{locale === 'da' ? 'Andet' : 'Other'}</option></select></div>
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Link eller Fil' : 'Link or File'}</label>
                                            <div className="flex gap-2">
                                                <Input type="url" value={newEvidence.url} onChange={e => setNewEvidence({...newEvidence, url: e.target.value, file: null})} placeholder="https://..." className="h-16 px-6 bg-slate-50 border-transparent rounded-[20px] text-[15px] font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner flex-grow" />
                                                <div className="relative">
                                                    <input type="file" id="evidence-file" className="hidden" onChange={e => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setNewEvidence({...newEvidence, file, url: ''});
                                                        }
                                                    }} />
                                                    <label htmlFor="evidence-file" className={`h-16 px-6 flex items-center justify-center rounded-[20px] border-2 border-dashed transition-all cursor-pointer ${newEvidence.file ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-900 hover:text-slate-900'}`}>
                                                        <FileUp className="w-5 h-5" />
                                                    </label>
                                                </div>
                                            </div>
                                            {newEvidence.file && <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1"><Check className="w-3 h-3" /> {newEvidence.file.name}</p>}
                                        </div>
                                    </div>
                                    <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Beskrivelse/Noter' : 'Description/Notes'}</label><Textarea value={newEvidence.description} onChange={e => setNewEvidence({...newEvidence, description: e.target.value})} placeholder={locale === 'da' ? 'Hvad er de vigtigste fund?...' : 'What are the main findings?...'} className="p-6 bg-slate-50 border-transparent rounded-[24px] text-[14px] font-medium min-h-[140px] focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner" /></div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100"><Button type="button" variant="ghost" onClick={() => setIsAddingEvidence(false)} className="order-2 sm:order-1 h-14 rounded-[20px] font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 px-8">{locale === 'da' ? 'Afbryd' : 'Cancel'}</Button><Button type="submit" className="order-1 sm:order-2 flex-1 h-14 rounded-[20px] bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-900/10 active:scale-95 transition-all" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : (locale === 'da' ? 'Tilføj til arkivet' : 'Add to Archive')}</Button></div>
                            </form>
                        )}

                        {isEditingApa && editingApaItem && <ApaReferenceEditor item={editingApaItem} onSave={handleSaveApaRef} onCancel={() => { setIsEditingApa(false); setEditingApaItem(null); }} locale={locale} storage={storage} toast={toast} />}

                        {evidenceViewMode === 'bib' ? (
                            <div className="bg-indigo-50/50 p-8 sm:p-12 rounded-[40px] border border-indigo-100 flex flex-col sm:flex-row gap-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 -translate-y-10">
                                    <BookOpen className="w-64 h-64 text-indigo-900" />
                                </div>
                                
                                <div className="shrink-0 relative z-10 w-full sm:w-1/3">
                                    <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20 mb-6 border border-indigo-500">
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">{locale === 'da' ? 'Litteraturliste' : 'Bibliography'}</h4>
                                    <p className="text-[14px] text-slate-500 font-medium leading-relaxed mb-6">
                                        {locale === 'da' 
                                            ? 'Her er en automatisk genereret APA-7 litteraturliste baseret på de dokumenter du har uploadet i systemet, hvor systemet kunne genkende forfatter og årstal. Sorteret alfabetisk.'
                                            : 'Here is an auto-generated APA-7 bibliography based on the documents you uploaded, where the system identified author and year. Sorted alphabetically.'
                                        }
                                    </p>
                                    <div className="bg-white/60 backdrop-blur-md rounded-[20px] p-6 border border-white shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{locale === 'da' ? 'Statistik' : 'Stats'}</span>
                                            <span className="text-2xl font-black text-indigo-600">{(filteredEvidence || []).filter(e => e.apaRef?.authors).length}</span>
                                        </div>
                                        <p className="text-[12px] font-medium text-slate-500">{locale === 'da' ? 'kilder med APA-data klar i arkivet.' : 'sources with APA data ready in archive.'}</p>
                                    </div>
                                </div>

                                <div className="flex-grow z-10 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 relative">
                                    <div className="space-y-6">
                                        {(!filteredEvidence || filteredEvidence.filter(e => e.apaRef?.authors).length === 0) && (
                                            <div className="py-12 flex flex-col items-center justify-center text-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-[24px] mb-4 border border-slate-100 flex items-center justify-center text-slate-300">
                                                    <BookOpen className="w-8 h-8"/>
                                                </div>
                                                <p className="text-[16px] font-black tracking-tight text-slate-900 mb-2">{locale === 'da' ? 'Ingen forfatter-data fundet' : 'No author data found'}</p>
                                                <p className="text-[13px] font-medium text-slate-500 max-w-xs">{locale === 'da' ? 'Upload PDF\'er med klar forfatter/titel information, eller klik på bog-ikonet på dine andre dokumenter for at udfylde APA-data manuelt.' : 'Upload PDFs with clear author/title info, or click the book icon manually.'}</p>
                                            </div>
                                        )}
                                        
                                        {(filteredEvidence || []).filter(e => e.apaRef?.authors).sort((a,b) => (a.apaRef?.authors || '').localeCompare(b.apaRef?.authors || '')).map(item => (
                                            <div key={item.id} className="relative pl-8 before:absolute before:left-0 before:top-3 before:w-1.5 before:h-1.5 before:bg-indigo-300 before:rounded-full hover:before:bg-indigo-600 before:transition-colors transition-all py-1">
                                                <p className="text-[14px] text-slate-700 leading-relaxed max-w-2xl text-justify" style={{ textIndent: "-2em", paddingLeft: "2em" }}>
                                                    {item.apaRef?.fullAPA || `${item.apaRef?.authors} (${item.apaRef?.year}). ${item.apaRef?.title}. ${item.apaRef?.source}.`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <Button onClick={() => {
                                        const text = filteredEvidence?.filter(e => e.apaRef?.authors)
                                                .sort((a,b) => (a.apaRef?.authors || '').localeCompare(b.apaRef?.authors || ''))
                                                .map(e => e.apaRef?.fullAPA || `${e.apaRef?.authors} (${e.apaRef?.year}). ${e.apaRef?.title}. ${e.apaRef?.source}.`)
                                                .join('\n\n');
                                            if (text) {
                                                navigator.clipboard.writeText(text);
                                                toast({title: "Kopieret til udklipsholder", description: "Litteraturlisten er klar til at blive indsat i din opgave."});
                                            }
                                    }} className="mt-8 rounded-xl h-12 px-6 shadow-lg shadow-indigo-600/10 font-black uppercase tracking-widest text-[11px] bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2">
                                        <Copy className="w-4 h-4"/> Kopier komplet liste
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className={evidenceViewMode === 'grid' ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-32" : "bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden pb-32"}>
                                {evidenceViewMode === 'list' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Type</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Titel & Beskrivelse</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Tags</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Tilføjet af</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Set af</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Handlinger</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredEvidence?.map((item) => {
                                                    const TypeIcon = item.type === 'interview' ? Mic : item.type === 'survey' ? BarChart : item.type === 'observation' ? Eye : item.type === 'document' ? FileText : FileSearch;
                                                    return (
                                                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${item.fileUrl || item.storagePath ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-100 text-slate-400'}`}>
                                                                    {item.fileUrl || item.storagePath ? <FileUp className="w-5 h-5 shadow-inner" /> : <TypeIcon className="w-5 h-5" />}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col max-w-xs">
                                                                    {editingEvidenceId === item.id ? (
                                                                        <input 
                                                                            autoFocus
                                                                            value={editingEvidenceTitle}
                                                                            onChange={e => setEditingEvidenceTitle(e.target.value)}
                                                                            onBlur={() => handleRenameEvidence(item.id)}
                                                                            onKeyDown={e => {
                                                                                if (e.key === 'Enter') {
                                                                                    e.preventDefault();
                                                                                    handleRenameEvidence(item.id);
                                                                                }
                                                                                if (e.key === 'Escape') setEditingEvidenceId(null);
                                                                            }}
                                                                            className="text-sm font-black text-slate-900 w-full border-b-2 border-indigo-500 focus:outline-none bg-transparent mb-1" 
                                                                        />
                                                                    ) : (
                                                                        <span className="text-sm font-black text-slate-900 truncate leading-tight">{item.title}</span>
                                                                    )}
                                                                    <span className="text-[11px] text-slate-400 font-medium truncate italic">"{item.description}"</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex gap-1.5 flex-wrap max-w-[150px]">
                                                                    {item.tags?.slice(0, 3).map((tag, i) => (
                                                                        <span key={i} className="px-1.5 py-0.5 bg-slate-50 text-[8px] font-black text-slate-400 rounded-md border border-slate-100 uppercase tracking-tighter">#{tag}</span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center text-[7px] font-black text-white">{item.addedByName.charAt(0)}</div>
                                                                    <span className="text-[11px] font-bold text-slate-700">{item.addedByName}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex -space-x-1.5">
                                                                    {item.viewedBy?.slice(0, 3).map((v, i) => (
                                                                        <div key={i} title={v.userName} className="w-5 h-5 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[7px] font-black text-slate-500 uppercase shadow-sm">
                                                                            {v.userName.charAt(0)}
                                                                        </div>
                                                                    ))}
                                                                    {item.viewedBy && item.viewedBy.length > 3 && (
                                                                        <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[7px] font-black text-white shadow-sm">
                                                                            +{item.viewedBy.length - 3}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                                    <button onClick={() => { setEditingEvidenceId(item.id); setEditingEvidenceTitle(item.title); }} className="p-2.5 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                                                                    <button onClick={() => handleOpenChat([item])} className="p-2.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title={locale === 'da' ? 'Spørg AI' : 'Ask AI'}><MessageSquare className="w-4 h-4" /></button>
                                                                    {(item.fileUrl || item.storagePath) && (
                                                                        <button onClick={() => handleDownloadFile(item)} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><FileUp className="w-4 h-4" /></button>
                                                                    )}
                                                                    {item.url && (
                                                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><ExternalLink className="w-4 h-4" /></a>
                                                                    )}
                                                                    <button onClick={() => { setEditingApaItem(item); setIsEditingApa(true); }} className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><BookOpen className="w-4 h-4" /></button>
                                                                    <button onClick={() => handleDeleteEvidence(item.id)} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {evidenceViewMode === 'grid' && filteredEvidence?.map((item) => {
                                    const TypeIcon = item.type === 'interview' ? Mic : item.type === 'survey' ? BarChart : item.type === 'observation' ? Eye : item.type === 'document' ? FileText : FileSearch;
                                    const typeColors = { 
                                        interview: 'bg-indigo-50 text-indigo-700 border-indigo-100', 
                                        survey: 'bg-amber-50 text-amber-700 border-amber-100', 
                                        observation: 'bg-emerald-50 text-emerald-700 border-emerald-100', 
                                        document: 'bg-slate-50 text-slate-900 border-slate-200', 
                                        other: 'bg-rose-50 text-rose-700 border-rose-100' 
                                    };
                                    return (
                                        <motion.div 
                                            key={item.id} 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`p-10 rounded-[40px] border shadow-sm flex flex-col group hover:shadow-2xl transition-all relative overflow-hidden h-full ${item.fileUrl || item.storagePath ? 'bg-indigo-50/30 border-indigo-100 hover:shadow-indigo-200/50' : 'bg-white border-slate-100 hover:shadow-slate-200/50'}`}
                                        >
                                            {(item.fileUrl || item.storagePath) && (
                                                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg z-20">
                                                    Dokument gemt
                                                </div>
                                            )}
                                            <div className="relative z-10 flex flex-col h-full pt-4">
                                                <div className="flex justify-between items-start mb-8">
                                                    <div className="flex gap-3">
                                                        <div 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (selectedEvidenceIds.includes(item.id)) {
                                                                    setSelectedEvidenceIds(selectedEvidenceIds.filter(id => id !== item.id));
                                                                } else {
                                                                    setSelectedEvidenceIds([...selectedEvidenceIds, item.id]);
                                                                }
                                                            }}
                                                            className={`w-6 h-6 rounded-md border-2 cursor-pointer flex items-center justify-center transition-all ${selectedEvidenceIds.includes(item.id) ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'border-slate-200 text-transparent hover:border-emerald-300'}`}
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border ${item.fileUrl || item.storagePath ? 'bg-indigo-600 text-white border-indigo-500' : typeColors[item.type]}`}>
                                                            {item.fileUrl || item.storagePath ? <FileUp className="w-6 h-6" /> : <TypeIcon className="w-6 h-6" />}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeleteEvidence(item.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                                <div className="flex-grow space-y-3">
                                                    {editingEvidenceId === item.id ? (
                                                        <input 
                                                            autoFocus
                                                            value={editingEvidenceTitle}
                                                            onChange={e => setEditingEvidenceTitle(e.target.value)}
                                                            onBlur={() => handleRenameEvidence(item.id)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleRenameEvidence(item.id);
                                                                }
                                                                if (e.key === 'Escape') setEditingEvidenceId(null);
                                                            }}
                                                            className="text-[20px] font-black text-slate-900 tracking-tight leading-tight w-full border-b-2 border-indigo-500 focus:outline-none bg-transparent" 
                                                        />
                                                    ) : (
                                                        <h4 className="text-[20px] font-black text-slate-900 tracking-tight leading-tight">{item.title}</h4>
                                                    )}
                                                    <p className="text-[14px] text-slate-500 font-medium leading-[1.6] line-clamp-4">"{item.description}"</p>
                                                    {item.viewedBy && item.viewedBy.length > 0 && (
                                                        <div className="flex items-center gap-2 mt-4">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Set af:</span>
                                                            <div className="flex -space-x-2">
                                                                {item.viewedBy.map((v, i) => (
                                                                    <div key={i} title={`${v.userName} (${new Date(v.viewedAt).toLocaleString(locale === 'da' ? 'da-DK' : 'en-US')})`} className="w-6 h-6 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-[7px] font-black text-slate-500 uppercase hover:z-10 transition-transform hover:scale-110">
                                                                        {v.userName.charAt(0)}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {item.tags && item.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-4">
                                                            {item.tags.map((tag, i) => (
                                                                <span key={i} className="px-2.5 py-1 bg-white/50 backdrop-blur-sm border border-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="pt-8 border-t border-slate-50 flex items-center justify-between mt-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-white shadow-sm">{item.addedByName.charAt(0).toUpperCase()}</div>
                                                        <p className="text-[11px] font-bold text-slate-900">{item.addedByName}</p>
                                                    </div>
                                                        <div className="flex items-center gap-3">
                                                            <button 
                                                                onClick={() => { setEditingEvidenceId(item.id); setEditingEvidenceTitle(item.title); }}
                                                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-600 transition-colors"
                                                            >
                                                                RET <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleOpenChat([item])}
                                                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-700 transition-colors"
                                                            >
                                                                AI <MessageSquare className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => { setEditingApaItem(item); setIsEditingApa(true); }}
                                                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                                                            >
                                                                APA <RefreshCw className="w-3.5 h-3.5" />
                                                            </button>
                                                            {(item.fileUrl || item.storagePath) && (
                                                                <button 
                                                                    onClick={() => handleDownloadFile(item)}
                                                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                                                                >
                                                                    ÅBN FIL <FileUp className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                            {item.url && (
                                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">
                                                                    LINK <ExternalLink className="w-3.5 h-3.5" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Chat Modal for Evidence */}
                {chattingEvidence && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-8">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 sm:px-8 border-b border-slate-100 bg-slate-50/50 backdrop-blur-md z-10 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">AI Assistent</p>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight line-clamp-1">
                                            {chattingEvidence.length === 1 ? chattingEvidence[0].title : `${chattingEvidence.length} dokumenter valgt`}
                                        </h3>
                                    </div>
                                </div>
                                <button onClick={() => setChattingEvidence(null)} className="w-10 h-10 bg-white text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 shadow-sm transition-all"><X className="w-5 h-5"/></button>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-grow overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50 custom-scrollbar">
                                {isExtractingChatText && (
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div className="pt-2">
                                            <div className="inline-flex items-center gap-2 bg-white px-5 py-3 rounded-[24px] shadow-sm text-[13px] font-medium text-slate-600">
                                                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                                {locale === 'da' ? 'Læser valgte dokumenter...' : 'Reading selected documents...'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {!isExtractingChatText && chatMessages.length === 0 && (
                                    <div className="text-center py-12 px-4 space-y-4">
                                        <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-[24px] flex items-center justify-center mx-auto">
                                            <MessageSquare className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{locale === 'da' ? 'Hvad vil du vide?' : 'What do you want to know?'}</h4>
                                            <p className="text-slate-500 font-medium text-[15px] max-w-sm mx-auto">{locale === 'da' ? 'Spørg løs! Jeg kan hjælpe med at gennemgå indholdet eller analysere pointer fra din empiri.' : 'Ask away! I can help review the content or analyze points from your evidence.'}</p>
                                        </div>
                                    </div>
                                )}

                                {chatMessages.map((msg, i) => (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-md' : 'bg-emerald-100 border border-emerald-200 text-emerald-600'}`}>
                                            {msg.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Sparkles className="w-4 h-4" />}
                                        </div>
                                        {msg.role === 'assistant' ? (
                                            <div className="group relative max-w-[75%]">
                                                <div className="px-6 py-4 bg-white border border-slate-100 text-slate-800 rounded-[28px] rounded-tl-sm shadow-sm prose prose-sm prose-slate max-w-none prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content }} />
                                                <button 
                                                    onClick={() => {
                                                        const temp = document.createElement("div");
                                                        temp.innerHTML = msg.content;
                                                        navigator.clipboard.writeText(temp.textContent || temp.innerText || "");
                                                        toast({ title: locale === 'da' ? 'Kopieret!' : 'Copied!' });
                                                    }}
                                                    className="absolute -right-12 top-2 p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm bg-white border border-slate-100"
                                                    title={locale === 'da' ? 'Kopier tekst' : 'Copy text'}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="max-w-[75%] px-6 py-4 bg-indigo-600 text-white rounded-[28px] rounded-tr-sm shadow-md">
                                                <p className="text-[15px] font-medium leading-relaxed">{msg.content}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}

                                {isSendingChat && (
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                                            <Sparkles className="w-4 h-4 animate-pulse" />
                                        </div>
                                        <div className="pt-2">
                                            <div className="inline-flex items-center gap-2 bg-white px-5 py-3 rounded-[24px] shadow-sm text-[13px] font-medium text-slate-600">
                                                <span className="flex gap-1">
                                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-100"></div>
                                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-200"></div>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Quick Actions */}
                            {chattingEvidence && chattingEvidence.length > 1 && !isSendingChat && (
                                <div className="flex gap-2 p-4 pb-0 overflow-x-auto max-w-4xl mx-auto w-full custom-scrollbar">
                                    <button 
                                        onClick={() => handleSendChat(undefined, "På baggrund af disse dokumenter, bedes du udarbejde et fyldestgørende forslag til en akademisk problemstilling og en skarp problemformulering, der indfanger og samler de primære temaer i empirien.")}
                                        className="whitespace-nowrap px-4 py-2 bg-emerald-50 text-emerald-700 text-[13px] font-bold rounded-full border border-emerald-100 hover:bg-emerald-100 transition-colors flex items-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        {locale === 'da' ? 'Generér Problemformulering' : 'Generate Research Question'}
                                    </button>
                                </div>
                            )}

                            {/* Chat Input */}
                            <div className="p-4 sm:p-6 border-t border-slate-100 bg-white shrink-0 mt-2">
                                <form onSubmit={(e) => handleSendChat(e)} className="flex items-end gap-3 max-w-4xl mx-auto">
                                    <div className="flex-grow bg-slate-50 border border-slate-200 rounded-[28px] focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-300 transition-all p-2 flex items-center shadow-inner">
                                        <textarea
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendChat();
                                                }
                                            }}
                                            placeholder={locale === 'da' ? 'Spørg om din empiri...' : 'Ask about your evidence...'}
                                            className="w-full bg-transparent border-none focus:ring-0 text-[15px] font-medium px-4 py-3 max-h-32 min-h-[52px] resize-none"
                                            rows={1}
                                            disabled={isExtractingChatText || isSendingChat}
                                        />
                                        <Button 
                                            type="submit" 
                                            disabled={!chatInput.trim() || isExtractingChatText || isSendingChat}
                                            className="w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shrink-0 shadow-md shadow-emerald-500/20 active:scale-95 transition-all p-0 flex items-center justify-center"
                                        >
                                            <Send className="w-5 h-5 ml-0.5" />
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
                
                {activeTab === 'contacts' && (
                    <motion.div key="contacts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto space-y-8">
                        {isAddingContact && (
                            <form onSubmit={handleAddContact} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8 max-w-3xl mx-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-900 rounded-[14px] flex items-center justify-center text-white shadow-lg">
                                            <Contact className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{locale === 'da' ? 'Ny Kontakt' : 'New Contact'}</h3>
                                    </div>
                                    <button type="button" onClick={() => setIsAddingContact(false)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"><X className="w-5 h-5"/></button>
                                </div>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Navn' : 'Name'}</label><Input value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} placeholder={locale === 'da' ? 'Fulde navn...' : 'Full name...'} required className="h-16 px-6 bg-slate-50 border-transparent rounded-[20px] text-[15px] font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner" /></div>
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Titel/Rolle' : 'Title/Role'}</label><Input value={newContact.title} onChange={e => setNewContact({...newContact, title: e.target.value})} placeholder={locale === 'da' ? 'F.eks. Informant, Leder...' : 'E.g. Informant, Leader...'} className="h-16 px-6 bg-slate-50 border-transparent rounded-[20px] text-[15px] font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner" /></div>
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Organisation' : 'Organization'}</label><Input value={newContact.organization} onChange={e => setNewContact({...newContact, organization: e.target.value})} placeholder={locale === 'da' ? 'F.eks. Københavns Kommune...' : 'E.g. City of Copenhagen...'} className="h-16 px-6 bg-slate-50 border-transparent rounded-[20px] text-[15px] font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner" /></div>
                                    </div>
                                    <div className="space-y-6">
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">E-mail</label><Input type="email" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} placeholder="mail@eksempel.dk" className="h-16 px-6 bg-slate-50 border-transparent rounded-[20px] text-[15px] font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner" /></div>
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Telefon' : 'Phone'}</label><Input type="tel" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} placeholder="+45 00 00 00 00" className="h-16 px-6 bg-slate-50 border-transparent rounded-[20px] text-[15px] font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner" /></div>
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Noter' : 'Notes'}</label><Textarea value={newContact.notes} onChange={e => setNewContact({...newContact, notes: e.target.value})} placeholder={locale === 'da' ? 'Vigtige detaljer...' : 'Important details...'} className="p-6 bg-slate-50 border-transparent rounded-[24px] text-[14px] font-medium min-h-[140px] focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner" /></div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
                                    <Button type="button" variant="ghost" onClick={() => setIsAddingContact(false)} className="order-2 sm:order-1 h-14 rounded-[20px] font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 px-8">{locale === 'da' ? 'Afbryd' : 'Cancel'}</Button>
                                    <Button type="submit" className="order-1 sm:order-2 flex-1 h-14 rounded-[20px] bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-900/10 active:scale-95 transition-all" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : (locale === 'da' ? 'Gem Kontakt' : 'Save Contact')}</Button>
                                </div>
                            </form>
                        )}

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                            {contacts?.map(contact => (
                                <motion.div 
                                    key={contact.id} 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col group hover:shadow-2xl hover:shadow-slate-200/50 transition-all relative overflow-hidden h-full"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><UserIcon className="w-32 h-32 -rotate-12" /></div>
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-900 flex items-center justify-center shadow-inner border border-slate-200/40">
                                                <Contact className="w-6 h-6" />
                                            </div>
                                            <button onClick={() => handleDeleteContact(contact.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        <div className="flex-grow space-y-4">
                                            <div>
                                                <h4 className="text-[22px] font-black text-slate-900 tracking-tight leading-tight truncate">{contact.name}</h4>
                                                <p className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] mt-1">{contact.title || (locale === 'da' ? 'Kontakt' : 'Contact')}</p>
                                            </div>
                                            
                                            <div className="space-y-3.5 pt-2">
                                                {contact.organization && (<div className="flex items-center gap-3.5 text-[14px] font-medium text-slate-500"><Building className="w-4 h-4 text-slate-300 shrink-0" /> {contact.organization}</div>)}
                                                {contact.email && (
                                                    <a href={`mailto:${contact.email}`} className="flex items-center gap-3.5 text-[14px] font-bold text-slate-900 hover:text-indigo-600 transition-colors group/link">
                                                        <Mail className="w-4 h-4 text-slate-300 group-hover/link:text-indigo-400 shrink-0" /> 
                                                        {contact.email}
                                                    </a>
                                                )}
                                                {contact.phone && (
                                                    <a href={`tel:${contact.phone}`} className="flex items-center gap-3.5 text-[14px] font-bold text-slate-900 hover:text-emerald-600 transition-colors group/link">
                                                        <Phone className="w-4 h-4 text-slate-300 group-hover/link:text-emerald-400 shrink-0" /> 
                                                        {contact.phone}
                                                    </a>
                                                )}
                                            </div>
                                            {contact.notes && (
                                                <div className="pt-6 border-t border-slate-50 mt-6 min-h-[80px]">
                                                    <p className="text-[13px] text-slate-500 italic leading-relaxed font-medium">"{contact.notes}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
                    {activeTab === 'availability' && (
                    <motion.div key="availability" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-7xl mx-auto space-y-12">
                        {showIcalInput && (
                            <form onSubmit={handleSyncIcal} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner border border-indigo-100"><Calendar className="w-6 h-6" /></div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{currentT.syncCalendar}</h3>
                                    </div>
                                    <button type="button" onClick={() => setShowIcalInput(false)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><X className="w-6 h-6"/></button>
                                </div>
                                <p className="text-[14px] text-slate-500 font-medium leading-relaxed max-w-2xl">{locale === 'da' ? 'Indsæt dit iCal-link for at udfylde din ugeplan automatisk.' : 'Insert your iCal link to automatically populate your weekly schedule.'}</p>
                                
                                <div className="space-y-6">
                                    <div className="relative">
                                        <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <Input autoFocus type="url" value={icalUrlInput} onChange={e => setIcalUrlInput(e.target.value)} placeholder="webcal://..." className="h-16 pl-14 text-[15px] font-medium rounded-2xl bg-slate-50 border-slate-100 shadow-inner focus:bg-white transition-all" />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2.5">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">{currentT.startDate}</label>
                                            <Input type="date" value={syncRange.start} onChange={e => setSyncRange({...syncRange, start: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-slate-100 shadow-inner text-[14px] font-bold" />
                                        </div>
                                        <div className="space-y-2.5">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">{currentT.endDate}</label>
                                            <Input type="date" value={syncRange.end} onChange={e => setSyncRange({...syncRange, end: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-slate-100 shadow-inner text-[14px] font-bold" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Button type="submit" disabled={isSyncing || !icalUrlInput.trim()} className="h-16 px-10 rounded-2xl flex-1 text-[13px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                                        {isSyncing ? <Loader2 className="animate-spin w-5 h-5 mr-3" /> : <Sparkles className="w-5 h-5 mr-3" />}
                                        {isSyncing ? (locale === 'da' ? 'Synkroniserer...' : 'Syncing...') : (locale === 'da' ? 'Synkronisér nu' : 'Sync Now')}
                                    </Button>
                                </div>
                                <div className="bg-indigo-50/50 p-6 rounded-[24px] flex gap-4 items-start border border-indigo-100/50">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0"><Info className="w-4 h-4" /></div>
                                    <p className="text-[12px] text-indigo-900 leading-relaxed font-bold">{currentT.syncHelp}</p>
                                </div>
                            </form>
                        )}
                        
                        {/* AVAILABILITY OVERVIEW CARD */}
                        <section className="bg-slate-900 p-10 sm:p-14 rounded-[50px] text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700"><Target className="w-48 h-48" /></div>
                            <div className="relative z-10 grid lg:grid-cols-2 gap-14 items-center">
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-amber-400 text-slate-900 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl">
                                        <Zap className="w-4 h-4" /> {locale === 'da' ? 'Ugeplan' : 'Weekly Plan'}
                                    </div>
                                    <h3 className="text-4xl font-black tracking-tighter leading-[1.1]">{locale === 'da' ? 'Planlæg jeres optimale samarbejde.' : 'Schedule your optimal collaboration.'}</h3>
                                    <p className="text-slate-400 text-[15px] font-medium leading-relaxed max-w-md">
                                        {locale === 'da' ? 'Klik på de forskellige tidsblokke i tabellen nedenfor for at markere, hvordan du arbejder bedst i denne uge.' : 'Click the time blocks in the table below to mark how you work best this week.'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { mode: 'physical', label: locale === 'da' ? 'Fysisk' : 'Physical', color: 'bg-emerald-500', icon: MapPin },
                                        { mode: 'online', label: 'Online', color: 'bg-indigo-600', icon: Laptop },
                                        { mode: 'unavailable', label: locale === 'da' ? 'Optaget' : 'Busy', color: 'bg-rose-600', icon: UserX },
                                        { mode: null, label: locale === 'da' ? 'Ikke sat' : 'Not set', color: 'bg-white/10', icon: Circle },
                                    ].map((item) => (
                                        <div key={item.label} className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-[24px] flex flex-col gap-3 group/item hover:bg-white/10 transition-all">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${item.color} shadow-lg`}>
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-widest text-white/80">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden mb-32 relative">
                            <div className="overflow-x-auto custom-scrollbar native-app">
                                <table className="w-full text-left border-collapse min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100">
                                            <th className="px-10 py-8 sticky left-0 bg-slate-50 z-30 border-r border-slate-100 min-w-[280px]">
                                                <div className="flex items-center gap-3">
                                                    <Users className="w-5 h-5 text-slate-400" />
                                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{locale === 'da' ? 'KOLLEGER' : 'TEAM MEMBERS'}</span>
                                                </div>
                                            </th>
                                            {WEEKDAYS.map(day => (
                                                <th key={day.id} className="px-6 py-8 border-l border-slate-100 min-w-[180px]">
                                                    <div className="text-center space-y-3">
                                                        <p className="text-slate-900 text-[14px] font-black tracking-tight">{day.label.toUpperCase()}</p>
                                                        <div className="flex justify-center gap-4">
                                                            {TIME_SLOTS.map(st => (
                                                                <span key={st.id} className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{st.id.charAt(0)}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {members?.map((member, mIdx) => { 
                                            const isMe = member.id === user?.uid; 
                                            const avail = availabilities?.find(a => a.id === member.id || a.id === member.userId); 
                                            return (
                                                <motion.tr 
                                                    key={member.id} 
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: mIdx * 0.1 }}
                                                    className={`group ${isMe ? 'bg-indigo-50/20' : 'hover:bg-slate-50/50'} transition-all`}
                                                >
                                                    <td className={`px-10 py-8 sticky left-0 z-20 border-r border-slate-100 transition-all duration-500 ${isMe ? 'bg-white backdrop-blur-md shadow-xl z-20' : 'bg-white group-hover:bg-slate-50/50'}`}>
                                                        <div className="flex items-center gap-5">
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm tracking-tighter transition-all ${isMe ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20 scale-110' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
                                                                {member.email.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className={`text-[17px] block truncate font-black tracking-tight ${isMe ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'}`}>{member.nickname || member.email.split('@')[0]}</span>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${isMe ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                                                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${isMe ? 'text-indigo-600' : 'text-slate-400'}`}>{isMe ? (locale === 'da' ? 'DIG' : 'YOU') : (member.role)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {WEEKDAYS.map(day => (
                                                        <td key={day.id} className="px-6 py-8 border-l border-slate-100">
                                                            <div className="flex justify-center gap-4">
                                                                {TIME_SLOTS.map(slot => { 
                                                                    const slotKey = `${day.id}-${slot.id}`;
                                                                    const slotData = avail?.slots?.[slotKey]; 
                                                                    const mode = slotData?.mode || null; 
                                                                    const timeframe = slotData?.timeframe || ''; 
                                                                    const SlotIcon = mode === 'physical' ? MapPin : mode === 'online' ? Laptop : mode === 'unavailable' ? UserX : null; 
                                                                    
                                                                    if (isMe) { 
                                                                        return (
                                                                            <motion.button 
                                                                                key={slot.id} 
                                                                                whileHover={{ scale: 1.1, y: -4, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                                                                whileTap={{ scale: 0.95 }}
                                                                                onClick={() => handleOpenSlotEditor(day.id, slot.id)} 
                                                                                className={`w-14 h-24 rounded-[24px] transition-all border-2 flex flex-col items-center justify-center relative group/slot ${
                                                                                    mode === 'physical' ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 
                                                                                    mode === 'online' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 
                                                                                    mode === 'unavailable' ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20' : 
                                                                                    'bg-white border-slate-100 hover:border-slate-900 text-slate-200 hover:text-slate-900'
                                                                                }`}
                                                                            >
                                                                                {SlotIcon ? <SlotIcon className="w-6 h-6" /> : <Plus className="w-5 h-5 opacity-0 group-hover/slot:opacity-100 transition-opacity" />}
                                                                                {timeframe && <span className="text-[9px] font-black mt-3 uppercase truncate w-full px-2 text-center tracking-tighter opacity-90">{timeframe}</span>}
                                                                            </motion.button>
                                                                        ) 
                                                                    } 
                                                                    return (
                                                                        <div key={slot.id} className={`w-14 h-24 rounded-[24px] transition-all border-2 flex flex-col items-center justify-center ${
                                                                            mode === 'physical' ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm' : 
                                                                            mode === 'online' ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' : 
                                                                            mode === 'unavailable' ? 'bg-rose-600 border-rose-500 text-white shadow-sm' : 
                                                                            'bg-slate-50 border-slate-50/50 opacity-10'
                                                                        }`}>
                                                                            {SlotIcon && <SlotIcon className="w-6 h-6" />}
                                                                            {timeframe && <span className="text-[9px] font-black mt-3 uppercase truncate w-full px-2 text-center tracking-tighter opacity-80">{timeframe}</span>}
                                                                        </div>
                                                                    ) 
                                                                })}
                                                            </div>
                                                        </td>
                                                    ))}
                                                </motion.tr>
                                            ) 
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </motion.div>
                )}

                {activeTab === 'members' && (
                    <motion.div key="members" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto space-y-12">
                        {isAddingMember && (
                            <form onSubmit={handleAddMember} className="bg-slate-900 p-12 rounded-[50px] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><UserPlus className="w-48 h-48" /></div>
                                <div className="relative z-10 space-y-6">
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black text-white tracking-tighter uppercase">{locale === 'da' ? 'Udvid teamet' : 'Expand the Team'}</h3>
                                        <p className="text-slate-400 text-[15px] font-medium max-w-md">{locale === 'da' ? 'Indtast e-mailen på den person du vil invitere til gruppen.' : 'Enter the email of the person you want to invite to the group.'}</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <Input autoFocus type="email" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} placeholder="kollega@studie.dk" className="h-16 rounded-2xl bg-white/10 border-white/10 text-white text-[15px] font-medium px-6 focus:bg-white/20 transition-all placeholder:text-white/30" />
                                        <Button type="submit" disabled={isSaving} className="h-16 px-10 rounded-2xl bg-amber-400 text-slate-900 hover:bg-amber-300 font-black uppercase tracking-widest text-[13px] shadow-xl shadow-amber-400/20 active:scale-95 transition-all">
                                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (locale === 'da' ? 'Send Invitation' : 'Send Invitation')}
                                        </Button>
                                    </div>
                                    <button type="button" onClick={() => setIsAddingMember(false)} className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors">{locale === 'da' ? 'Annuller' : 'Cancel'}</button>
                                </div>
                            </form>
                        )}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {!isAddingMember && isAdmin && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    className="group cursor-pointer h-full"
                                    onClick={() => setIsAddingMember(true)}
                                >
                                    <div className="bg-[#FDFBF7] hover:bg-white p-10 rounded-[40px] border-2 border-dashed border-slate-200 hover:border-slate-900 transition-all flex flex-col items-center justify-center text-center h-full min-h-[280px] relative overflow-hidden group shadow-sm hover:shadow-2xl hover:shadow-slate-200/50">
                                        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center shadow-inner mb-6 group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-amber-400 transition-all duration-500">
                                            <UserPlus className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-[20px] font-black text-slate-900 tracking-tight leading-tight mb-2">{currentT.addColleague}</h3>
                                        <p className="text-[13px] text-slate-500 font-medium px-4">{currentT.inviteMembersDesc}</p>
                                    </div>
                                </motion.div>
                            )}
                            {members?.map(member => (
                                <motion.div 
                                    key={member.id} 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col group hover:shadow-2xl hover:shadow-slate-200/50 transition-all relative overflow-hidden h-full"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><UserIcon className="w-32 h-32 -rotate-12" /></div>
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                                                {member.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex gap-2">
                                                {member.id === user?.uid && (
                                                    <button onClick={() => { setEditingMember(member); setNewNickname(member.nickname || ''); }} className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {isAdmin && member.id !== user?.uid && (
                                                    <button onClick={() => handleRemoveMember(member)} disabled={isRemovingId === member.id} className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                                        {isRemovingId === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-grow space-y-1">
                                            <h4 className="text-[22px] font-black text-slate-900 tracking-tight leading-tight truncate">{member.nickname || member.email.split('@')[0]}</h4>
                                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{member.role === 'admin' ? (locale === 'da' ? 'Gruppeadministrator' : 'Group Administrator') : (locale === 'da' ? 'Kollega' : 'Colleague')}</p>
                                        </div>
                                        <div className="pt-8 border-t border-slate-50 mt-8">
                                            <p className="text-[13px] font-bold text-slate-500 truncate">{member.email}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
      </main>

      {/* SLOT EDITOR MODAL */}
      <AnimatePresence>
        {editingSlot && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                    onClick={() => setEditingSlot(null)}
                />
                <motion.form 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onSubmit={handleSaveSlot} 
                    className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8 border border-slate-100"
                >
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-900 shadow-inner">
                            <CalendarCheck className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentT.editSlot}</h2>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{WEEKDAYS.find(d => d.id === editingSlot?.dayId)?.label} — {TIME_SLOTS.find(s => s.id === editingSlot?.slotId)?.label}</p>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block px-1">{currentT.chooseType}</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'physical', label: currentT.physical, icon: MapPin, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                                    { id: 'online', label: 'Online', icon: Laptop, color: 'bg-indigo-600 text-white border-indigo-600' },
                                    { id: 'unavailable', label: currentT.unavailable, icon: UserX, color: 'bg-rose-600 text-white border-rose-600' },
                                    { id: null, label: currentT.notSet, icon: Circle, color: 'bg-slate-100 text-slate-400 border-transparent' },
                                ].map((option) => (
                                    <button
                                        key={String(option.id)}
                                        type="button"
                                        onClick={() => setSlotFormData({ ...slotFormData, mode: option.id as AvailabilityMode })}
                                        className={`flex items-center gap-3 p-4 rounded-[20px] transition-all font-bold text-[13px] border-2 ${slotFormData.mode === option.id ? 'shadow-md scale-[1.02] ' + option.color : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        <option.icon className="w-4 h-4 shrink-0" />
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">{currentT.chooseTimeframe}</label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <span className="text-[8px] font-black uppercase text-slate-300 block mb-1 px-1">Fra</span>
                                    <Input 
                                        type="time"
                                        value={slotFormData.from} 
                                        onChange={e => setSlotFormData({ ...slotFormData, from: e.target.value })} 
                                        className="h-12 rounded-xl"
                                    />
                                </div>
                                <div className="pt-5 text-slate-300 font-bold">—</div>
                                <div className="flex-1">
                                    <span className="text-[8px] font-black uppercase text-slate-300 block mb-1 px-1">Til</span>
                                    <Input 
                                        type="time"
                                        value={slotFormData.to} 
                                        onChange={e => setSlotFormData({ ...slotFormData, to: e.target.value })} 
                                        className="h-12 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setEditingSlot(null)} className="flex-1 rounded-[20px] h-14 font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50">Afbryd</Button>
                        <Button type="submit" disabled={isSaving} className="flex-1 rounded-[20px] h-14 bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-900/10 active:scale-95 transition-all">
                            {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : currentT.save}
                        </Button>
                    </div>
                </motion.form>
            </div>
        )}
      </AnimatePresence>

      {/* EDIT GROUP MODAL */}
      <AnimatePresence>
        {isEditingGroup && isAdmin && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                    onClick={() => setIsEditingGroup(false)}
                />
                <motion.form 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onSubmit={handleUpdateGroup} 
                    className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-8 border border-slate-100"
                >
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-900 shadow-inner">
                            <Settings className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{locale === 'da' ? 'Rediger Gruppe' : 'Edit Group'}</h2>
                        <p className="text-[14px] text-slate-500 font-medium">{locale === 'da' ? 'Opdater gruppens navn eller beskrivelse.' : 'Update the group\'s name or description.'}</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">{locale === 'da' ? 'Gruppens navn' : 'Group Name'}</label>
                            <Input 
                                placeholder={locale === 'da' ? 'Navn...' : 'Name...'} 
                                value={editGroupData.name} 
                                onChange={e => setEditGroupData({...editGroupData, name: e.target.value})} 
                                className="h-16 px-6 bg-slate-50 border-transparent rounded-[20px] text-[15px] font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner"
                                required 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">{locale === 'da' ? 'Beskrivelse' : 'Description'}</label>
                            <Textarea 
                                placeholder={locale === 'da' ? 'Beskrivelse...' : 'Description...'} 
                                value={editGroupData.description} 
                                onChange={e => setEditGroupData({...editGroupData, description: e.target.value})} 
                                className="p-6 bg-slate-50 border-transparent rounded-[24px] text-[14px] font-medium min-h-[140px] focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1 flex items-center gap-2"><Flag className="w-3 h-3"/> {locale === 'da' ? 'Samlet Deadline' : 'Overall Deadline'}</label>
                            <Input 
                                type="date"
                                value={editGroupData.finalDeadline} 
                                onChange={e => setEditGroupData({...editGroupData, finalDeadline: e.target.value})} 
                                className="h-16 px-6 bg-slate-50 border-transparent rounded-[20px] text-[15px] font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsEditingGroup(false)} className="flex-1 rounded-[20px] h-14 font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50">{locale === 'da' ? 'Annuller' : 'Cancel'}</Button>
                        <Button type="submit" disabled={isSaving} className="flex-1 rounded-[20px] h-14 bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-900/10 active:scale-95 transition-all">
                            {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : (locale === 'da' ? 'Gem ændringer' : 'Save Changes')}
                        </Button>
                    </div>
                </motion.form>
            </div>
        )}
      </AnimatePresence>

       {/* EDIT NICKNAME MODAL */}
       <AnimatePresence>
        {editingMember && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                    onClick={() => setEditingMember(null)}
                />
                <motion.form 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onSubmit={handleUpdateNickname} 
                    className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8 border border-slate-100"
                >
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-900 shadow-inner">
                            <Pencil className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{locale === 'da' ? 'Rediger Kaldenavn' : 'Edit Nickname'}</h2>
                        <p className="text-[14px] text-slate-500 font-medium">{locale === 'da' ? 'Vælg et kaldenavn, der vises for dine kolleger i denne gruppe.' : 'Choose a nickname that will be displayed to your colleagues in this group.'}</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">{locale === 'da' ? 'Dit kaldenavn' : 'Your Nickname'}</label>
                            <Input 
                                placeholder={locale === 'da' ? 'F.eks. Janni' : 'E.g. Janni'}
                                value={newNickname} 
                                onChange={e => setNewNickname(e.target.value)} 
                                className="h-16 px-6 bg-slate-50 border-transparent rounded-[20px] text-[15px] font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-inner"
                                required 
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setEditingMember(null)} className="flex-1 rounded-[20px] h-14 font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50">{locale === 'da' ? 'Annuller' : 'Cancel'}</Button>
                        <Button type="submit" disabled={isSaving} className="flex-1 rounded-[20px] h-14 bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-900/10 active:scale-95 transition-all">
                            {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : (locale === 'da' ? 'Gem' : 'Save')}
                        </Button>
                    </div>
                </motion.form>
            </div>
        )}
      </AnimatePresence>

       <AnimatePresence>
        {editingApaItem && (
            <ApaReferenceEditor 
                item={editingApaItem}
                onSave={handleSaveApaRef}
                onCancel={() => setEditingApaItem(null)}
                locale={locale}
                storage={storage}
                toast={toast}
            />
        )}
       </AnimatePresence>

       {/* FULLSCREEN PDF LOADING OVERLAY */}
       <AnimatePresence>
        {(isImportingPortfolio || isImportingTasks) && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-white rounded-[32px] p-10 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-6"
                >
                    <div className="relative">
                        <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-[24px] flex items-center justify-center relative z-10 shadow-inner">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                        </div>
                        <div className="absolute inset-0 bg-indigo-400 blur-xl opacity-20 animate-pulse rounded-[24px]"></div>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
                            {isImportingPortfolio ? (locale === 'da' ? 'Opbygger Portfolio...' : 'Building Portfolio...') : (locale === 'da' ? 'Analyserer Opgaver...' : 'Analyzing Tasks...')}
                        </h3>
                        <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                            {locale === 'da' ? 'Systemet læser din PDF og opretter strukturen. Det tager typisk cirka 10-20 sekunder. Vent venligst.' : 'The system is reading your PDF and creating the structure. This typically takes 10-20 seconds. Please wait.'}
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        )}
       </AnimatePresence>

       <AnimatePresence mode="wait">
        {isAddingPortfolioEntry && (
            <FocusedPortfolioWorkspace 
                key="focused-portfolio-editor"
                newPortfolioEntry={newPortfolioEntry}
                setNewPortfolioEntry={setNewPortfolioEntry}
                handleSavePortfolioEntry={handleSavePortfolioEntry}
                setIsAddingPortfolioEntry={setIsAddingPortfolioEntry}
                setEditingPortfolioEntry={setEditingPortfolioEntry}
                editingPortfolioEntry={editingPortfolioEntry}
                evidence={evidence || []}
                locale={locale}
                existingAssignments={existingAssignments}
                isAutoSaving={isAutoSaving}
                lastSaved={lastSaved}
                user={user}
                contacts={contacts || []}
                members={members || []}
                group={group || null}
            />
        )}
       </AnimatePresence>

    </div>
  );
}
