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
  const groupId = params.groupId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'tasks' | 'timeline' | 'members' | 'availability' | 'evidence' | 'contacts'>('tasks');
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'scrum'>('list');
  
  const [locale, setLocale] = useState<'da' | 'en'>('da');

  useEffect(() => {
    const queryLang = searchParams.get('lang') as 'da' | 'en';
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
            username: a.username,
            slots: Object.fromEntries(
                Object.entries(a.slots).map(([key, val]) => [key, { mode: val.mode, timeframe: val.timeframe }])
            )
        }));

        const result = await analyzeTaskScheduleAction({ tasks: cleanTasks, availabilities: cleanAvailabilities });
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
              setNewContact({ name: '', title: '', organization: '', email: '', phone: '', notes: '', });
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
          const syncedSlotsRaw = await syncCalendarAvailability(icalUrlInput.trim(), syncRange);
          
          // Map raw modes to new structure
          const syncedSlots: Record<string, { mode: AvailabilityMode; timeframe?: string }> = {};
          Object.entries(syncedSlotsRaw).forEach(([key, mode]) => {
              syncedSlots[key] = { mode };
          });

          const userAvail = availabilities?.find(a => a.id === user.uid);
          const mergedSlots = { ...(userAvail?.slots || {}), ...syncedSlots };

          const availRef = doc(firestore, 'groups', groupId, 'availability', user.uid);
          await setDoc(availRef, {
              username: userProfile.username || user.displayName || 'Anonym',
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
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col lg:flex-row text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      
      <aside className="w-full lg:w-80 bg-white border-r border-amber-100 flex flex-col h-screen z-30 shadow-sm shrink-0 border-r-2">
        <div className="p-8 flex items-center gap-4 border-b border-amber-50">
            <button onClick={() => router.push(`/rum/groups?lang=${locale}`)} className="p-2 bg-amber-50 text-amber-900 rounded-xl hover:bg-amber-100 transition-all shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
                <h1 className="text-lg font-bold text-amber-950 serif tracking-tight truncate">{group.name}</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40">{currentT.studyGroup}</p>
            </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <nav className="p-4 space-y-1">
                <button onClick={() => setActiveTab('tasks')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${activeTab === 'tasks' ? 'bg-amber-950 text-white shadow-xl' : 'text-slate-500 hover:bg-amber-50'}`}>
                    <div className="flex items-center gap-3"><ClipboardList className="w-4 h-4" /> {currentT.tasks}</div>
                    <span className={`text-[10px] font-black ${activeTab === 'tasks' ? 'text-amber-400/50' : 'text-slate-300'}`}>{tasks?.length || 0}</span>
                </button>
                <button onClick={() => setActiveTab('timeline')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${activeTab === 'timeline' ? 'bg-amber-950 text-white shadow-xl' : 'text-slate-500 hover:bg-amber-50'}`}>
                    <div className="flex items-center gap-3"><GanttChart className="w-4 h-4" /> {currentT.timeline}</div>
                </button>
                <button onClick={() => setActiveTab('evidence')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${activeTab === 'evidence' ? 'bg-amber-950 text-white shadow-xl' : 'text-slate-500 hover:bg-amber-50'}`}>
                    <div className="flex items-center gap-3"><FileSearch className="w-4 h-4" /> {currentT.evidence}</div>
                    <span className={`text-[10px] font-black ${activeTab === 'evidence' ? 'text-amber-400/50' : 'text-slate-300'}`}>{evidence?.length || 0}</span>
                </button>
                <button onClick={() => setActiveTab('contacts')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${activeTab === 'contacts' ? 'bg-amber-950 text-white shadow-xl' : 'text-slate-500 hover:bg-amber-50'}`}>
                    <div className="flex items-center gap-3"><Contact className="w-4 h-4" /> {currentT.contacts}</div>
                    <span className={`text-[10px] font-black ${activeTab === 'contacts' ? 'text-amber-400/50' : 'text-slate-300'}`}>{contacts?.length || 0}</span>
                </button>
                <button onClick={() => setActiveTab('availability')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${activeTab === 'availability' ? 'bg-amber-950 text-white shadow-xl' : 'text-slate-500 hover:bg-amber-50'}`}>
                    <div className="flex items-center gap-3"><CalendarCheck className="w-4 h-4" /> {currentT.availability}</div>
                </button>
                <button onClick={() => setActiveTab('members')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${activeTab === 'members' ? 'bg-amber-950 text-white shadow-xl' : 'text-slate-500 hover:bg-amber-50'}`}>
                    <div className="flex items-center gap-3"><Users className="w-4 h-4" /> {currentT.members}</div>
                    <span className={`text-[10px] font-black ${activeTab === 'members' ? 'text-amber-400/50' : 'text-slate-300'}`}>{members?.length || 0}</span>
                </button>
            </nav>

            <div className="mt-auto p-6 border-t border-amber-50 bg-amber-50/20">
                {deadlineInfo && (
                    <div className="mb-6 p-4 bg-white rounded-2xl border border-amber-100 shadow-sm animate-ink">
                        <div className="flex items-center gap-2 mb-2">
                            <Flag className="w-3 h-3 text-rose-600" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{currentT.deadline}</span>
                        </div>
                        <p className="text-sm font-black text-amber-950 serif">{deadlineInfo.date.toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US', { day: 'numeric', month: 'long' })}</p>
                        <p className={`text-[10px] font-bold mt-1 ${deadlineInfo.daysLeft < 7 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                            {deadlineInfo.daysLeft > 0 ? `${deadlineInfo.daysLeft} ${currentT.daysLeft}` : deadlineInfo.daysLeft === 0 ? currentT.deadlineToday : currentT.deadlinePassed}
                        </p>
                    </div>
                )}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><Info className="w-5 h-5 text-amber-700" /></div>
                        <h4 className="text-[10px] font-black uppercase text-amber-900 tracking-widest">{currentT.groupInfo}</h4>
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
                            className="p-2 text-slate-400 hover:text-amber-950 transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <p className="text-xs text-slate-500 italic leading-relaxed">{group.description || currentT.noDescription}</p>
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-amber-100 px-8 flex items-center justify-between shrink-0 shadow-sm">
            <h2 className="text-lg font-bold text-amber-950 serif uppercase tracking-widest">
                {activeTab === 'tasks' ? currentT.tasks : 
                 activeTab === 'timeline' ? currentT.timeline : 
                 activeTab === 'members' ? currentT.members : 
                 activeTab === 'evidence' ? currentT.evidence : 
                 activeTab === 'contacts' ? currentT.contacts :
                 currentT.availability}
            </h2>
            <div className="flex items-center gap-3">
                {activeTab === 'timeline' && (
                    <Button onClick={handleAnalyzeSchedule} disabled={isAnalyzing || !ganttData} size="sm" className="rounded-xl h-10 shadow-lg">
                        {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Sparkles className="w-4 h-4 mr-2"/>}
                        {currentT.analyzeTimeline}
                    </Button>
                )}
                {activeTab === 'availability' && (
                    <Button onClick={() => setShowIcalInput(!showIcalInput)} variant="outline" size="sm" className="rounded-xl h-10">
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        {icalUrlInput ? currentT.updateCalendar : currentT.syncCalendar}
                    </Button>
                )}
                {activeTab === 'evidence' && (
                    <Button onClick={() => setIsAddingEvidence(true)} size="sm" className="rounded-xl h-10 shadow-lg">
                        <Plus className="w-4 h-4 mr-2"/> {currentT.addManual}
                    </Button>
                )}
                {activeTab === 'contacts' && (
                    <Button onClick={() => setIsAddingContact(true)} size="sm" className="rounded-xl h-10 shadow-lg">
                        <Plus className="w-4 h-4 mr-2"/> {currentT.newContact}
                    </Button>
                )}
                {activeTab === 'tasks' && (
                    <>
                        <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-amber-100 mr-2">
                            <button onClick={() => setTaskViewMode('list')} className={`p-2 rounded-lg transition-all ${taskViewMode === 'list' ? 'bg-white text-amber-950 shadow-sm' : 'text-slate-400 hover:text-amber-950'}`}><ListIcon className="w-4 h-4" /></button>
                            <button onClick={() => setTaskViewMode('scrum')} className={`p-2 rounded-lg transition-all ${taskViewMode === 'scrum' ? 'bg-white text-amber-950 shadow-sm' : 'text-slate-400 hover:text-amber-950'}`}><LayoutGrid className="w-4 h-4" /></button>
                        </div>
                        <label className="cursor-pointer">
                            <div className="px-4 h-10 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-amber-100 transition-all">
                                {isImportingTasks ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileUp className="w-4 h-4" />}
                                {isImportingTasks ? 'Analyserer...' : currentT.importPdf}
                            </div>
                            <input type="file" className="sr-only" accept=".pdf" onChange={handleImportTasks} disabled={isImportingTasks} />
                        </label>
                        <Button onClick={() => setIsAddingTask(true)} size="sm" className="rounded-xl h-10 shadow-lg">
                            <Plus className="w-4 h-4 mr-2"/> {currentT.newTask}
                        </Button>
                    </>
                )}
                {activeTab === 'members' && (
                    <Button onClick={() => setIsAddingMember(true)} size="sm" className="rounded-xl h-10 shadow-lg">
                        <UserPlus className="w-4 h-4 mr-2"/> {currentT.inviteColleague}
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
                    <motion.div key="tasks" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto space-y-12">
                        
                        {/* PROJECT INSIGHTS DASHBOARD */}
                        {projectStats && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-ink">
                                <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Projektstatus</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-black text-amber-950 serif">{projectStats.progress}%</span>
                                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-50 rounded-full mt-4 overflow-hidden border border-amber-50">
                                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${projectStats.progress}%` }}></div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Udestående</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-black text-amber-950 serif">{projectStats.total - projectStats.done}</span>
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
                                            <ClipboardList className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">{projectStats.inProgress} i gang lige nu</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Overskredne deadlines</p>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-3xl font-black serif ${projectStats.overdue > 0 ? 'text-rose-600' : 'text-amber-950'}`}>{projectStats.overdue}</span>
                                        <AlertCircle className={`w-6 h-6 ${projectStats.overdue > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-200'}`} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">Kræver opmærksomhed</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm overflow-hidden relative group">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Arbejdsfordeling</p>
                                    <div className="space-y-2 max-h-16 overflow-y-auto pr-2 custom-scrollbar">
                                        {Object.entries(projectStats.workload).map(([name, count]) => (
                                            <div key={name} className="flex items-center justify-between text-[10px] font-bold text-amber-900">
                                                <span>{name}</span>
                                                <span className="bg-amber-100 px-1.5 rounded">{count} opg.</span>
                                            </div>
                                        ))}
                                        {Object.keys(projectStats.workload).length === 0 && <p className="text-[10px] text-slate-300 italic">Ingen aktive opgaver tildelt.</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {isAddingTask && (
                            <form onSubmit={handleSaveTask} className="bg-white p-10 rounded-[3rem] border-2 border-amber-950 shadow-2xl animate-ink space-y-8 max-w-2xl mx-auto">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 shadow-inner">
                                            <Pencil className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-xl font-bold text-amber-950 serif">{editingTask ? 'Rediger Opgave' : 'Ny Opgave'}</h3>
                                    </div>
                                    <button type="button" onClick={handleCancelTask} className="p-2 text-slate-300 hover:text-rose-600"><X className="w-6 h-6"/></button>
                                </div>
                                <div className="space-y-6">
                                    <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Opgavens titel</label><Input autoFocus value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="F.eks. Læs kapitel 4 i Socialret..." required className="h-14 rounded-2xl text-base font-bold shadow-inner" /></div>
                                    <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Uddybende beskrivelse (valgfri)</label><Textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="Noter om opgaven..." className="rounded-2xl min-h-[120px] shadow-inner" /></div>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Start dato</label><div className="relative"><CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input type="date" value={newTask.startDate} onChange={e => setNewTask({...newTask, startDate: e.target.value})} className="h-12 pl-11 rounded-xl bg-slate-50 border-transparent focus:bg-white transition-all" /></div></div>
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Deadline</label><div className="relative"><CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="h-12 pl-11 rounded-xl bg-slate-50 border-transparent focus:bg-white transition-all" /></div></div>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Ansvarlig</label>
                                            <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><select value={newTask.assignedToId} onChange={e => setNewTask({...newTask, assignedToId: e.target.value})} className="w-full h-12 pl-11 pr-4 bg-slate-50 border-transparent rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-amber-950 transition-all font-bold text-amber-950"><option value="">Ingen tildelt</option>{members?.map(m => <option key={m.id} value={m.id}>{m.nickname || m.email.split('@')[0]}</option>)}</select></div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Prioritering</label>
                                            <div className="relative"><Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as any})} className="w-full h-12 pl-11 pr-4 bg-slate-50 border-transparent rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-amber-950 transition-all font-bold text-amber-950"><option value="low">Lav</option><option value="medium">Middel</option><option value="high">Høj</option></select></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4 border-t border-amber-50">
                                    <Button type="submit" className="flex-1 h-14 rounded-2xl shadow-xl shadow-amber-950/20" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : (editingTask ? 'Opdater Opgave' : 'Opret Opgave')}</Button>
                                    <Button type="button" variant="ghost" onClick={handleCancelTask} className="h-14 rounded-2xl">Afbryd</Button>
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
                                        <div key={task.id} className={`bg-white rounded-[2.5rem] border transition-all overflow-hidden shadow-sm ${task.status === 'done' ? 'opacity-60 grayscale-[0.5]' : 'border-amber-100 hover:border-amber-950 hover:shadow-xl'}`}>
                                            <div className="p-6 md:p-8 flex items-center justify-between cursor-pointer group" onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}>
                                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                                    <button onClick={(e) => { e.stopPropagation(); handleCycleStatus(task.id, task.status); }} className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all shrink-0 ${task.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : task.status === 'in-progress' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-amber-100 bg-white hover:border-amber-950 text-transparent'}`}>{task.status === 'done' ? <CheckCircle2 className="w-7 h-7" /> : task.status === 'in-progress' ? <PlayCircle className="w-7 h-7" /> : <Circle className="w-7 h-7" />}</button>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${task.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : task.status === 'in-progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{task.status === 'done' ? 'Færdig' : task.status === 'in-progress' ? 'I gang' : 'To-do'}</span>
                                                            {task.priority === 'high' && <span className="text-[8px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1"><Zap className="w-2.5 h-2.5 fill-current" /> Høj Prioritet</span>}
                                                            {task.dueDate && <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(task.dueDate).toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US')}</span>}
                                                        </div>
                                                        <h4 className={`text-lg font-bold text-amber-950 truncate ${task.status === 'done' ? 'line-through text-slate-400' : ''}`}>{task.title}</h4>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {subtaskCount > 0 && (
                                                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                                            <CheckSquare className="w-3 h-3 text-slate-400" />
                                                            <span className="text-[10px] font-bold text-slate-500">{subtaskCompleted}/{subtaskCount}</span>
                                                        </div>
                                                    )}
                                                    {task.assignedToName && <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100"><User className="w-3 h-3 text-amber-700" /><span className="text-[10px] font-bold text-amber-900">{task.assignedToName}</span></div>}
                                                    <ChevronDown className={`w-6 h-6 text-slate-300 transition-transform ${isExpanded ? 'rotate-180 text-amber-950' : 'group-hover:text-amber-950'}`} />
                                                </div>
                                            </div>
                                            <AnimatePresence>{isExpanded && (
                                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-slate-50/50 border-t border-amber-50">
                                                    <div className="p-8 md:p-10 space-y-8">
                                                        {task.description && (<div><h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Beskrivelse</h5><p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-amber-200 pl-6">\"{task.description}\"</p></div>)}
                                                        
                                                        {subtaskCount > 0 && (
                                                            <div className="space-y-4">
                                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Undertasks</h5>
                                                                <div className="grid gap-2">
                                                                    {task.subtasks?.map(st => (
                                                                        <button key={st.id} onClick={() => handleToggleSubtask(task.id, st.id)} className="flex items-center gap-3 text-left group/st w-full hover:bg-white p-2 rounded-lg transition-all border border-transparent hover:border-amber-100">
                                                                            {st.completed ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4 text-slate-300" />}
                                                                            <span className={`text-sm ${st.completed ? 'line-through text-slate-400 font-medium' : 'text-amber-950 font-bold'}`}>{st.text}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-amber-100/50"><div className="flex gap-4"><button onClick={() => handleCycleStatus(task.id, task.status)} className="flex items-center gap-2 text-xs font-bold text-amber-950 hover:text-amber-700 transition-colors"><RefreshCw className="w-4 h-4" /> Skift status</button><button onClick={() => handleEditTask(task)} className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"><Pencil className="w-4 h-4" /> Rediger</button></div><button onClick={() => handleDeleteTask(task.id)} className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors"><Trash2 className="w-4 h-4" /> Slet opgave</button></div>
                                                    </div>
                                                </motion.div>
                                            )}</AnimatePresence>
                                        </div>
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
                                            <span className="text-[10px] font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full border border-amber-100">
                                                {tasks?.filter(t => t.status === status).length || 0}
                                            </span>
                                        </div>
                                        <div className="space-y-4">
                                            {tasks?.filter(t => t.status === status).map(task => (
                                                <div key={task.id} className="bg-white p-6 rounded-[2rem] border border-amber-100 shadow-sm hover:border-amber-950 hover:shadow-xl transition-all group">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        {task.priority === 'high' && <Zap className="w-3 h-3 text-rose-500 fill-current" />}
                                                        <span className={`text-[8px] font-black uppercase tracking-tighter ${task.priority === 'high' ? 'text-rose-600' : 'text-slate-300'}`}>{task.priority}</span>
                                                    </div>
                                                    <h4 className={`text-sm font-bold text-amber-950 mb-4 leading-snug line-clamp-2 ${task.status === 'done' ? 'line-through text-slate-400' : ''}`}>{task.title}</h4>
                                                    <div className="flex items-center justify-between pt-4 border-t border-amber-50">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-900 text-[10px] font-black uppercase">{task.assignedToName?.charAt(0) || '?'}{task.assignedToName?.charAt(1) || ''}</div>
                                                            {task.dueDate && <span className="text-[8px] font-bold text-slate-400">{new Date(task.dueDate).toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US', { day: 'numeric', month: 'short' })}</span>}
                                                        </div>
                                                        <button onClick={() => handleEditTask(task)} className="p-2 text-slate-200 hover:text-amber-950 transition-colors opacity-0 group-hover:opacity-100"><Pencil className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {tasks?.filter(t => t.status === status).length === 0 && (
                                                <div className="py-12 text-center border-2 border-dashed border-amber-50 rounded-[2rem] text-slate-300 italic text-xs">Ingen her</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(!tasks || tasks.length === 0) && !isAddingTask && (<div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-amber-100 shadow-inner"><ClipboardList className="w-16 h-16 text-amber-100 mx-auto mb-6" /><h3 className="text-xl font-bold text-amber-900/40 serif">Ingen opgaver endnu</h3><p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto">Start jeres samarbejde ved at tilføje den første opgave eller importér fra et dokument.</p><div className="flex gap-4 justify-center"><Button onClick={() => setIsAddingTask(true)}>Opret opgave</Button></div></div>)}
                    </motion.div>
                )}

                {activeTab === 'timeline' && (
                    <motion.div key="timeline" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-6xl mx-auto">
                        {!ganttData ? (
                            <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-amber-200 shadow-inner">
                                <GanttChart className="w-16 h-16 text-amber-100 mx-auto mb-6" />
                                <h3 className="text-xl font-bold text-amber-950 serif mb-2">Ingen tidslinje tilgængelig</h3>
                                <p className="text-slate-500 max-w-xs mx-auto mb-8 text-sm leading-relaxed italic">Tilføj deadlines til jeres opgaver for at se dem her i et Gantt-diagram.</p>
                                <Button onClick={() => setActiveTab('tasks')}>Gå til opgaver</Button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[3rem] border border-amber-100 shadow-xl overflow-hidden">
                                <div className="p-8 border-b border-amber-50 bg-slate-50/50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-950 text-amber-400 rounded-xl flex items-center justify-center shadow-lg"><Zap className="w-5 h-5" /></div>
                                        <h3 className="font-bold text-amber-950 serif">Projektets Fremdrift</h3>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                        <span>Start: {ganttData.start.toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                        <div className="w-1 h-1 bg-amber-200 rounded-full"></div>
                                        <span>Slut: {ganttData.end.toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto custom-scrollbar">
                                    <div className="min-w-[800px]">
                                        {/* Date header */}
                                        <div className="flex border-b border-amber-50">
                                            <div className="w-64 shrink-0 bg-white border-r border-amber-50 p-4 sticky left-0 z-10 text-[10px] font-black uppercase text-slate-400 tracking-widest">Opgave</div>
                                            <div className="flex">
                                                {ganttData.days.map((day, i) => (
                                                    <div key={i} className={`w-12 shrink-0 p-4 text-center border-r border-amber-50 flex flex-col items-center justify-center ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-amber-50/20' : ''}`}>
                                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter mb-1">{day.toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US', { weekday: 'short' }).charAt(0)}</span>
                                                        <span className="text-[10px] font-bold text-amber-950">{day.getDate()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Task rows */}
                                        <div className="divide-y divide-amber-50">
                                            {ganttData.tasks.map((task) => {
                                                const taskStart = task.startDate ? new Date(task.startDate) : new Date(task.createdAt?.toDate?.() || Date.now());
                                                const taskDueDate = new Date(task.dueDate!);
                                                
                                                // Calculate offsets
                                                const startDiff = Math.max(0, Math.floor((taskStart.getTime() - ganttData.start.getTime()) / (1000 * 60 * 60 * 24)));
                                                const duration = Math.max(1, Math.ceil((taskDueDate.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)));
                                                
                                                return (
                                                    <div key={task.id} className="flex hover:bg-amber-50/10 transition-colors group">
                                                        <div className="w-64 shrink-0 bg-white border-r border-amber-50 p-4 sticky left-0 z-10 text-xs font-bold text-amber-950 truncate flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'done' ? 'bg-emerald-500' : task.status === 'in-progress' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                                                            <span className="truncate group-hover:text-indigo-600 transition-colors">{task.title}</span>
                                                        </div>
                                                        <div className="flex relative items-center py-4">
                                                            {ganttData.days.map((_, i) => (
                                                                <div key={i} className="w-12 shrink-0 h-full border-r border-amber-50/50" />
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
                                                                className={`h-8 rounded-full shadow-lg border-2 flex items-center px-3 overflow-hidden ${
                                                                    task.status === 'done' ? 'bg-emerald-500 border-emerald-400 text-white' :
                                                                    task.status === 'in-progress' ? 'bg-indigo-600 border-indigo-500 text-white' :
                                                                    'bg-slate-100 border-slate-200 text-slate-400'
                                                                }`}
                                                            >
                                                                <span className="text-[8px] font-black uppercase tracking-tighter truncate">{task.status}</span>
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 border-t border-amber-100 flex items-center gap-8 justify-center">
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
                        {!isAddingEvidence && (<section className="bg-amber-950 p-8 sm:p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group"><div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform"><UploadCloud className="w-32 h-32" /></div><div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8"><div className="space-y-4 max-w-lg"><div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-amber-950 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg"><Zap className="w-3.5 h-3.5" /> {locale === 'da' ? 'Nyt: Drag & Drop' : 'New: Drag & Drop'}</div><h3 className="text-2xl font-bold serif leading-tight">{locale === 'da' ? 'Træk et link herind for at gemme det.' : 'Drag a link here to save it.'}</h3><p className="text-amber-100/60 text-sm italic">{locale === 'da' ? 'Du kan trække links direkte fra din browser og slippe dem her.' : 'You can drag links directly from your browser and drop them here.'}</p></div><div className="w-32 h-32 rounded-[2rem] border-4 border-dashed border-amber-400/30 flex items-center justify-center animate-pulse"><LinkIcon className="w-10 h-10 text-amber-400/50" /></div></div></section>)}
                        {isAddingEvidence && (
                            <form onSubmit={handleAddEvidence} className="bg-white p-10 rounded-[3rem] border border-amber-950 shadow-2xl animate-ink space-y-6">
                                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-amber-950 serif">{locale === 'da' ? 'Tilføj Empiri' : 'Add Evidence'}</h3><button type="button" onClick={() => setIsAddingEvidence(false)} className="p-2 text-slate-300 hover:text-rose-600"><X className="w-6 h-6"/></button></div>
                                <div className="space-y-4">
                                    <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Titel på data/kilde' : 'Title of data/source'}</label><Input autoFocus value={newEvidence.title} onChange={e => setNewEvidence({...newEvidence, title: e.target.value})} placeholder={locale === 'da' ? 'F.eks. Interview med socialrådgiver...' : 'E.g. Interview with social worker...'} required className="h-12 rounded-xl" /></div>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Type empiri' : 'Type of evidence'}</label><select value={newEvidence.type} onChange={e => setNewEvidence({...newEvidence, type: e.target.value as any})} className="w-full h-12 px-4 bg-white border border-input rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-amber-950"><option value="interview">{locale === 'da' ? 'Interview' : 'Interview'}</option><option value="survey">{locale === 'da' ? 'Spørgeskema' : 'Survey'}</option><option value="observation">{locale === 'da' ? 'Observation' : 'Observation'}</option><option value="document">{locale === 'da' ? 'Dokumentanalyse' : 'Document Analysis'}</option><option value="other">{locale === 'da' ? 'Andet' : 'Other'}</option></select></div>
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Link til rådata (valgfri)' : 'Link to raw data (optional)'}</label><Input type="url" value={newEvidence.url} onChange={e => setNewEvidence({...newEvidence, url: e.target.value})} placeholder="https://..." className="h-12 rounded-xl" /></div>
                                    </div>
                                    <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Beskrivelse/Noter' : 'Description/Notes'}</label><Textarea value={newEvidence.description} onChange={e => setNewEvidence({...newEvidence, description: e.target.value})} placeholder={locale === 'da' ? 'Hvad er de vigtigste fund?...' : 'What are the main findings?...'} className="rounded-2xl min-h-[120px]" /></div>
                                </div>
                                <div className="flex gap-4 pt-4"><Button type="submit" className="flex-1 h-14 rounded-2xl" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : (locale === 'da' ? 'Tilføj til arkivet' : 'Add to Archive')}</Button><Button type="button" variant="ghost" onClick={() => setIsAddingEvidence(false)} className="h-14 rounded-2xl">{locale === 'da' ? 'Afbryd' : 'Cancel'}</Button></div>
                            </form>
                        )}
                        <div className="grid sm:grid-cols-2 gap-6 pb-20">
                            {evidence?.map(item => {
                                const TypeIcon = item.type === 'interview' ? Mic : item.type === 'survey' ? BarChart : item.type === 'observation' ? Eye : item.type === 'document' ? FileText : FileSearch;
                                const typeColors = { interview: 'bg-purple-50 text-purple-700 border-purple-100', survey: 'bg-indigo-50 text-indigo-700 border-indigo-100', observation: 'bg-emerald-50 text-emerald-700 border-emerald-100', document: 'bg-amber-50 text-amber-700 border-amber-100', other: 'bg-slate-50 text-slate-700 border-slate-100' };
                                return (
                                    <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm flex flex-col group hover:shadow-xl transition-all relative overflow-hidden h-full">
                                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><TypeIcon className="w-24 h-24 -rotate-12" /></div>
                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border ${typeColors[item.type]}`}><TypeIcon className="w-6 h-6" /></div>
                                                <button onClick={() => handleDeleteEvidence(item.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                            <div className="flex-grow"><h4 className="text-xl font-bold text-amber-950 serif mb-2 leading-tight">{item.title}</h4><p className="text-sm text-slate-500 italic leading-relaxed line-clamp-3 mb-6">\"{item.description}\"</p></div>
                                            <div className="pt-6 border-t border-amber-50 flex items-center justify-between mt-auto"><div><p className="text-[8px] font-black uppercase tracking-widest text-slate-300">{locale === 'da' ? 'Tilføjet af' : 'Added by'}</p><p className="text-[10px] font-bold text-amber-900">{item.addedByName}</p></div>{item.url && (<a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors">{locale === 'da' ? 'Åbn rådata' : 'Open raw data'} <ExternalLink className="w-3 h-3" /></a>)}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'contacts' && (
                    <motion.div key="contacts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto space-y-8">
                        {isAddingContact && (
                            <form onSubmit={handleAddContact} className="bg-white p-10 rounded-[3rem] border-2 border-amber-950 shadow-2xl animate-ink space-y-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-amber-950 serif">{locale === 'da' ? 'Ny Kontakt' : 'New Contact'}</h3>
                                    <button type="button" onClick={() => setIsAddingContact(false)} className="p-2 text-slate-300 hover:text-rose-600"><X className="w-6 h-6"/></button>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Navn' : 'Name'}</label><Input value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} placeholder={locale === 'da' ? 'Fulde navn...' : 'Full name...'} required className="h-12 rounded-xl" /></div>
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Titel/Rolle' : 'Title/Role'}</label><Input value={newContact.title} onChange={e => setNewContact({...newContact, title: e.target.value})} placeholder={locale === 'da' ? 'F.eks. Informant, Leder...' : 'E.g. Informant, Leader...'} className="h-12 rounded-xl" /></div>
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Organisation' : 'Organization'}</label><Input value={newContact.organization} onChange={e => setNewContact({...newContact, organization: e.target.value})} placeholder={locale === 'da' ? 'F.eks. Københavns Kommune...' : 'E.g. City of Copenhagen...'} className="h-12 rounded-xl" /></div>
                                    </div>
                                    <div className="space-y-4">
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">E-mail</label><Input type="email" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} placeholder="mail@eksempel.dk" className="h-12 rounded-xl" /></div>
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Telefon' : 'Phone'}</label><Input type="tel" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} placeholder="+45 00 00 00 00" className="h-12 rounded-xl" /></div>
                                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{locale === 'da' ? 'Noter' : 'Notes'}</label><Textarea value={newContact.notes} onChange={e => setNewContact({...newContact, notes: e.target.value})} placeholder={locale === 'da' ? 'Vigtige detaljer...' : 'Important details...'} className="rounded-xl h-12" /></div>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button type="submit" className="flex-1 h-14 rounded-2xl" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : (locale === 'da' ? 'Gem Kontakt' : 'Save Contact')}</Button>
                                    <Button type="button" variant="ghost" onClick={() => setIsAddingContact(false)} className="h-14 rounded-2xl">{locale === 'da' ? 'Afbryd' : 'Cancel'}</Button>
                                </div>
                            </form>
                        )}

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                            {contacts?.map(contact => (
                                <div key={contact.id} className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm flex flex-col group hover:shadow-xl transition-all relative overflow-hidden h-full">
                                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><Contact className="w-24 h-24 -rotate-12 text-amber-900" /></div>
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-inner border border-amber-100">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <button onClick={() => handleDeleteContact(contact.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="text-xl font-bold text-amber-950 serif mb-1">{contact.name}</h4>
                                            <p className="text-xs font-black uppercase text-amber-700/60 mb-4">{contact.title || (locale === 'da' ? 'Kontakt' : 'Contact')}</p>
                                            
                                            <div className="space-y-3 mb-6">
                                                {contact.organization && (<div className="flex items-center gap-3 text-sm text-slate-500"><Building className="w-4 h-4 text-slate-300 shrink-0" /> {contact.organization}</div>)}
                                                {contact.email && (<a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-sm text-indigo-600 hover:underline"><Mail className="w-4 h-4 text-indigo-300 shrink-0" /> {contact.email}</a>)}
                                                {contact.phone && (<a href={`tel:${contact.phone}`} className="flex items-center gap-3 text-sm text-emerald-600 hover:underline"><Phone className="w-4 h-4 text-emerald-300 shrink-0" /> {contact.phone}</a>)}
                                            </div>
                                            {contact.notes && (<p className="text-xs text-slate-400 italic leading-relaxed border-t border-amber-50 pt-4 mt-4 line-clamp-3">\"{contact.notes}\"</p>)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'availability' && (
                    <motion.div key="availability" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto space-y-12">
                        {showIcalInput && (
                            <form onSubmit={handleSyncIcal} className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-xl space-y-6">
                                <div className="flex justify-between items-center mb-2"><h3 className="text-xl font-bold text-amber-950 serif">{currentT.syncCalendar}</h3><button type="button" onClick={() => setShowIcalInput(false)} className="p-2 text-slate-300 hover:text-rose-600"><X className="w-6 h-6"/></button></div>
                                <p className="text-sm text-slate-500 italic">{locale === 'da' ? 'Indsæt dit iCal-link for at udfylde din ugeplan automatisk.' : 'Insert your iCal link to automatically populate your weekly schedule.'}</p>
                                
                                <div className="space-y-4">
                                    <div className="relative"><LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input autoFocus type="url" value={icalUrlInput} onChange={e => setIcalUrlInput(e.target.value)} placeholder="webcal://..." className="h-14 pl-11 rounded-xl" /></div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">{currentT.startDate}</label>
                                            <Input type="date" value={syncRange.start} onChange={e => setSyncRange({...syncRange, start: e.target.value})} className="h-12 rounded-xl" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">{currentT.endDate}</label>
                                            <Input type="date" value={syncRange.end} onChange={e => setSyncRange({...syncRange, end: e.target.value})} className="h-12 rounded-xl" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Button type="submit" disabled={isSyncing || !icalUrlInput.trim()} className="h-14 px-10 rounded-xl flex-1">{isSyncing ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}{isSyncing ? (locale === 'da' ? 'Synkroniserer...' : 'Syncing...') : (locale === 'da' ? 'Synkronisér nu' : 'Sync Now')}</Button>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start border border-blue-100"><Info className="w-5 h-5 text-blue-600 mt-0.5" /><p className="text-[10px] text-blue-800 leading-relaxed font-medium">{currentT.syncHelp}</p></div>
                            </form>
                        )}
                        <section className="bg-amber-950 p-8 sm:p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group"><div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform"><Sparkles className="w-32 h-32" /></div><div className="relative z-10 grid md:grid-cols-2 gap-10 items-center"><div className="space-y-4"><div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-amber-950 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg"><Zap className="w-3.5 h-3.5" /> {locale === 'da' ? 'Planlægning' : 'Scheduling'}</div><h3 className="text-2xl font-bold serif leading-tight">{locale === 'da' ? 'Klik direkte i ugeplanen for at markere din tid.' : 'Click directly in the schedule to mark your time.'}</h3><p className="text-amber-100/60 text-sm italic">{locale === 'da' ? 'Find dit navn i tabellen nedenfor og klik på tidsblokkene.' : 'Find your name in the table below and click the time blocks.'}</p></div><div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm grid grid-cols-2 gap-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-amber-950 shadow-sm"><MapPin className="w-4 h-4" /></div><span className="text-[10px] font-bold uppercase text-amber-50">{locale === 'da' ? 'Fysisk' : 'Physical'}</span></div><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm"><Laptop className="w-4 h-4" /></div><span className="text-[10px] font-bold uppercase text-amber-50">Online</span></div><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-sm"><UserX className="w-4 h-4" /></div><span className="text-[10px] font-bold uppercase text-amber-50">{locale === 'da' ? 'Optaget' : 'Busy'}</span></div></div></div></section>
                        <section className="bg-white rounded-[3rem] border border-amber-100 shadow-xl overflow-hidden animate-ink"><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-amber-50"><tr><th className="px-8 py-8 sticky left-0 bg-white/95 backdrop-blur-md z-20 border-r border-amber-50">{locale === 'da' ? 'Kollega' : 'Colleague'}</th>{WEEKDAYS.map(day => (<th key={day.id} className="px-4 py-8 border-l border-amber-50"><div className="text-center"><p className="mb-2 text-amber-950 text-xs">{day.label}</p><div className="flex justify-center gap-1.5 text-[8px] opacity-40"><span>F</span><span>E</span><span>A</span></div></div></th>))}</tr></thead><tbody className="divide-y divide-amber-50">{members?.map(member => { const isMe = member.id === user?.uid; const avail = availabilities?.find(a => a.id === member.id); return (<tr key={member.id} className={`group ${isMe ? 'bg-amber-50/20' : 'hover:bg-amber-50/10'}`}><td className={`px-8 py-6 sticky left-0 z-10 border-r border-amber-50 transition-colors ${isMe ? 'bg-amber-50/80 font-black' : 'bg-white group-hover:bg-amber-50/10'}`}><div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner ${isMe ? 'bg-amber-950 text-amber-400' : 'bg-slate-100 text-slate-400'}`}>{member.email.charAt(0).toUpperCase()}</div><div className="min-w-0"><span className={`text-sm block truncate max-w-[120px] ${isMe ? 'text-amber-950' : 'text-slate-600'}`}>{member.nickname || member.email.split('@')[0]}</span>{isMe && <span className="text-[8px] font-black uppercase tracking-tighter text-amber-700/50">{locale === 'da' ? 'Dig' : 'You'}</span>}</div></div></td>{WEEKDAYS.map(day => (<td key={day.id} className="px-4 py-6 border-l border-amber-50"><div className="flex justify-center gap-2">{TIME_SLOTS.map(slot => { const slotData = avail?.slots?.[`${day.id}-${slot.id}`]; const mode = slotData?.mode || null; const timeframe = slotData?.timeframe || ''; const SlotIcon = mode === 'physical' ? MapPin : mode === 'online' ? Laptop : mode === 'unavailable' ? UserX : null; if (isMe) { return (<button key={slot.id} onClick={() => handleOpenSlotEditor(day.id, slot.id)} className={`w-10 h-14 rounded-xl transition-all shadow-sm border flex flex-col items-center justify-center relative group/slot active:scale-95 ${mode === 'physical' ? 'bg-amber-400 border-amber-400 text-amber-950' : mode === 'online' ? 'bg-indigo-600 border-indigo-600 text-white' : mode === 'unavailable' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white border-amber-100 text-amber-100 hover:border-amber-300'}`}>{SlotIcon ? <SlotIcon className="w-4 h-4" /> : <div className="w-1 h-1 rounded-full bg-current opacity-30" />}{timeframe && <span className="text-[6px] font-black mt-1 uppercase truncate w-full px-1">{timeframe}</span>}<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 bg-black/5 rounded-xl transition-opacity pointer-events-none"></div></button>) } return (<div key={slot.id} className={`w-10 h-14 rounded-xl transition-all shadow-sm border flex flex-col items-center justify-center ${mode === 'physical' ? 'bg-amber-400 border-amber-400 text-amber-950' : mode === 'online' ? 'bg-indigo-600 border-indigo-600 text-white' : mode === 'unavailable' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-slate-50 border-slate-100 opacity-20'}`}>{SlotIcon && <SlotIcon className="w-4 h-4" />}{timeframe && <span className="text-[6px] font-black mt-1 uppercase truncate w-full px-1">{timeframe}</span>}</div>) })}</div></td>))}</tr>) })}</tbody></table></div></section>
                    </motion.div>
                )}

                {activeTab === 'members' && (
                    <motion.div key="members" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto space-y-8">
                        {isAddingMember && (
                            <form onSubmit={handleAddMember} className="bg-indigo-950 p-10 rounded-[3rem] shadow-2xl animate-ink flex flex-col gap-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><UserPlus className="w-32 h-32" /></div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold text-white serif mb-2">{locale === 'da' ? 'Inviter en kollega' : 'Invite a colleague'}</h3>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <Input autoFocus type="email" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} placeholder="kollega@studie.dk" className="h-14 rounded-xl bg-white/10 border-white/20 text-white" />
                                        <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (locale === 'da' ? 'Tilføj' : 'Add')}</Button>
                                    </div>
                                    <button type="button" onClick={() => setIsAddingMember(false)} className="text-indigo-300 text-xs font-bold uppercase mt-4 hover:text-white transition-colors">{locale === 'da' ? 'Annuller' : 'Cancel'}</button>
                                </div>
                            </form>
                        )}
                        <div className="grid sm:grid-cols-2 gap-6">
                            {!isAddingMember && isAdmin && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    className="group cursor-pointer"
                                    onClick={() => setIsAddingMember(true)}
                                >
                                    <div className="bg-indigo-50/50 hover:bg-indigo-50 p-8 rounded-[2.5rem] border-2 border-dashed border-indigo-200 hover:border-indigo-950 transition-all flex flex-col items-center justify-center text-center h-full min-h-[160px] relative overflow-hidden">
                                        <div className="w-12 h-12 bg-white text-indigo-950 rounded-2xl flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                            <UserPlus className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-indigo-950 serif leading-tight mb-1">{currentT.addColleague}</h3>
                                        <p className="text-[10px] text-slate-500 italic px-4">{currentT.inviteMembersDesc}</p>
                                    </div>
                                </motion.div>
                            )}
                            {members?.map(member => (
                                <div key={member.id} className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm flex items-center gap-6 group hover:border-indigo-950 transition-all relative">
                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner group-hover:scale-110 transition-transform">{member.email.charAt(0).toUpperCase()}</div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-amber-950 truncate text-lg leading-tight">{member.nickname || member.email}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1.5">{member.role === 'admin' ? (locale === 'da' ? 'Gruppeadministrator' : 'Group Administrator') : (locale === 'da' ? 'Kollega' : 'Colleague')}</p>
                                    </div>
                                    {member.id === user?.uid && (
                                        <button onClick={() => { setEditingMember(member); setNewNickname(member.nickname || ''); }} className="absolute top-4 right-14 p-2 text-slate-300 hover:text-amber-950 hover:bg-amber-100 rounded-xl transition-all">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    )}
                                    {isAdmin && member.id !== user?.uid && (
                                        <button onClick={() => handleRemoveMember(member)} disabled={isRemovingId === member.id} className="absolute top-4 right-4 p-2 text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                            {isRemovingId === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
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
                    className="absolute inset-0 bg-amber-950/60 backdrop-blur-md" 
                    onClick={() => setEditingSlot(null)}
                />
                <motion.form 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onSubmit={handleSaveSlot} 
                    className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8 border border-amber-100"
                >
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-700 shadow-inner">
                            <CalendarCheck className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-amber-950 serif">{currentT.editSlot}</h2>
                        <p className="text-xs text-slate-400 uppercase font-black tracking-widest">{WEEKDAYS.find(d => d.id === editingSlot.dayId)?.label} — {TIME_SLOTS.find(s => s.id === editingSlot.slotId)?.label}</p>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block px-1">{currentT.chooseType}</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'physical', label: currentT.physical, icon: MapPin, color: 'bg-amber-400 text-amber-950' },
                                    { id: 'online', label: 'Online', icon: Laptop, color: 'bg-indigo-600 text-white' },
                                    { id: 'unavailable', label: currentT.unavailable, icon: UserX, color: 'bg-rose-600 text-white' },
                                    { id: null, label: currentT.notSet, icon: Circle, color: 'bg-slate-100 text-slate-400' },
                                ].map((option) => (
                                    <button
                                        key={String(option.id)}
                                        type="button"
                                        onClick={() => setSlotFormData({ ...slotFormData, mode: option.id as AvailabilityMode })}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-xs ${slotFormData.mode === option.id ? 'border-amber-950 shadow-lg scale-[1.02] ' + option.color : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
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
                        <Button type="button" variant="ghost" onClick={() => setEditingSlot(null)} className="flex-1 rounded-xl h-14">Afbryd</Button>
                        <Button type="submit" disabled={isSaving} className="flex-1 rounded-xl h-14 shadow-xl shadow-amber-950/10">
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
                        <h2 className="text-2xl font-bold text-amber-950 serif">{locale === 'da' ? 'Rediger Gruppe' : 'Edit Group'}</h2>
                        <p className="text-sm text-slate-500 italic">{locale === 'da' ? 'Opdater gruppens navn eller beskrivelse.' : 'Update the group\'s name or description.'}</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">{locale === 'da' ? 'Gruppens navn' : 'Group Name'}</label>
                            <Input 
                                placeholder={locale === 'da' ? 'Navn...' : 'Name...'} 
                                value={editGroupData.name} 
                                onChange={e => setEditGroupData({...editGroupData, name: e.target.value})} 
                                className="h-14 rounded-xl shadow-inner focus:ring-4 focus:ring-amber-950/5"
                                required 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">{locale === 'da' ? 'Beskrivelse' : 'Description'}</label>
                            <Textarea 
                                placeholder={locale === 'da' ? 'Beskrivelse...' : 'Description...'} 
                                value={editGroupData.description} 
                                onChange={e => setEditGroupData({...editGroupData, description: e.target.value})} 
                                className="rounded-2xl min-h-[120px] shadow-inner focus:ring-4 focus:ring-amber-950/5"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1 flex items-center gap-2"><Flag className="w-3 h-3"/> {locale === 'da' ? 'Samlet Deadline' : 'Overall Deadline'}</label>
                            <Input 
                                type="date"
                                value={editGroupData.finalDeadline} 
                                onChange={e => setEditGroupData({...editGroupData, finalDeadline: e.target.value})} 
                                className="h-14 rounded-xl shadow-inner focus:ring-4 focus:ring-amber-950/5"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsEditingGroup(false)} className="flex-1 rounded-xl h-14">{locale === 'da' ? 'Annuller' : 'Cancel'}</Button>
                        <Button type="submit" disabled={isSaving} className="flex-1 rounded-xl h-14 shadow-xl shadow-amber-950/10">
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
                        <h2 className="text-2xl font-bold text-amber-950 serif">{locale === 'da' ? 'Rediger Kaldenavn' : 'Edit Nickname'}</h2>
                        <p className="text-sm text-slate-500 italic">{locale === 'da' ? 'Vælg et kaldenavn, der vises for dine kolleger i denne gruppe.' : 'Choose a nickname that will be displayed to your colleagues in this group.'}</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">{locale === 'da' ? 'Dit kaldenavn' : 'Your Nickname'}</label>
                            <Input 
                                placeholder={locale === 'da' ? 'F.eks. Janni' : 'E.g. Janni'}
                                value={newNickname} 
                                onChange={e => setNewNickname(e.target.value)} 
                                className="h-14 rounded-xl shadow-inner focus:ring-4 focus:ring-amber-950/5"
                                required 
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setEditingMember(null)} className="flex-1 rounded-xl h-14">{locale === 'da' ? 'Annuller' : 'Cancel'}</Button>
                        <Button type="submit" disabled={isSaving} className="flex-1 rounded-xl h-14 shadow-xl shadow-amber-950/10">
                            {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : (locale === 'da' ? 'Gem' : 'Save')}
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
                        <h2 className="text-2xl font-bold text-amber-950 serif">{locale === 'da' ? 'Analyse af Tidsplan' : 'Schedule Analysis'}</h2>
                        <p className="text-sm text-slate-500 italic">{locale === 'da' ? 'Her er AI-genererede forslag til at optimere jeres tidsplan.' : 'Here are AI-generated suggestions to optimize your schedule.'}</p>
                    </div>
                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 -mr-4 custom-scrollbar">
                        {analysisResult.suggestions.map((suggestion: any, index: number) => (
                            <div key={index} className="p-6 bg-slate-50/80 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-amber-950 mb-2">{suggestion.suggestion}</h3>
                                <p className="text-sm text-slate-600 mb-4 italic">{suggestion.rationale}</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{locale === 'da' ? 'Relevante Opgaver:' : 'Relevant Tasks:'}</span>
                                    {suggestion.tasksInvolved.map((taskTitle: string, i: number) => (
                                        <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[9px] font-bold rounded border border-amber-200">{taskTitle}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={() => setAnalysisResult(null)} className="rounded-xl h-12 px-6">{locale === 'da' ? 'Luk' : 'Close'}</Button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
}
