
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, deleteDoc } from 'firebase/firestore';
import { Loader2, Search, Award, Trash2, ChevronDown, Briefcase, User, Mail, Shield, Zap, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import DeleteUserModal from '@/components/DeleteUserModal';
import { useDebounce } from 'use-debounce';
import dynamic from 'next/dynamic';
import { sendBulkEmailAction } from '@/app/actions';

// Dynamically import ReactQuill to avoid SSR issues and ensure stable module loading
const ReactQuill = dynamic(() => import('react-quill').then((mod) => mod.default), { 
  ssr: false,
  loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-xl border border-amber-100 flex items-center justify-center text-slate-400">Indlæser editor...</div>
});
import 'react-quill/dist/quill.snow.css';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  institution?: string;
  semester?: string;
  membership?: string;
  cohéroPoints?: number;
  lastLogin?: { toDate: () => Date };
  lastActivityAt?: { toDate: () => Date };
  createdAt?: { toDate: () => Date };
  role?: 'admin' | 'user';
}

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['link'],
    ['clean']
  ],
};

const AdminUsersPage = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const usersQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'users')) : null), [firestore]);
  const { data: users, isLoading, error } = useCollection<UserProfile>(usersQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailRecipientGroup, setEmailRecipientGroup] = useState('all');

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    const sortedUsers = [...users].sort((a, b) => {
        const dateA = a.createdAt?.toDate()?.getTime() || 0;
        const dateB = b.createdAt?.toDate()?.getTime() || 0;
        return dateB - dateA;
    });

    const lowercasedTerm = debouncedSearchTerm.toLowerCase();

    if (!lowercasedTerm) {
        return sortedUsers;
    }

    return sortedUsers.filter(user => 
      (user.username || '').toLowerCase().includes(lowercasedTerm) ||
      (user.email || '').toLowerCase().includes(lowercasedTerm)
    );
  }, [users, debouncedSearchTerm]);

  const recipientCount = useMemo(() => {
    if (!filteredUsers) return 0;
    return filteredUsers.filter(user => {
      if (emailRecipientGroup === 'all') return true;
      return user.membership === emailRecipientGroup;
    }).length;
  }, [filteredUsers, emailRecipientGroup]);
  
  const handleDeleteClick = (user: UserProfile) => {
    setUserToDelete(user);
  };
  
  const handleConfirmDelete = async () => {
    if (!userToDelete || !firestore) return;

    try {
      await deleteDoc(doc(firestore, 'users', userToDelete.id));
      toast({
        title: 'Bruger slettet',
        description: `Brugeren ${userToDelete.username} er blevet slettet fra databasen.`,
      });
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      toast({
        variant: 'destructive',
        title: 'Fejl',
        description: 'Kunne ikke slette brugeren.',
      });
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingEmail || !emailSubject.trim() || !emailBody.trim() || emailBody === '<p><br></p>' || !users) return;

    const recipientEmails = filteredUsers
        .filter(user => {
            if (emailRecipientGroup === 'all' && user.email) return true;
            return user.membership === emailRecipientGroup && user.email;
        })
        .map(user => user.email!);

    if (recipientEmails.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Ingen modtagere',
            description: 'Der er ingen brugere i den valgte gruppe med en e-mailadresse.',
        });
        return;
    }
    
    if (!window.confirm(`Er du sikker på, du vil sende denne e-mail til ${recipientEmails.length} modtagere?`)) return;

    setIsSendingEmail(true);

    try {
        const result = await sendBulkEmailAction({
            recipientEmails,
            subject: emailSubject,
            htmlBody: emailBody,
        });

        if (result.success) {
            toast({
                title: 'E-mails sendt!',
                description: `Beskeden er blevet sendt til ${result.sentCount} modtagere.`,
            });
            setEmailSubject('');
            setEmailBody('');
        } else {
            throw new Error(result.message);
        }
    } catch (err: any) {
        toast({
            variant: 'destructive',
            title: 'Fejl',
            description: `Kunne ikke sende e-mails: ${err.message}`,
        });
    } finally {
        setIsSendingEmail(false);
    }
};

  return (
    <>
    <div className="space-y-12 animate-ink">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group">
         <div className="p-10 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-10 bg-slate-50/20">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 serif">Brugerarkiv</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium italic">Administrér dine kolleger og monitorér deres engagement.</p>
            </div>
            <div className="relative group w-full max-w-sm">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-950 transition-colors" />
               <input 
                type="text" 
                placeholder="Søg i navne eller e-mails..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-5 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 transition-all text-sm w-full font-medium"
               />
            </div>
         </div>
         {isLoading ? (
            <div className="h-96 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>
         ) : error ? (
            <div className="h-96 flex items-center justify-center text-rose-500 font-bold">Fejl i indlæsning: {error.message}</div>
         ) : (
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-6">Kollega</th>
                    <th className="px-10 py-6">Studie & Information</th>
                    <th className="px-10 py-6">Engagement</th>
                    <th className="px-10 py-6">Seneste Aktivitet</th>
                    <th className="px-10 py-6 text-right pr-12">Handlinger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50/50">
                  {filteredUsers.map((u) => {
                    const lastActivity = u.lastActivityAt?.toDate() || u.lastLogin?.toDate();
                    const now = new Date();
                    const isOnline = lastActivity ? (now.getTime() - lastActivity.getTime()) < 5 * 60 * 1000 : false;
                    
                    return (
                    <React.Fragment key={u.id}>
                      <tr className="hover:bg-amber-50/30 transition-colors group cursor-pointer" onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}>
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-950 font-black text-xs shadow-inner">
                                 {u.username?.charAt(0) || '?'}
                              </div>
                              <div>
                                 <p className="font-bold text-amber-950 leading-none mb-1.5">{u.username}</p>
                                 <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <p className="text-xs font-bold text-amber-950">{u.institution || 'Ikke angivet'}</p>
                           <p className="text-[10px] text-slate-400 uppercase font-black">{u.semester || 'N/A'}</p>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-2 mb-1">
                              <Zap className="w-3 h-3 text-amber-500 fill-current" />
                              <span className="text-sm font-black text-amber-950">{u.cohéroPoints || 0} CP</span>
                           </div>
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${u.membership === 'Kollega++' ? 'bg-amber-950 text-amber-400' : 'bg-amber-100 text-amber-900'}`}>
                             {u.membership || 'Kollega'}
                           </span>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {lastActivity ? new Date(lastActivity).toLocaleString('da-DK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Aldrig'}
                              </span>
                            </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(u); }} className="p-3 hover:bg-white rounded-xl text-slate-300 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                              <div className={`p-3 rounded-xl transition-all ${expandedUserId === u.id ? 'bg-amber-950 text-white rotate-180' : 'text-slate-300'}`}>
                                 <ChevronDown className="w-4 h-4" />
                              </div>
                           </div>
                        </td>
                      </tr>
                      {expandedUserId === u.id && (
                        <tr>
                          <td colSpan={5} className="p-0 bg-slate-50/50 border-b-4 border-amber-100/50">
                            <div className="p-10 grid lg:grid-cols-3 gap-10">
                               <div className="space-y-6">
                                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-900 flex items-center gap-2"><User className="w-4 h-4" /> Profilinfo</h4>
                                  <p className="text-xs"><strong>Username:</strong> {u.username}<br/><strong>Email:</strong> {u.email}<br/><strong>User ID:</strong> {u.id}</p>
                               </div>
                               <div className="space-y-6">
                                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-900 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Medlemskab</h4>
                                  <p className="text-xs"><strong>Plan:</strong> {u.membership || 'Kollega'}<br/><strong>Points:</strong> {u.cohéroPoints || 0}</p>
                               </div>
                               <div className="space-y-6">
                                  <h4 className="text-xs font-black uppercase tracking-widest text-rose-900 flex items-center gap-2"><Shield className="w-4 h-4" /> Administration</h4>
                                  <div className="grid gap-3">
                                     <Button size="sm" variant="outline" disabled>Nulstil Adgangskode</Button>
                                     <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(u)}>Slet Bruger</Button>
                                  </div>
                               </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )})}
                </tbody>
              </table>
           </div>
         )}
      </div>
      
       <section className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-sm mt-8">
        <h3 className="text-2xl font-bold text-amber-950 serif mb-6 flex items-center gap-3">
          <Mail className="w-6 h-6 text-amber-700"/>Brugerkommunikation
        </h3>
        <form onSubmit={handleSendEmail} className="space-y-6">
          <div>
              <label htmlFor="recipient-group" className="text-sm font-bold">Modtagergruppe</label>
              <select id="recipient-group" value={emailRecipientGroup} onChange={e => setEmailRecipientGroup(e.target.value)} className="w-full mt-1 h-12 px-3 border border-input bg-background rounded-xl text-sm">
                  <option value="all">Alle Brugere</option>
                  <option value="Kollega">Kollega (Gratis)</option>
                  <option value="Kollega+">Kollega+</option>
                  <option value="Semesterpakken">Semesterpakken</option>
                  <option value="Kollega++">Kollega++</option>
              </select>
          </div>
          <div>
              <label htmlFor="email-subject" className="text-sm font-bold">Emne</label>
              <Input id="email-subject" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} required/>
          </div>
          <div className="space-y-2">
              <label className="text-sm font-bold">Besked</label>
              <ReactQuill 
                theme="snow" 
                value={emailBody} 
                onChange={setEmailBody} 
                modules={quillModules}
                placeholder="Skriv din besked her..."
              />
          </div>
          <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSendingEmail || !emailSubject.trim() || !emailBody.trim() || emailBody === '<p><br></p>'}>
                  {isSendingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2" />}
                  Send til {recipientCount} modtagere
              </Button>
          </div>
        </form>
      </section>

    </div>
    {userToDelete && (
        <DeleteUserModal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleConfirmDelete}
          username={userToDelete.username}
        />
      )}
    </>
  );
};

export default AdminUsersPage;
