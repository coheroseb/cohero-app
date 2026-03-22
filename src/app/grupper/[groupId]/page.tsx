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
  User,
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
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, setDoc, deleteDoc, updateDoc, getDocs, where, arrayUnion, arrayRemove, increment, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from 'framer-motion';
import { syncCalendarAvailability, extractTasksFromTextAction, analyzeTaskScheduleAction, sendGroupInvitationEmailAction, queueNotificationAction, addGroupMemberByEmailAction } from '@/app/actions';

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

interface Evidence {
    id: string;
    title: string;
    description: string;
    type: 'interview' | 'survey' | 'observation' | 'document' | 'other';
    url?: string;
    addedById: string;
    addedByName: string;
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
    text += strings + '\n';
  }
  return text;
}

export default function GroupDetailPage() {
  const { user, userProfile, isUserLoading } = useApp();
  const firestore = useFirestore();
  const params = useParams();
  const searchParams = useSearchParams();
  const groupId = (params?.groupId as string) || '';
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'tasks' | 'timeline' | 'members' | 'availability' | 'evidence' | 'contacts'>('tasks');
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'scrum'>('list');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  const [locale, setLocale] = useState<'da' | 'en'>('da');

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
          projectInsights: "Projekt Indblik",
          insightsDesc: "Her kan i se hvordan det går med jeres projekt lige nu.",
          openTasks: "Åbne Opgaver",
          daysToDeadline: "Dage til Deadline",
          projectProgress: "Projekt Fremdrift",
          teamWorkload: "Teamets Arbejdsbyrde",
          unassigned: "Ikke tildelt",
          upcomingDeadlines: "Kommende Deadlines",
          today: "I dag",
          tomorrow: "I morgen",
          noUpcomingTasks: "Ingen opgaver med snarlig deadline.",
          analyzeWithAi: "Analyser med AI",
          importDocument: "Importér Dokument",
          noTasksTitle: "Ingen opgaver fundet",
          noTasksDesc: "Begynd at planlægge jeres projekt ved at tilføje jeres første opgave eller importér fra et dokument.",
          addFirstTask: "Tilføj jeres første opgave",
          taskTitle: "Opgavens titel",
          titlePlaceholder: "F.eks. Skriv indledning...",
          taskDesc: "Beskrivelse",
          descPlaceholder: "Udfyld detaljerne om opgaven...",
          priority: "Prioritet",
          assignedTo: "Tildelt til",
          nobody: "Ingen",
          saveTask: "Gem opgave",
          updateTask: "Opdater opgave",
          cancel: "Annuller",
          editTask: "Rediger opgave",
          deleteTaskContent: "Slet opgave",
          low: "Lav",
          medium: "Mellem",
          high: "Høj",
          timelineFeature: "Tidslinje",
          manageTimeline: "Styr jeres herredømme",
          manageTimelineDesc: "Få det fulde overblik over jeres opgaver og deadlines i en visuel tidslinje.",
          ganttEmpty: "Tidslinjen er tom",
          ganttEmptyDesc: "Tilføj opgaver med start- og slutdatoer for at se dem her.",
          networkFeature: "Netværk",
          manageContacts: "Styr jeres kontakter",
          manageContactsDesc: "Hold styr på alle jeres kilder, informanter og samarbejdspartnere.",
          addNewContact: "Tilføj ny kontakt",
          contactDetails: "Kontaktoplysninger",
          contactName: "Navn",
          namePlaceholder: "F.eks. Jens Jensen",
          contactTitle: "Titel / Rolle",
          organization: "Organisation",
          orgPlaceholder: "F.eks. Københavns Universitet",
          emailLabel: "E-mail",
          phoneLabel: "Telefon",
          notesLabel: "Noter",
          saveContact: "Gem kontakt",
          defaultContactTitle: "Kontakt person",
          contactBookEmpty: "Kontaktbogen er tom",
          contactBookEmptyDesc: "Gem jeres kilder og informanter ét sted så alle i gruppen kan se dem.",
          addFirstContact: "Tilføj jeres første kontakt",
          planningFeature: "Planlægning",
          clickToMarkTime: "Klik for at markere tid",
          findNameDesc: "Find dit navn i tabellen og klik for at angive din tilgængelighed.",
          physicalMode: "Fysisk",
          onlineMode: "Online",
          busyMode: "Optaget",
          notSetMode: "Ikke angivet",
          colleagueHeader: "Kollega",
          morningAbbr: "Form",
          afternoonAbbr: "Eft",
          eveningAbbr: "Aft",
          youLabel: "Dig",
          collaborationFeature: "Samarbejde",
          groupMembers: "Gruppens Medlemmer",
          groupMembersDesc: "Her kan i se hvem der er med i gruppen og invitere nye kolleger.",
          invitationDetails: "Invitations detaljer",
          emailPlaceholder: "kollega@studie.dk",
          addMember: "Tilføj medlem",
          adminRole: "Gruppeadministrator",
          colleagueRole: "Kollega",
          empiricismArchive: "Empiri Arkiv",
          archiveDesc: "Saml og organisér alt jeres research, interviews og data ét sted.",
          addEmpiricism: "Tilføj Empiri",
          archiveEmpty: "Arkivet er tomt",
          archiveEmptyDesc: "Begynd at uploade jeres research og data for at holde styr på gruppens viden.",
          addFirstEmpiricism: "Tilføj jeres første empiri",
          dragAndDropFeature: "Hurtig Arkivering",
          dragLinkHere: "Træk et link herover",
          dragLinkDesc: "Træk links direkte fra din browser for lynhurtigt at gemme kilder.",
          empiricismDetails: "Detaljer om kilden",
          sourceTitle: "Kildens titel",
          sourcePlaceholder: "F.eks. Interview med borger",
          empiricismType: "Type af empiri",
          interview: "Interview",
          survey: "Spørgeskema",
          observation: "Observation",
          documentAnalysis: "Dokumentanalyse",
          other: "Andet",
          rawDataLink: "Link til rådata",
          notesPlaceholder: "Vigtige detaljer eller fund...",
          addToArchive: "Gem i arkivet",
          addedBy: "Tilføjet af",
          syncDetails: "Kalender detaljer",
          syncDesc: "Indsæt dit iCal-link for at synkronisere din kalender automatisk.",
          syncing: "Synkroniserer...",
          syncNow: "Synkronisér nu",
          syncInfo: "Vi analyserer dine faste mønstre for den kommende måned.",
          newMember: "Inviteret kollega",
          progress: "Fremgang",
          remaining: "Tilbage",
          inProgressText: "I gang",
          overdueTasks: "Overskredne opgaver",
          requiresAttention: "Kræver opmærksomhed",
          workloadDist: "Arbejdsfordeling",
          tasksCount: "opgaver",
          noWorkload: "Ingen aktive opgaver tildelt.",
          taskDetails: "Opgavedetaljer",
          taskPlaceholder: "Opgavens navn...",
          taskDescription: "Beskrivelse",
          descriptionPlaceholder: "Uddyb opgavens indhold...",
          responsible: "Ansvarlig",
          noOneAssigned: "Ingen valgt",
          createTask: "Opret opgave",
          doneTab: "Færdig",
          inProgressTab: "I gang",
          highPriorityLabel: "Høj",
          overdueLabel: "Overskredet",
          responsibleLabel: "Ansvarlig",
          descriptionHeader: "Beskrivelse",
          subtasksLabel: "Underopgaver",
          changeStatus: "Skift status",
          edit: "Rediger",
          deleteTask: "Slet",
          emptyCategory: "Ingen opgaver i denne kategori",
          noTasksYet: "Ingen opgaver endnu",
          createFirstTask: "Opret din første opgave",
          importFromDoc: "Importér fra dokument",
          noTimeline: "Tidslinjen er tom",
          noTimelineDesc: "Tilføj datoer til jeres opgaver for at se dem her.",
          goToTasks: "Gå til opgaver",
          timelineOverview: "Tidslinje Oversigt",
          taskHeader: "Opgave",
          planned: "Planlagt",
          empiricismPlaceholder: "Beskriv kildens relevans..."
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
          projectInsights: "Project Insights",
          insightsDesc: "See how your project is doing right now.",
          openTasks: "Open Tasks",
          daysToDeadline: "Days to Deadline",
          projectProgress: "Project Progress",
          teamWorkload: "Team Workload",
          unassigned: "Unassigned",
          upcomingDeadlines: "Upcoming Deadlines",
          today: "Today",
          tomorrow: "Tomorrow",
          noUpcomingTasks: "No tasks with upcoming deadlines.",
          analyzeWithAi: "Analyze with AI",
          importDocument: "Import Document",
          noTasksTitle: "No tasks found",
          noTasksDesc: "Start planning your project by adding your first task or import from a document.",
          addFirstTask: "Add your first task",
          taskTitle: "Task Title",
          titlePlaceholder: "e.g., Write introduction...",
          taskDesc: "Description",
          descPlaceholder: "Details about the task...",
          priority: "Priority",
          assignedTo: "Assigned To",
          nobody: "Nobody",
          saveTask: "Save Task",
          updateTask: "Update Task",
          cancel: "Cancel",
          editTask: "Edit Task",
          deleteTaskContent: "Delete Task",
          low: "Low",
          medium: "Medium",
          high: "High",
          timelineFeature: "Timeline",
          manageTimeline: "Control your empire",
          manageTimelineDesc: "Get the full overview of your tasks and deadlines in a visual timeline.",
          ganttEmpty: "Timeline is empty",
          ganttEmptyDesc: "Add tasks with start and end dates to see them here.",
          networkFeature: "Network",
          manageContacts: "Manage your contacts",
          manageContactsDesc: "Keep track of all your sources, informants and partners.",
          addNewContact: "Add new contact",
          contactDetails: "Contact Details",
          contactName: "Name",
          namePlaceholder: "e.g., John Doe",
          contactTitle: "Title / Role",
          organization: "Organization",
          orgPlaceholder: "e.g., Harvard University",
          emailLabel: "Email",
          phoneLabel: "Phone",
          notesLabel: "Notes",
          saveContact: "Save Contact",
          defaultContactTitle: "Contact person",
          contactBookEmpty: "Contact book is empty",
          contactBookEmptyDesc: "Save your sources and informants in one place for the whole group.",
          addFirstContact: "Add your first contact",
          planningFeature: "Planning",
          clickToMarkTime: "Click to mark time",
          findNameDesc: "Find your name in the table and click to indicate your availability.",
          physicalMode: "Physical",
          onlineMode: "Online",
          busyMode: "Busy",
          notSetMode: "Not set",
          colleagueHeader: "Colleague",
          morningAbbr: "Morn",
          afternoonAbbr: "Aft",
          eveningAbbr: "Eve",
          youLabel: "You",
          collaborationFeature: "Collaboration",
          groupMembers: "Group Members",
          groupMembersDesc: "See who is in the group and invite new colleagues.",
          invitationDetails: "Invitation Details",
          emailPlaceholder: "colleague@study.com",
          addMember: "Add Member",
          adminRole: "Group Admin",
          colleagueRole: "Colleague",
          empiricismArchive: "Empiricism Archive",
          archiveDesc: "Collect and organize all your research, interviews and data in one place.",
          addEmpiricism: "Add Empiricism",
          archiveEmpty: "Archive is empty",
          archiveEmptyDesc: "Start uploading your research and data to keep track of group knowledge.",
          addFirstEmpiricism: "Add your first evidence",
          dragAndDropFeature: "Quick Archive",
          dragLinkHere: "Drag a link here",
          dragLinkDesc: "Drag links directly from your browser to save sources instantly.",
          empiricismDetails: "Source Details",
          sourceTitle: "Source Title",
          sourcePlaceholder: "e.g., Interview with citizen",
          empiricismType: "Evidence Type",
          interview: "Interview",
          survey: "Survey",
          observation: "Observation",
          documentAnalysis: "Document Analysis",
          other: "Other",
          rawDataLink: "Link to raw data",
          notesPlaceholder: "Important details or findings...",
          addToArchive: "Add to archive",
          addedBy: "Added by",
          syncDetails: "Calendar Details",
          syncDesc: "Paste your iCal link to sync your calendar automatically.",
          syncing: "Syncing...",
          syncNow: "Sync now",
          syncInfo: "We analyze your patterns for the upcoming month.",
          newMember: "Invited colleague",
          progress: "Progress",
          remaining: "Remaining",
          inProgressText: "In Progress",
          overdueTasks: "Overdue tasks",
          requiresAttention: "Requires attention",
          workloadDist: "Workload distribution",
          tasksCount: "tasks",
          noWorkload: "No active tasks assigned.",
          taskDetails: "Task Details",
          taskPlaceholder: "Task name...",
          taskDescription: "Description",
          descriptionPlaceholder: "Detailed information...",
          responsible: "Responsible",
          noOneAssigned: "No one",
          createTask: "Create task",
          doneTab: "Done",
          inProgressTab: "In Progress",
          highPriorityLabel: "High",
          overdueLabel: "Overdue",
          responsibleLabel: "Responsible",
          descriptionHeader: "Description",
          subtasksLabel: "Subtasks",
          changeStatus: "Change status",
          edit: "Edit",
          deleteTask: "Delete",
          emptyCategory: "No tasks in this category",
          noTasksYet: "No tasks yet",
          createFirstTask: "Create your first task",
          importFromDoc: "Import from document",
          noTimeline: "Timeline is empty",
          noTimelineDesc: "Add dates to your tasks to see them here.",
          goToTasks: "Go to tasks",
          timelineOverview: "Timeline Overview",
          taskHeader: "Task",
          planned: "Planned",
          empiricismPlaceholder: "Describe relevance..."
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
  const [isImportingTasks, setIsImportingTasks] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  // Evidence Management
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [newEvidence, setNewEvidence] = useState({
      title: '',
      description: '',
      type: 'interview' as Evidence['type'],
      url: ''
  });

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

  const [isSaving, setIsSaving] = useState(false);
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null);

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

  // Fetch Contacts
  const contactsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'groups', groupId, 'contacts'), orderBy('createdAt', 'desc')) : null, [firestore, groupId]);
  const { data: contacts, isLoading: contactsLoading } = useCollection<GroupContact>(contactsQuery);

  // Fetch Availabilities
  const availabilityQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'groups', groupId, 'availability')) : null, [firestore, groupId]);
  const { data: availabilities, isLoading: availabilityLoading } = useCollection<MemberAvailability>(availabilityQuery);

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
          groupUrl: `${window.location.origin}/grupper/${groupId}?lang=${locale}`
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
        console.error("Task import error:", err);
        toast({ variant: 'destructive', title: "Fejl ved import", description: "Der skete en fejl under læsning eller analyse af dokumentet." });
    } finally {
        setIsImportingTasks(false);
        if (e.target) e.target.value = ''; // Reset input
    }
  };

  const handleAddEvidence = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newEvidence.title.trim() || !firestore || !user || !userProfile || isSaving) return;
      setIsSaving(true);
      
      const evidenceData = {
          title: newEvidence.title.trim(),
          description: newEvidence.description.trim(),
          type: newEvidence.type,
          url: newEvidence.url.trim() || null,
          addedById: user.uid,
          addedByName: userProfile.username || user.displayName || 'Anonym',
          createdAt: serverTimestamp()
      };

      addDoc(collection(firestore, 'groups', groupId, 'evidence'), evidenceData)
          .then(() => {
              setNewEvidence({ title: '', description: '', type: 'interview', url: '' });
              setIsAddingEvidence(false);
              toast({ title: "Empiri tilføjet" });
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
              setNewContact({ name: '', title: '', organization: '', email: '', phone: '', notes: '' });
              setIsAddingContact(false);
              toast({ title: "Kontakt tilføjet" });
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

  const handleDeleteContact = (id: string) => {
      if (!firestore || !window.confirm('Vil du slette denne kontakt?')) return;
      const docRef = doc(firestore, 'groups', groupId, 'contacts', id);
      deleteDoc(docRef).then(() => toast({ title: "Kontakt slettet" }));
  };

  const handleDropLink = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
      
      if (url && url.startsWith('http')) {
          if (!user || !firestore || !userProfile) return;
          
          const evidenceData = {
              title: 'Link: ' + new URL(url).hostname,
              description: 'Automatisk gemt via drag-and-drop.',
              type: 'document',
              url: url,
              addedById: user.uid,
              addedByName: userProfile.username || user.displayName || 'Anonym',
              createdAt: serverTimestamp()
          };

          addDoc(collection(firestore, 'groups', groupId, 'evidence'), evidenceData)
              .then(() => {
                  toast({ title: "Link gemt i arkivet" });
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

  const handleDeleteEvidence = (id: string) => {
      if (!firestore || !window.confirm('Er du sikker på, at du vil slette denne empiri permanent?')) return;
      const docRef = doc(firestore, 'groups', groupId, 'evidence', id);
      deleteDoc(docRef)
          .then(() => {
              toast({ title: "Empiri slettet" });
          })
          .catch(async (err) => {
              console.error(err);
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                  path: docRef.path,
                  operation: 'delete'
              }));
          });
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

  const handleToggleSlot = (dayId: string, slotId: string) => {
    setEditingSlot({ dayId, slotId });
    const userAvail = availabilities?.find(a => a.id === user?.uid);
    const current = userAvail?.slots?.[`${dayId}-${slotId}`];
    setSlotFormData({
        mode: current?.mode || null,
        from: current?.timeframe?.split('-')[0] || '',
        to: current?.timeframe?.split('-')[1] || ''
    });
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !editingSlot) return;

    setIsSaving(true);
    try {
        const userAvail = availabilities?.find(a => a.id === user.uid);
        const currentSlots = userAvail?.slots || {};
        const key = `${editingSlot.dayId}-${editingSlot.slotId}`;
        
        let timeframe = '';
        if (slotFormData.from && slotFormData.to) {
            timeframe = `${slotFormData.from}-${slotFormData.to}`;
        }

        const newSlots = { 
            ...currentSlots, 
            [key]: { 
                mode: slotFormData.mode,
                timeframe: timeframe || undefined
            } 
        };

        const availRef = doc(firestore, 'groups', groupId, 'availability', user.uid);
        const myMemberData = members?.find(m => m.id === user.uid);
        const username = myMemberData?.nickname || userProfile?.username || user.displayName || 'Anonym';

        await setDoc(availRef, {
            username: username,
            slots: newSlots,
            updatedAt: serverTimestamp()
        }, { merge: true });

        toast({ title: "Tilgængelighed opdateret" });
        setEditingSlot(null);
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke gemme din tilgængelighed." });
    } finally {
        setIsSaving(false);
    }
  };

  const handleOpenSlotEditor = (dayId: string, slotId: string) => {
    setEditingSlot({ dayId, slotId });
    const userAvail = availabilities?.find(a => a.id === user?.uid);
    const key = `${dayId}-${slotId}`;
    const slotData = userAvail?.slots?.[key];
    setSlotFormData({
        mode: slotData?.mode || null,
        from: slotData?.timeframe?.split('-')[0] || '',
        to: slotData?.timeframe?.split('-')[1] || ''
    });
  };

  const handleSyncIcal = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!user || !firestore || !icalUrlInput.trim()) return;

      setIsSyncing(true);
      try {
          const syncedSlots = await syncCalendarAvailability(icalUrlInput.trim(), { start: syncRange.start, end: syncRange.end });
          const userAvail = availabilities?.find(a => a.id === user.uid);
          
          // Merge logic: incoming synced slots (which are objects {mode, timeframe}) with existing
          const mergedSlots = { ...(userAvail?.slots || {}), ...syncedSlots };

          const availRef = doc(firestore, 'groups', groupId, 'availability', user.uid);
          await setDoc(availRef, {
              username: userProfile?.username || user.displayName || 'Anonym',
              slots: mergedSlots,
              icalUrl: icalUrlInput.trim(),
              updatedAt: serverTimestamp()
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
      if (tasksWithDates.length === 0) return null;

      const sorted = [...tasksWithDates].sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
      
      const earliestStart = Math.min(...tasks.map(t => {
          if (t.startDate) return new Date(t.startDate).getTime();
          return t.createdAt?.toDate?.()?.getTime() || Date.now();
      }));
      const start = new Date(earliestStart);
      const end = new Date(sorted[sorted.length - 1].dueDate!);
      
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

      return { tasks: sorted, days, start, end };
  }, [tasks]);

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
              onClick={() => router.push(`/grupper?lang=${locale}`)} 
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
                    { id: 'tasks', label: currentT.tasks, icon: ClipboardList, count: tasks?.length },
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
                {activeTab === 'tasks' && (
                    <motion.div 
                        key="tasks" 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -20 }} 
                        className="max-w-6xl mx-auto space-y-12 pb-32"
                    >
                        {/* PROJECT INSIGHTS DASHBOARD */}
                        {projectStats && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">{currentT.progress}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{projectStats.progress}%</span>
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="w-full h-2 bg-slate-50 rounded-full mt-5 overflow-hidden border border-slate-50">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${projectStats.progress}%` }}
                                            className="h-full bg-emerald-500 transition-all duration-1000"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">{currentT.remaining}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{projectStats.total - projectStats.done}</span>
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
                                            <ClipboardList className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-4 font-bold uppercase tracking-tight">{projectStats.inProgress} {currentT.inProgressText}</p>
                                </div>
                                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">{currentT.overdueTasks}</p>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-4xl font-black tracking-tighter ${projectStats.overdue > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{projectStats.overdue}</span>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${projectStats.overdue > 0 ? 'bg-rose-50 text-rose-500 animate-pulse' : 'bg-slate-50 text-slate-200'}`}>
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-4 font-bold uppercase tracking-tight">{currentT.requiresAttention}</p>
                                </div>
                                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">{currentT.workloadDist}</p>
                                    <div className="space-y-2.5 max-h-20 overflow-y-auto pr-2 custom-scrollbar mt-1">
                                        {Object.entries(projectStats.workload).map(([name, count]) => (
                                            <div key={name} className="flex items-center justify-between text-[11px] font-black text-slate-600">
                                                <span className="truncate max-w-[100px]">{name}</span>
                                                <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-slate-900 border border-slate-200/50">{count} {currentT.tasksCount}</span>
                                            </div>
                                        ))}
                                        {Object.keys(projectStats.workload).length === 0 && <p className="text-[10px] text-slate-300 italic py-2">{currentT.noWorkload}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {isAddingTask && (
                            <form onSubmit={handleSaveTask} className="bg-white p-12 rounded-[50px] border border-slate-950/5 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10 max-w-3xl mx-auto relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12"><Pencil className="w-64 h-64" /></div>
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/20">
                                            <Pencil className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{editingTask ? currentT.editTask : currentT.newTask}</h3>
                                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">{currentT.taskDetails}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={handleCancelTask} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center active:scale-90"><X className="w-6 h-6"/></button>
                                </div>
                                <div className="space-y-8 relative z-10">
                                    <div className="group">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.taskTitle}</label>
                                        <Input autoFocus value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder={currentT.taskPlaceholder} required className="h-16 rounded-[20px] bg-slate-50 border-transparent text-lg font-bold px-8 focus:bg-white focus:border-slate-900 transition-all shadow-inner placeholder:text-slate-300" />
                                    </div>
                                    <div className="group">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.taskDescription}</label>
                                        <Textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder={currentT.descriptionPlaceholder} className="rounded-[24px] bg-slate-50 border-transparent min-h-[140px] px-8 py-6 text-base font-medium focus:bg-white focus:border-slate-900 transition-all shadow-inner placeholder:text-slate-300" />
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-8">
                                        <div className="group">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.startDate}</label>
                                            <div className="relative">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors"><CalendarDays className="w-full h-full" /></div>
                                                <Input type="date" value={newTask.startDate} onChange={e => setNewTask({...newTask, startDate: e.target.value})} className="h-16 pl-16 rounded-[20px] bg-slate-50 border-transparent font-bold focus:bg-white transition-all shadow-inner" />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.deadline}</label>
                                            <div className="relative">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors"><CalendarDays className="w-full h-full" /></div>
                                                <Input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="h-16 pl-16 rounded-[20px] bg-slate-50 border-transparent font-bold focus:bg-white transition-all shadow-inner" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-8">
                                        <div className="group">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.responsible}</label>
                                            <div className="relative">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-hover:text-indigo-600"><User className="w-full h-full" /></div>
                                                <select value={newTask.assignedToId} onChange={e => setNewTask({...newTask, assignedToId: e.target.value})} className="w-full h-16 pl-16 pr-8 bg-slate-50 border-transparent rounded-[20px] text-[15px] appearance-none focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all font-black text-slate-900 shadow-inner">
                                                    <option value="">{currentT.noOneAssigned}</option>
                                                    {members?.map(m => <option key={m.id} value={m.id}>{m.nickname || m.email.split('@')[0]}</option>)}
                                                </select>
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown className="w-5 h-5" /></div>
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.priority}</label>
                                            <div className="relative">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-hover:text-amber-500"><Zap className="w-full h-full" /></div>
                                                <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as any})} className="w-full h-16 pl-16 pr-8 bg-slate-50 border-transparent rounded-[20px] text-[15px] appearance-none focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all font-black text-slate-900 shadow-inner">
                                                    <option value="low">{currentT.low}</option>
                                                    <option value="medium">{currentT.medium}</option>
                                                    <option value="high">{currentT.high}</option>
                                                </select>
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown className="w-5 h-5" /></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 pt-6 relative z-10">
                                    <Button type="submit" className="h-16 px-10 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all flex-1" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : (editingTask ? currentT.updateTask : currentT.createTask)}
                                    </Button>
                                    <Button type="button" variant="ghost" onClick={handleCancelTask} className="h-16 px-10 rounded-2xl text-slate-400 font-black uppercase tracking-widest text-[12px] hover:text-slate-900 active:scale-95 transition-all">
                                        {currentT.cancel}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {taskViewMode === 'list' ? (
                            <div className="grid gap-6">
                                {tasks?.map((task, index) => {
                                    const isExpanded = expandedTaskId === task.id;
                                    const subtaskCount = task.subtasks?.length || 0;
                                    const subtaskCompleted = task.subtasks?.filter(s => s.completed).length || 0;
                                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                                    
                                    return (
                                        <motion.div 
                                            key={task.id} 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`bg-white rounded-[32px] border transition-all duration-500 overflow-hidden ${
                                                task.status === 'done' 
                                                ? 'opacity-60 grayscale-[0.8] border-slate-100 hover:grayscale-0 hover:opacity-100' 
                                                : isOverdue 
                                                  ? 'border-rose-100 shadow-xl shadow-rose-900/5 ring-1 ring-rose-500/20' 
                                                  : 'border-slate-100 hover:border-slate-900 hover:shadow-2xl hover:shadow-slate-200/60'
                                            }`}
                                        >
                                            <div className="p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between cursor-pointer group/card" onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}>
                                                <div className="flex items-start gap-8 flex-1 min-w-0">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleCycleStatus(task.id, task.status); }} 
                                                        className={`w-14 h-14 rounded-2xl border-4 flex items-center justify-center transition-all shrink-0 active:scale-90 ${
                                                            task.status === 'done' 
                                                            ? 'bg-emerald-500 border-emerald-100 text-white shadow-lg shadow-emerald-500/20' 
                                                            : task.status === 'in-progress' 
                                                              ? 'bg-indigo-600 border-indigo-100 text-white shadow-lg shadow-indigo-600/20 animate-pulse' 
                                                              : 'border-slate-100 bg-slate-50 hover:border-slate-900 text-transparent group-hover/card:text-slate-200'
                                                        }`}
                                                    >
                                                        {task.status === 'done' ? <CheckCircle2 className="w-7 h-7" /> : task.status === 'in-progress' ? <PlayCircle className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
                                                    </button>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-3 mb-2.5">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
                                                                task.status === 'done' 
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                                : task.status === 'in-progress' 
                                                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                                                            }`}>
                                                                {task.status === 'done' ? currentT.doneTab : task.status === 'in-progress' ? currentT.inProgressTab : 'TO-DO'}
                                                            </span>
                                                            {task.priority === 'high' && (
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-white bg-rose-500 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-rose-500/20 ring-4 ring-rose-500/10">
                                                                    <Zap className="w-3 h-3 fill-current" /> {currentT.highPriorityLabel}
                                                                </span>
                                                            )}
                                                            {isOverdue && <span className="text-[9px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 animate-pulse">{currentT.overdueLabel}</span>}
                                                            {task.dueDate && (
                                                                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                                                                    <Clock className="w-3.5 h-3.5" /> 
                                                                    {new Date(task.dueDate).toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US', { day: 'numeric', month: 'short' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 className={`text-xl font-black text-slate-900 tracking-tight leading-tight transition-all ${task.status === 'done' ? 'line-through text-slate-300' : 'group-hover/card:text-indigo-600'}`}>{task.title}</h4>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-slate-50">
                                                    {subtaskCount > 0 && (
                                                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-[14px] border border-slate-100">
                                                            <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-slate-900 leading-none">{subtaskCompleted}/{subtaskCount}</span>
                                                                <span className="text-[8px] font-black uppercase text-slate-300 tracking-tighter mt-0.5">{currentT.tasks}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {task.assignedToName && (
                                                        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50/50 rounded-[14px] border border-indigo-100/50">
                                                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black transition-transform group-hover/card:scale-110">
                                                                {task.assignedToName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-indigo-900 leading-none truncate max-w-[80px]">{task.assignedToName}</span>
                                                                <span className="text-[8px] font-black uppercase text-indigo-400 tracking-tighter mt-0.5">{currentT.responsibleLabel}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-slate-900 text-white rotate-180 shadow-lg shadow-slate-900/10' : 'text-slate-300 group-hover/card:bg-slate-50 group-hover/card:text-slate-900'}`}>
                                                        <ChevronDown className="w-6 h-6" />
                                                    </div>
                                                </div>
                                            </div>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }} 
                                                        animate={{ height: 'auto', opacity: 1 }} 
                                                        exit={{ height: 0, opacity: 0 }} 
                                                        className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                                                    >
                                                        <div className="p-10 md:p-14 space-y-12">
                                                            {task.description && (
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                                                                        <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-400">{currentT.descriptionHeader}</h5>
                                                                    </div>
                                                                    <p className="text-[16px] text-slate-600 leading-relaxed font-medium italic pl-4">"{task.description}"</p>
                                                                </div>
                                                            )}
                                                            
                                                            {subtaskCount > 0 && (
                                                                <div className="space-y-6">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                                                                            <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-400">{currentT.subtasksLabel}</h5>
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-slate-300">{Math.round((subtaskCompleted/subtaskCount)*100)}% COMPLETE</span>
                                                                    </div>
                                                                    <div className="grid gap-3">
                                                                        {task.subtasks?.map(st => (
                                                                            <button 
                                                                                key={st.id} 
                                                                                onClick={() => handleToggleSubtask(task.id, st.id)} 
                                                                                className="flex items-center gap-4 text-left group/st w-full bg-white hover:bg-white p-5 rounded-[20px] transition-all border border-slate-100 hover:border-slate-900 hover:shadow-xl hover:shadow-slate-200/40 active:scale-[0.99]"
                                                                            >
                                                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${st.completed ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-200 group-hover/st:text-slate-400'}`}>
                                                                                    {st.completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                                                                </div>
                                                                                <span className={`text-[15px] font-bold ${st.completed ? 'line-through text-slate-300' : 'text-slate-900 group-hover/st:text-indigo-600'}`}>{st.text}</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-10 border-t border-slate-200/60">
                                                                <div className="flex gap-4">
                                                                    <button 
                                                                        onClick={() => handleCycleStatus(task.id, task.status)} 
                                                                        className="h-12 px-6 rounded-xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3 shadow-lg shadow-slate-900/20"
                                                                    >
                                                                        <RefreshCw className="w-4 h-4" /> {currentT.changeStatus}
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleEditTask(task)} 
                                                                        className="h-12 px-6 rounded-xl bg-white border border-slate-200 text-slate-900 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-3"
                                                                    >
                                                                        <Pencil className="w-4 h-4" /> {currentT.edit}
                                                                    </button>
                                                                </div>
                                                                <button 
                                                                    onClick={() => handleDeleteTask(task.id)} 
                                                                    className="h-12 px-6 rounded-xl text-rose-500 text-[11px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95 flex items-center gap-3"
                                                                >
                                                                    <Trash2 className="w-4 h-4" /> {currentT.deleteTask}
                                                                </button>
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
                            /* SCRUM/KANBAN BOARD VIEW - Mobile Scrollable */
                            <div className="flex gap-8 overflow-x-auto pb-8 custom-scrollbar scroll-smooth snap-x">
                                {(['todo', 'in-progress', 'done'] as Task['status'][]).map(status => (
                                    <div key={status} className="flex-1 min-w-[320px] max-w-[400px] snap-center">
                                        <div className="bg-slate-50/80 backdrop-blur-md p-8 rounded-[40px] border border-slate-100 flex flex-col h-full space-y-8">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${status === 'todo' ? 'bg-slate-300' : status === 'in-progress' ? 'bg-indigo-600 animate-pulse' : 'bg-emerald-500'}`} />
                                                    <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-900">
                                                        {status === 'todo' ? 'TO-DO' : status === 'in-progress' ? currentT.inProgressTab : currentT.doneTab}
                                                    </h3>
                                                </div>
                                                <span className="text-[11px] font-black bg-white text-slate-900 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                                    {tasks?.filter(t => t.status === status).length || 0}
                                                </span>
                                            </div>
                                            <div className="space-y-4 flex-1">
                                                {tasks?.filter(t => t.status === status).map(task => {
                                                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                                                    return (
                                                        <motion.div 
                                                            key={task.id} 
                                                            whileHover={{ y: -5, shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)' }}
                                                            className={`bg-white p-6 rounded-[28px] border transition-all group/card shadow-sm ${
                                                                isOverdue ? 'border-rose-100' : 'border-slate-100 hover:border-slate-900'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2 mb-4">
                                                                {task.priority === 'high' && <Zap className="w-3.5 h-3.5 text-rose-500 fill-current" />}
                                                                <span className={`text-[9px] font-black uppercase tracking-widest ${task.priority === 'high' ? 'text-rose-600' : 'text-slate-300'}`}>{task.priority}</span>
                                                                {isOverdue && <span className="ml-auto w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                                                            </div>
                                                            <h4 className={`text-[15px] font-black text-slate-900 mb-6 leading-tight line-clamp-2 ${task.status === 'done' ? 'line-through text-slate-300' : 'group-hover/card:text-indigo-600'}`}>{task.title}</h4>
                                                            <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
                                                                        task.status === 'done' ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'
                                                                    }`}>
                                                                        {task.assignedToName?.charAt(0).toUpperCase() || '?'}
                                                                    </div>
                                                                    {task.dueDate && <span className={`text-[9px] font-black uppercase tracking-tighter ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>{new Date(task.dueDate).toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US', { day: 'numeric', month: 'short' })}</span>}
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <button onClick={() => handleEditTask(task)} className="p-2 text-slate-200 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"><Pencil className="w-4 h-4" /></button>
                                                                    <button onClick={() => handleCycleStatus(task.id, task.status)} className="p-2 text-slate-200 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><RefreshCw className="w-4 h-4" /></button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                                {tasks?.filter(t => t.status === status).length === 0 && (
                                                    <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px] group hover:border-slate-200 transition-all">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-100 group-hover:text-slate-200 transition-colors">
                                                            <ClipboardList className="w-6 h-6" />
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-slate-400 transition-colors">{currentT.emptyCategory}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(!tasks || tasks.length === 0) && !isAddingTask && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-32 px-10 text-center bg-white rounded-[60px] border border-slate-100 shadow-2xl shadow-slate-200/50"
                            >
                                <div className="w-24 h-24 bg-slate-900 text-amber-400 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-slate-900/20 rotate-12">
                                    <ClipboardList className="w-12 h-12" />
                                </div>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">{currentT.noTasksYet}</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mb-12 text-lg font-medium leading-relaxed italic">{currentT.noTasksDesc}</p>
                                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                    <Button onClick={() => setIsAddingTask(true)} className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-slate-900/20">
                                        <Plus className="w-5 h-5 mr-3" /> {currentT.createFirstTask}
                                    </Button>
                                    <label className="cursor-pointer">
                                        <div className="px-10 h-16 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center hover:border-slate-900 transition-all">
                                            <FileUp className="w-5 h-5 mr-3 text-amber-600" /> {currentT.importFromDoc}
                                        </div>
                                        <input type="file" className="sr-only" accept=".pdf" onChange={handleImportTasks} disabled={isImportingTasks} />
                                    </label>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'timeline' && (
                    <motion.div 
                        key="timeline" 
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: -20 }} 
                        className="max-w-6xl mx-auto space-y-8"
                    >
                        {!ganttData ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-32 px-10 text-center bg-white rounded-[60px] border border-slate-100 shadow-2xl shadow-slate-200/50"
                            >
                                <div className="w-24 h-24 bg-slate-900 text-amber-400 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-slate-900/20 rotate-12">
                                    <GanttChart className="w-12 h-12" />
                                </div>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">{currentT.noTimeline}</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mb-12 text-lg font-medium leading-relaxed italic">{currentT.noTimelineDesc}</p>
                                <Button onClick={() => setActiveTab('tasks')} className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-slate-900/20">
                                    {currentT.goToTasks}
                                </Button>
                            </motion.div>
                        ) : (
                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden">
                                <div className="p-8 md:p-10 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/10">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">{currentT.projectProgress}</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{currentT.timelineOverview}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-[11px] font-black uppercase text-slate-400 tracking-widest bg-white px-6 py-3 rounded-full border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-300">START:</span>
                                            <span className="text-slate-900">{ganttData.start.toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-300">SLUT:</span>
                                            <span className="text-slate-900">{ganttData.end.toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto custom-scrollbar">
                                    <div className="min-w-[1000px] pb-8">
                                        {/* Date header */}
                                        <div className="flex border-b border-slate-100 bg-white sticky top-0 z-30">
                                            <div className="w-72 shrink-0 bg-white border-r border-slate-100 p-6 sticky left-0 z-40 text-[11px] font-black uppercase text-slate-400 tracking-widest">{currentT.taskHeader}</div>
                                            <div className="flex">
                                                {ganttData.days.map((day, i) => {
                                                    const isToday = day.toDateString() === new Date().toDateString();
                                                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                                    return (
                                                        <div key={i} className={`w-14 shrink-0 p-5 text-center border-r border-slate-50 flex flex-col items-center justify-center transition-colors ${isToday ? 'bg-indigo-50/50' : isWeekend ? 'bg-slate-50/30' : ''}`}>
                                                            <span className={`text-[10px] font-black mb-1.5 tracking-tighter ${isToday ? 'text-indigo-600' : 'text-slate-300 uppercase'}`}>{day.toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US', { weekday: 'short' }).charAt(0)}</span>
                                                            <span className={`text-[13px] font-black ${isToday ? 'text-indigo-900' : 'text-slate-900'}`}>{day.getDate()}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        {/* Task rows */}
                                        <div className="divide-y divide-slate-50">
                                            {ganttData.tasks.map((task) => {
                                                const taskStart = task.startDate ? new Date(task.startDate) : new Date(task.createdAt?.toDate?.() || Date.now());
                                                const taskDueDate = new Date(task.dueDate!);
                                                
                                                // Calculate offsets
                                                const startDiff = Math.max(0, Math.floor((taskStart.getTime() - ganttData.start.getTime()) / (1000 * 60 * 60 * 24)));
                                                const duration = Math.max(1, Math.ceil((taskDueDate.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)));
                                                
                                                return (
                                                    <div key={task.id} className="flex group/row hover:bg-slate-50/50 transition-all">
                                                        <div className="w-72 shrink-0 bg-white border-r border-slate-100 p-5 sticky left-0 z-20 text-[13px] font-black text-slate-900 truncate flex items-center gap-4 group-hover/row:translate-x-1 transition-transform">
                                                            <div className={`w-3 h-3 rounded-full shrink-0 border-2 ${
                                                                task.status === 'done' ? 'bg-emerald-500 border-emerald-100' : 
                                                                task.status === 'in-progress' ? 'bg-indigo-600 border-indigo-100 animate-pulse' : 
                                                                'bg-slate-100 border-slate-200'
                                                            }`} />
                                                            <span className="truncate group-hover/row:text-indigo-600 transition-colors">{task.title}</span>
                                                        </div>
                                                        <div className="flex relative items-center py-5">
                                                            {ganttData.days.map((_, i) => (
                                                                <div key={i} className="w-14 shrink-0 h-full border-r border-slate-50/30" />
                                                            ))}
                                                            {/* The Bar */}
                                                            <motion.div 
                                                                initial={{ scaleX: 0, opacity: 0 }}
                                                                animate={{ scaleX: 1, opacity: 1 }}
                                                                style={{ 
                                                                    position: 'absolute', 
                                                                    left: `${startDiff * 56 + 12}px`, 
                                                                    width: `${duration * 56 - 24}px`,
                                                                    transformOrigin: 'left'
                                                                }}
                                                                className={`h-10 rounded-2xl shadow-xl border flex items-center px-4 overflow-hidden group/bar transition-all hover:scale-y-110 ${
                                                                    task.status === 'done' ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/20' :
                                                                    task.status === 'in-progress' ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/20' :
                                                                    'bg-slate-100 border-slate-200 text-slate-400'
                                                                }`}
                                                            >
                                                                <span className="text-[9px] font-black uppercase tracking-widest truncate">{task.status === 'done' ? currentT.doneTab : task.status === 'in-progress' ? currentT.inProgressTab : 'TO-DO'}</span>
                                                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 opacity-0 group-hover/bar:opacity-100"></div>
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 flex flex-wrap items-center gap-10 justify-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{currentT.doneTab}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-indigo-600 shadow-lg shadow-indigo-600/20" />
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{currentT.inProgressTab}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-slate-200" />
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{currentT.planned}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'evidence' && (
                    <motion.div 
                        key="evidence" 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -20 }} 
                        className="max-w-6xl mx-auto space-y-10"
                    >
                        {!isAddingEvidence && (
                            <section className="bg-slate-900 p-12 md:p-16 rounded-[60px] text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700">
                                    <UploadCloud className="w-48 h-48" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                                    <div className="space-y-6 max-w-xl text-center md:text-left">
                                        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-amber-400/20">
                                            <Zap className="w-4 h-4" /> {currentT.dragAndDropFeature}
                                        </div>
                                        <h3 className="text-4xl font-black tracking-tighter uppercase leading-[0.9]">{currentT.dragLinkHere}</h3>
                                        <p className="text-slate-400 text-lg font-medium italic leading-relaxed">{currentT.dragLinkDesc}</p>
                                    </div>
                                    <div className="w-48 h-48 rounded-[40px] border-4 border-dashed border-white/10 flex items-center justify-center animate-pulse transition-all group-hover:border-amber-400/30 group-hover:bg-amber-400/5">
                                        <LinkIcon className="w-16 h-16 text-white/20 group-hover:text-amber-400/50 transition-colors" />
                                    </div>
                                </div>
                            </section>
                        )}
                        
                        {isAddingEvidence && (
                            <form 
                                onSubmit={handleAddEvidence} 
                                className="bg-white p-12 rounded-[50px] border border-slate-950/5 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10 max-w-3xl mx-auto relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12"><FileSearch className="w-64 h-64" /></div>
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/20">
                                            <FileSearch className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{currentT.addEmpiricism}</h3>
                                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">{currentT.empiricismDetails}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setIsAddingEvidence(false)} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center active:scale-90"><X className="w-6 h-6"/></button>
                                </div>
                                <div className="space-y-8 relative z-10">
                                    <div className="group">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.sourceTitle}</label>
                                        <Input autoFocus value={newEvidence.title} onChange={e => setNewEvidence({...newEvidence, title: e.target.value})} placeholder={currentT.sourcePlaceholder} required className="h-16 rounded-[20px] bg-slate-50 border-transparent text-lg font-bold px-8 focus:bg-white focus:border-slate-900 transition-all shadow-inner placeholder:text-slate-300" />
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-8">
                                        <div className="group">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.empiricismType}</label>
                                            <div className="relative">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-hover:text-amber-500"><FileSearch className="w-full h-full" /></div>
                                                <select value={newEvidence.type} onChange={e => setNewEvidence({...newEvidence, type: e.target.value as any})} className="w-full h-16 pl-16 pr-8 bg-slate-50 border-transparent rounded-[20px] text-[15px] appearance-none focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all font-black text-slate-900 shadow-inner">
                                                    <option value="interview">{currentT.interview}</option>
                                                    <option value="survey">{currentT.survey}</option>
                                                    <option value="observation">{currentT.observation}</option>
                                                    <option value="document">{currentT.documentAnalysis}</option>
                                                    <option value="other">{currentT.other}</option>
                                                </select>
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown className="w-5 h-5" /></div>
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.rawDataLink}</label>
                                            <div className="relative">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors"><LinkIcon className="w-full h-full" /></div>
                                                <Input type="url" value={newEvidence.url} onChange={e => setNewEvidence({...newEvidence, url: e.target.value})} placeholder="https://..." className="h-16 pl-16 rounded-[20px] bg-slate-50 border-transparent font-bold focus:bg-white transition-all shadow-inner" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.notesLabel}</label>
                                        <Textarea value={newEvidence.description} onChange={e => setNewEvidence({...newEvidence, description: e.target.value})} placeholder={currentT.empiricismPlaceholder} className="rounded-[24px] bg-slate-50 border-transparent min-h-[140px] px-8 py-6 text-base font-medium focus:bg-white focus:border-slate-900 transition-all shadow-inner placeholder:text-slate-300" />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 pt-6 relative z-10">
                                    <Button type="submit" className="h-16 px-10 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all flex-1" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : currentT.addToArchive}
                                    </Button>
                                    <Button type="button" variant="ghost" onClick={() => setIsAddingEvidence(false)} className="h-16 px-10 rounded-2xl text-slate-400 font-black uppercase tracking-widest text-[12px] hover:text-slate-900 active:scale-95 transition-all">
                                        {currentT.cancel}
                                    </Button>
                                </div>
                            </form>
                        )}

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                            {evidence?.map((item, index) => {
                                const TypeIcon = item.type === 'interview' ? Mic : item.type === 'survey' ? BarChart : item.type === 'observation' ? Eye : item.type === 'document' ? FileText : FileSearch;
                                const typeColors = { 
                                    interview: 'bg-purple-50 text-purple-700 border-purple-100 shadow-purple-900/5', 
                                    survey: 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-indigo-900/5', 
                                    observation: 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-900/5', 
                                    document: 'bg-amber-50 text-amber-700 border-amber-100 shadow-amber-900/5', 
                                    other: 'bg-slate-50 text-slate-700 border-slate-100 shadow-slate-900/5' 
                                };
                                return (
                                    <motion.div 
                                        key={item.id} 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col group hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 relative overflow-hidden h-full"
                                    >
                                        <div className="absolute -top-10 -right-10 p-10 opacity-[0.02] group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-1000">
                                            <TypeIcon className="w-48 h-48" />
                                        </div>
                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-10">
                                                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl border-4 border-white transition-transform group-hover:scale-110 ${typeColors[item.type]}`}>
                                                    <TypeIcon className="w-7 h-7" />
                                                </div>
                                                <button onClick={() => handleDeleteEvidence(item.id)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                            <div className="flex-grow space-y-4">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">{item.type}</span>
                                                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                                </div>
                                                <p className="text-[15px] text-slate-500 font-medium italic leading-relaxed line-clamp-4 pl-4 border-l-2 border-slate-100 group-hover:border-indigo-600 transition-colors">"{item.description}"</p>
                                            </div>
                                            <div className="pt-8 mt-10 border-t border-slate-50 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                                                        {item.addedByName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-900 leading-none">{item.addedByName}</span>
                                                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter mt-1">{currentT.addedBy}</span>
                                                    </div>
                                                </div>
                                                {item.url && (
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-indigo-600/5">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                            {(!evidence || evidence.length === 0) && !isAddingEvidence && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="col-span-full py-32 px-10 text-center bg-white rounded-[60px] border border-slate-100 shadow-2xl shadow-slate-200/50"
                                >
                                    <div className="w-24 h-24 bg-slate-900 text-amber-400 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-slate-900/20 rotate-12">
                                        <FileSearch className="w-12 h-12" />
                                    </div>
                                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">{currentT.archiveEmpty}</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mb-12 text-lg font-medium leading-relaxed italic">{currentT.archiveEmptyDesc}</p>
                                    <Button onClick={() => setIsAddingEvidence(true)} className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-slate-900/20">
                                        <Plus className="w-5 h-5 mr-3" /> {currentT.addFirstEmpiricism}
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'contacts' && (
                    <motion.div 
                        key="contacts" 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -20 }} 
                        className="max-w-6xl mx-auto space-y-10"
                    >
                        {!isAddingContact && (
                            <section className="bg-indigo-950 p-12 md:p-16 rounded-[60px] text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700">
                                    <Contact className="w-48 h-48" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                                    <div className="space-y-6 max-w-xl text-center md:text-left">
                                        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/20">
                                            <Sparkles className="w-4 h-4" /> {currentT.networkFeature}
                                        </div>
                                        <h3 className="text-4xl font-black tracking-tighter uppercase leading-[0.9]">{currentT.manageContacts}</h3>
                                        <p className="text-indigo-200/60 text-lg font-medium italic leading-relaxed">{currentT.manageContactsDesc}</p>
                                    </div>
                                    <Button onClick={() => setIsAddingContact(true)} className="h-20 px-12 rounded-[28px] bg-white text-indigo-950 hover:bg-slate-50 font-black uppercase tracking-widest text-[14px] shadow-2xl transition-all active:scale-95 group/btn">
                                        <UserPlus className="w-6 h-6 mr-3 text-indigo-600 transition-transform group-hover/btn:scale-110" /> {currentT.addNewContact}
                                    </Button>
                                </div>
                            </section>
                        )}

                        {isAddingContact && (
                            <form 
                                onSubmit={handleAddContact} 
                                className="bg-white p-12 rounded-[50px] border border-slate-950/5 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10 max-w-4xl mx-auto relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12"><Contact className="w-64 h-64" /></div>
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-950 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-950/20">
                                            <UserPlus className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{currentT.newContact}</h3>
                                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">{currentT.contactDetails}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setIsAddingContact(false)} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center active:scale-90"><X className="w-6 h-6"/></button>
                                </div>
                                <div className="grid md:grid-cols-2 gap-10 relative z-10">
                                    <div className="space-y-8">
                                        <div className="group">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.contactName}</label>
                                            <Input value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} placeholder={currentT.namePlaceholder} required className="h-16 rounded-[20px] bg-slate-50 border-transparent text-lg font-bold px-8 focus:bg-white focus:border-indigo-600 transition-all shadow-inner placeholder:text-slate-300" />
                                        </div>
                                        <div className="group">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.contactTitle}</label>
                                            <Input value={newContact.title} onChange={e => setNewContact({...newContact, title: e.target.value})} placeholder={currentT.titlePlaceholder} className="h-16 rounded-[20px] bg-slate-50 border-transparent font-bold px-8 focus:bg-white transition-all shadow-inner placeholder:text-slate-300" />
                                        </div>
                                        <div className="group">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.organization}</label>
                                            <div className="relative">
                                                <Building className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <Input value={newContact.organization} onChange={e => setNewContact({...newContact, organization: e.target.value})} placeholder={currentT.orgPlaceholder} className="h-16 pl-16 rounded-[20px] bg-slate-50 border-transparent font-bold focus:bg-white transition-all shadow-inner placeholder:text-slate-300" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <div className="group">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.emailLabel}</label>
                                            <div className="relative">
                                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <Input type="email" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} placeholder="mail@example.com" className="h-16 pl-16 rounded-[20px] bg-slate-50 border-transparent font-bold focus:bg-white transition-all shadow-inner placeholder:text-slate-300" />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.phoneLabel}</label>
                                            <div className="relative">
                                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <Input type="tel" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} placeholder="+45 00 00 00 00" className="h-16 pl-16 rounded-[20px] bg-slate-50 border-transparent font-bold focus:bg-white transition-all shadow-inner placeholder:text-slate-300" />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block px-1">{currentT.notesLabel}</label>
                                            <Textarea value={newContact.notes} onChange={e => setNewContact({...newContact, notes: e.target.value})} placeholder={currentT.notesPlaceholder} className="rounded-[24px] bg-slate-50 border-transparent min-h-[96px] max-h-[96px] px-8 py-4 text-base font-medium focus:bg-white transition-all shadow-inner placeholder:text-slate-300" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 pt-6 relative z-10">
                                    <Button type="submit" className="h-16 px-10 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all flex-1" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : currentT.saveContact}
                                    </Button>
                                    <Button type="button" variant="ghost" onClick={() => setIsAddingContact(false)} className="h-16 px-10 rounded-2xl text-slate-400 font-black uppercase tracking-widest text-[12px] hover:text-slate-900 active:scale-95 transition-all">
                                        {currentT.cancel}
                                    </Button>
                                </div>
                            </form>
                        )}

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                            {contacts?.map((contact, index) => (
                                <motion.div 
                                    key={contact.id} 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col group hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 relative overflow-hidden h-full"
                                >
                                    <div className="absolute -top-10 -right-10 p-10 opacity-[0.02] group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-1000">
                                        <Contact className="w-48 h-48 text-indigo-950" />
                                    </div>
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-10">
                                            <div className="w-16 h-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 group-hover:bg-indigo-600">
                                                <User className="w-7 h-7" />
                                            </div>
                                            <button onClick={() => handleDeleteContact(contact.id)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                        <div className="flex-grow space-y-2">
                                            <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none group-hover:text-indigo-600 transition-colors">{contact.name}</h4>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600/60">{contact.title || currentT.defaultContactTitle}</p>
                                            
                                            <div className="space-y-4 pt-8">
                                                {contact.organization && (
                                                    <div className="flex items-center gap-4 text-sm font-bold text-slate-500 bg-slate-50/50 p-3 rounded-2xl group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-100">
                                                        <Building className="w-5 h-5 text-slate-300 shrink-0" /> 
                                                        <span className="truncate">{contact.organization}</span>
                                                    </div>
                                                )}
                                                {contact.email && (
                                                    <a href={`mailto:${contact.email}`} className="flex items-center gap-4 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/30 p-3 rounded-2xl transition-all border border-transparent hover:border-indigo-100">
                                                        <Mail className="w-5 h-5 text-indigo-400 shrink-0" /> 
                                                        <span className="truncate">{contact.email}</span>
                                                    </a>
                                                )}
                                                {contact.phone && (
                                                    <a href={`tel:${contact.phone}`} className="flex items-center gap-4 text-sm font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50/30 p-3 rounded-2xl transition-all border border-transparent hover:border-emerald-100">
                                                        <Phone className="w-5 h-5 text-emerald-400 shrink-0" /> 
                                                        <span className="truncate">{contact.phone}</span>
                                                    </a>
                                                )}
                                            </div>

                                            {contact.notes && (<p className="text-[13px] text-slate-400 font-medium italic leading-relaxed pt-8 mt-4 border-t border-slate-50 line-clamp-2 transition-all group-hover:line-clamp-none">"{contact.notes}"</p>)}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {(!contacts || contacts.length === 0) && !isAddingContact && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="col-span-full py-32 px-10 text-center bg-white rounded-[60px] border border-slate-100 shadow-2xl shadow-slate-200/50"
                                >
                                    <div className="w-24 h-24 bg-indigo-950 text-white rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-indigo-950/20 rotate-12">
                                        <Contact className="w-12 h-12" />
                                    </div>
                                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">{currentT.contactBookEmpty}</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mb-12 text-lg font-medium leading-relaxed italic">{currentT.contactBookEmptyDesc}</p>
                                    <Button onClick={() => setIsAddingContact(true)} className="h-16 px-10 rounded-2xl bg-indigo-950 text-white font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-indigo-950/20">
                                        <Plus className="w-5 h-5 mr-3" /> {currentT.addFirstContact}
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'availability' && (
                    <motion.div 
                        key="availability" 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -20 }} 
                        className="max-w-7xl mx-auto space-y-12"
                    >
                        {showIcalInput && (
                            <form 
                                onSubmit={handleSyncIcal} 
                                className="bg-white p-12 rounded-[50px] border border-slate-950/5 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8 max-w-3xl mx-auto relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12"><Calendar className="w-64 h-64" /></div>
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/20">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{currentT.syncCalendar}</h3>
                                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">{currentT.syncDetails}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setShowIcalInput(false)} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center active:scale-90"><X className="w-6 h-6"/></button>
                                </div>
                                <p className="text-[15px] text-slate-500 font-medium italic leading-relaxed relative z-10">{currentT.syncDesc}</p>
                                <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                                    <div className="relative flex-1">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"><LinkIcon className="w-full h-full" /></div>
                                        <Input autoFocus type="url" value={icalUrlInput} onChange={e => setIcalUrlInput(e.target.value)} placeholder="webcal://..." className="h-16 pl-16 rounded-[20px] bg-slate-50 border-transparent font-bold focus:bg-white focus:border-indigo-600 transition-all shadow-inner placeholder:text-slate-300" />
                                    </div>
                                    <Button type="submit" disabled={isSyncing || !icalUrlInput.trim()} className="h-16 px-10 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all">
                                        {isSyncing ? <Loader2 className="animate-spin w-5 h-5 mr-3" /> : <Sparkles className="w-5 h-5 mr-3" />}{isSyncing ? currentT.syncing : currentT.syncNow}
                                    </Button>
                                </div>
                                <div className="bg-indigo-50/50 p-6 rounded-[24px] flex gap-5 items-start border border-indigo-100/50 relative z-10">
                                    <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center shrink-0">
                                        <Info className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <p className="text-[11px] text-indigo-800 leading-relaxed font-bold uppercase tracking-wider">{currentT.syncInfo}</p>
                                </div>
                            </form>
                        )}

                        <section className="bg-slate-900 p-12 md:p-16 rounded-[60px] text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700">
                                <Sparkles className="w-48 h-48" />
                            </div>
                            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                                <div className="space-y-6 max-w-xl text-center lg:text-left">
                                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-amber-400/20">
                                        <Zap className="w-4 h-4" /> {currentT.planningFeature}
                                    </div>
                                    <h3 className="text-4xl font-black tracking-tighter uppercase leading-[0.9]">{currentT.clickToMarkTime}</h3>
                                    <p className="text-slate-400 text-lg font-medium italic leading-relaxed">{currentT.findNameDesc}</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-[32px] p-10 backdrop-blur-xl grid grid-cols-2 gap-8 shadow-2xl">
                                    <div className="flex items-center gap-4 group/item">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center text-slate-900 shadow-xl shadow-amber-400/20 group-hover/item:scale-110 transition-transform">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest text-white/80">{currentT.physicalMode}</span>
                                    </div>
                                    <div className="flex items-center gap-4 group/item">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 group-hover/item:scale-110 transition-transform">
                                            <Laptop className="w-6 h-6" />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest text-white/80">{currentT.onlineMode}</span>
                                    </div>
                                    <div className="flex items-center gap-4 group/item">
                                        <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-xl shadow-rose-600/20 group-hover/item:scale-110 transition-transform">
                                            <UserX className="w-6 h-6" />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest text-white/80">{currentT.busyMode}</span>
                                    </div>
                                    <div className="flex items-center gap-4 group/item">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white/30 border border-white/10 group-hover/item:scale-110 transition-transform">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest text-white/40">{currentT.notSetMode}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-[60px] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-12 py-10 sticky left-0 bg-white/95 backdrop-blur-md z-30 border-r border-slate-100 min-w-[240px]">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{currentT.colleagueHeader}</span>
                                                    <div className="w-12 h-1 bg-indigo-600 rounded-full"></div>
                                                </div>
                                            </th>
                                            {WEEKDAYS.map(day => (
                                                <th key={day.id} className="px-6 py-10 border-l border-slate-100 min-w-[180px]">
                                                    <div className="text-center group/day">
                                                        <p className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-2 group-hover/day:text-indigo-600 transition-colors">{day.label}</p>
                                                        <div className="flex justify-center gap-3 text-[9px] font-black text-slate-300 tracking-widest uppercase">
                                                            <span className="hover:text-amber-500 transition-colors">{currentT.morningAbbr}</span>
                                                            <span className="hover:text-indigo-500 transition-colors">{currentT.afternoonAbbr}</span>
                                                            <span className="hover:text-rose-500 transition-colors">{currentT.eveningAbbr}</span>
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {members?.map((member, index) => { 
                                            const isMe = member.id === user?.uid; 
                                            const avail = availabilities?.find(a => a.id === member.id); 
                                            return (
                                                <motion.tr 
                                                    key={member.id} 
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className={`group transition-all ${isMe ? 'bg-indigo-50/20' : 'hover:bg-slate-50/50'}`}
                                                >
                                                    <td className={`px-12 py-8 sticky left-0 z-20 border-r border-slate-100 transition-all ${isMe ? 'bg-indigo-50/95 font-black' : 'bg-white group-hover:bg-slate-50/50'}`}>
                                                        <div className="flex items-center gap-5">
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-[15px] shadow-xl transition-all duration-500 group-hover:rotate-6 ${isMe ? 'bg-indigo-600 text-white shadow-indigo-600/30' : 'bg-slate-900 text-white shadow-slate-900/30 group-hover:bg-indigo-600'}`}>
                                                                {member.email.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0 flex flex-col">
                                                                <span className={`text-[15px] font-black truncate max-w-[140px] leading-none ${isMe ? 'text-indigo-950' : 'text-slate-900 group-hover:text-indigo-600 transition-colors'}`}>
                                                                    {member.nickname || member.email.split('@')[0]}
                                                                </span>
                                                                {isMe && <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-2">{currentT.youLabel}</span>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {WEEKDAYS.map(day => (
                                                        <td key={day.id} className="px-6 py-8 border-l border-slate-50">
                                                            <div className="flex justify-center gap-4">
                                                                {TIME_SLOTS.map(slot => { 
                                                                    const slotData = avail?.slots?.[`${day.id}-${slot.id}`];
                                                                    const modeVal = slotData?.mode || null;
                                                                    const SlotIcon = modeVal === 'physical' ? MapPin : modeVal === 'online' ? Laptop : modeVal === 'unavailable' ? UserX : null; 
                                                                    if (isMe) { 
                                                                        return (
                                                                            <button 
                                                                                key={slot.id} 
                                                                                onClick={() => handleToggleSlot(day.id, slot.id)} 
                                                                                className={`w-12 h-16 rounded-2xl transition-all shadow-xl flex items-center justify-center relative group/slot active:scale-90 border-2 ${
                                                                                    modeVal === 'physical' ? 'bg-amber-400 border-amber-300 text-slate-900 shadow-amber-400/20' : 
                                                                                    modeVal === 'online' ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/20' : 
                                                                                    modeVal === 'unavailable' ? 'bg-rose-600 border-rose-500 text-white shadow-rose-600/20' : 
                                                                                    'bg-white border-slate-100 text-slate-100 hover:border-slate-300 hover:text-slate-300 bg-slate-50/30'
                                                                                }`}
                                                                            >
                                                                                {SlotIcon ? <SlotIcon className="w-5 h-5 transition-transform group-hover/slot:scale-110" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-200 transition-all group-hover/slot:scale-150 group-hover/slot:bg-slate-300" />}
                                                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/slot:opacity-100 rounded-2xl transition-opacity pointer-events-none"></div>
                                                                            </button>
                                                                        ) 
                                                                    } 
                                                                    return (
                                                                        <div 
                                                                            key={slot.id} 
                                                                            className={`w-12 h-16 rounded-2xl transition-all shadow-md flex items-center justify-center border ${
                                                                                modeVal === 'physical' ? 'bg-amber-400 border-amber-300 text-slate-900 shadow-amber-400/10' : 
                                                                                modeVal === 'online' ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/10' : 
                                                                                modeVal === 'unavailable' ? 'bg-rose-600 border-rose-500 text-white shadow-rose-600/10' : 
                                                                                'bg-slate-50 border-slate-100/50 opacity-20'
                                                                            }`}
                                                                        >
                                                                            {SlotIcon && <SlotIcon className="w-5 h-5" />}
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
                    <motion.div 
                        key="members" 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -20 }} 
                        className="max-w-6xl mx-auto space-y-12"
                    >
                        {!isAddingMember && (
                            <section className="bg-slate-900 p-12 md:p-16 rounded-[60px] text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700">
                                    <UserPlus className="w-48 h-48" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                                    <div className="space-y-6 max-w-xl text-center md:text-left">
                                        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/20">
                                            <Sparkles className="w-4 h-4" /> {currentT.collaborationFeature}
                                        </div>
                                        <h3 className="text-4xl font-black tracking-tighter uppercase leading-[0.9]">{currentT.groupMembers}</h3>
                                        <p className="text-indigo-200/60 text-lg font-medium italic leading-relaxed">{currentT.groupMembersDesc}</p>
                                    </div>
                                    {isAdmin && (
                                        <Button onClick={() => setIsAddingMember(true)} className="h-20 px-12 rounded-[28px] bg-white text-slate-900 hover:bg-slate-50 font-black uppercase tracking-widest text-[14px] shadow-2xl transition-all active:scale-95 group/btn">
                                            <UserPlus className="w-6 h-6 mr-3 text-indigo-600 transition-transform group-hover/btn:scale-110" /> {currentT.inviteColleague}
                                        </Button>
                                    )}
                                </div>
                            </section>
                        )}

                        {isAddingMember && (
                            <form 
                                onSubmit={handleAddMember} 
                                className="bg-slate-950 p-12 rounded-[50px] shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col gap-10 max-w-2xl mx-auto relative overflow-hidden border border-white/5"
                            >
                                <div className="absolute top-0 right-0 p-12 opacity-[0.05] rotate-12 transition-transform">
                                    <UserPlus className="w-64 h-64 text-white" />
                                </div>
                                <div className="relative z-10 space-y-8">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center shadow-2xl border border-white/10">
                                                <UserPlus className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black text-white tracking-tighter uppercase">{currentT.inviteColleague}</h3>
                                                <p className="text-[11px] font-black uppercase tracking-widest text-white/30 mt-1">{currentT.invitationDetails}</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setIsAddingMember(false)} className="w-12 h-12 rounded-2xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center active:scale-90 shadow-inner"><X className="w-6 h-6"/></button>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-5">
                                        <div className="relative flex-1 group">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-hover:text-amber-400 transition-colors"><Mail className="w-full h-full" /></div>
                                            <Input 
                                                autoFocus 
                                                type="email" 
                                                value={newMemberEmail} 
                                                onChange={e => setNewMemberEmail(e.target.value)} 
                                                placeholder={currentT.emailPlaceholder} 
                                                className="h-20 pl-16 rounded-[24px] bg-white/5 border-white/10 text-white text-xl font-bold placeholder:text-white/10 focus:bg-white/10 focus:border-amber-400/50 transition-all shadow-inner" 
                                            />
                                        </div>
                                        <Button 
                                            type="submit" 
                                            disabled={isSaving} 
                                            className="h-20 px-12 rounded-[24px] bg-amber-400 text-slate-950 font-black uppercase tracking-widest text-[14px] shadow-2xl shadow-amber-400/20 active:scale-95 transition-all hover:bg-amber-300"
                                        >
                                            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : currentT.addMember}
                                        </Button>
                                    </div>
                                    <button type="button" onClick={() => setIsAddingMember(false)} className="w-full text-white/30 text-[11px] font-black uppercase tracking-widest hover:text-white transition-all duration-300">
                                        {currentT.cancel}
                                    </button>
                                </div>
                            </form>
                        )}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                            {members?.map((member, index) => (
                                <motion.div 
                                    key={member.id} 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-8 group hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 relative overflow-hidden"
                                >
                                    <div className="absolute -top-10 -right-10 p-10 opacity-[0.02] group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-1000">
                                        <User className="w-48 h-48 text-slate-900" />
                                    </div>
                                    <div className="w-20 h-20 bg-slate-50 text-slate-900 rounded-[28px] flex items-center justify-center font-black text-3xl shadow-inner transition-all duration-700 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-6 group-hover:shadow-2xl group-hover:shadow-indigo-600/30">
                                        {member.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1 relative z-10">
                                        <p className="font-black text-slate-900 truncate text-2xl tracking-tighter uppercase leading-none group-hover:text-indigo-600 transition-colors">
                                            {member.nickname || member.email.split('@')[0]}
                                        </p>
                                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-3 flex items-center gap-2">
                                            {member.role === 'admin' ? (
                                                <><Zap className="w-3.5 h-3.5 text-amber-500" /> {currentT.adminRole}</>
                                            ) : (
                                                <><User className="w-3.5 h-3.5 text-slate-300" /> {currentT.colleagueRole}</>
                                            )}
                                        </p>
                                    </div>
                                    
                                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                        {member.id === user?.uid && (
                                            <button 
                                                onClick={() => { setEditingMember(member); setNewNickname(member.nickname || ''); }} 
                                                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center shadow-lg shadow-black/5 active:scale-90"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        )}
                                        {isAdmin && member.id !== user?.uid && (
                                            <button 
                                                onClick={() => handleRemoveMember(member)} 
                                                disabled={isRemovingId === member.id} 
                                                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center shadow-lg shadow-black/5 active:scale-90"
                                            >
                                                {isRemovingId === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </main>

      {/* EDIT GROUP MODAL */}
      <AnimatePresence>
        {isEditingGroup && isAdmin && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-amber-950/60 backdrop-blur-md" 
                    onClick={() => setIsEditingGroup(false)}
                />
                <motion.form 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onSubmit={handleUpdateGroup} 
                    className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-8 border border-amber-100"
                >
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-700 shadow-inner">
                            <Settings className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-amber-950 serif">Rediger Gruppe</h2>
                        <p className="text-sm text-slate-500 italic">Opdater gruppens navn eller beskrivelse.</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Gruppens navn</label>
                            <Input 
                                placeholder="Navn..." 
                                value={editGroupData.name} 
                                onChange={e => setEditGroupData({...editGroupData, name: e.target.value})} 
                                className="h-14 rounded-xl shadow-inner focus:ring-4 focus:ring-amber-950/5"
                                required 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Beskrivelse</label>
                            <Textarea 
                                placeholder="Beskrivelse..." 
                                value={editGroupData.description} 
                                onChange={e => setEditGroupData({...editGroupData, description: e.target.value})} 
                                className="rounded-2xl min-h-[120px] shadow-inner focus:ring-4 focus:ring-amber-950/5"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1 flex items-center gap-2"><Flag className="w-3 h-3"/> Samlet Deadline</label>
                            <Input 
                                type="date"
                                value={editGroupData.finalDeadline} 
                                onChange={e => setEditGroupData({...editGroupData, finalDeadline: e.target.value})} 
                                className="h-14 rounded-xl shadow-inner focus:ring-4 focus:ring-amber-950/5"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsEditingGroup(false)} className="flex-1 rounded-xl h-14">Annuller</Button>
                        <Button type="submit" disabled={isSaving} className="flex-1 rounded-xl h-14 shadow-xl shadow-amber-950/10">
                            {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : 'Gem ændringer'}
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
                    className="absolute inset-0 bg-amber-950/60 backdrop-blur-md" 
                    onClick={() => setEditingMember(null)}
                />
                <motion.form 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onSubmit={handleUpdateNickname} 
                    className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8 border border-amber-100"
                >
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-700 shadow-inner">
                            <Pencil className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-amber-950 serif">Rediger Kaldenavn</h2>
                        <p className="text-sm text-slate-500 italic">Vælg et kaldenavn, der vises for dine kolleger i denne gruppe.</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Dit kaldenavn</label>
                            <Input 
                                placeholder="F.eks. Janni"
                                value={newNickname} 
                                onChange={e => setNewNickname(e.target.value)} 
                                className="h-14 rounded-xl shadow-inner focus:ring-4 focus:ring-amber-950/5"
                                required 
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setEditingMember(null)} className="flex-1 rounded-xl h-14">Annuller</Button>
                        <Button type="submit" disabled={isSaving} className="flex-1 rounded-xl h-14 shadow-xl shadow-amber-950/10">
                            {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : 'Gem'}
                        </Button>
                    </div>
                </motion.form>
            </div>
        )}
      </AnimatePresence>

       {/* ANALYSIS MODAL */}
       <AnimatePresence>
        {analysisResult && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-amber-950/60 backdrop-blur-md" 
                    onClick={() => setAnalysisResult(null)}
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 space-y-8 border border-amber-100"
                >
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-700 shadow-inner">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-amber-950 serif">Analyse af Tidsplan</h2>
                        <p className="text-sm text-slate-500 italic">Her er AI-genererede forslag til at optimere jeres tidsplan.</p>
                    </div>
                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 -mr-4 custom-scrollbar">
                        {analysisResult.suggestions.map((suggestion: any, index: number) => (
                            <div key={index} className="p-6 bg-slate-50/80 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-amber-950 mb-2">{suggestion.suggestion}</h3>
                                <p className="text-sm text-slate-600 mb-4 italic">{suggestion.rationale}</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Relevante Opgaver:</span>
                                    {suggestion.tasksInvolved.map((taskTitle: string, i: number) => (
                                        <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[9px] font-bold rounded border border-amber-200">{taskTitle}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={() => setAnalysisResult(null)} className="rounded-xl h-12 px-6">Luk</Button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
}
