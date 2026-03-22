
'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ClipboardList, 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  MessageSquare, 
  Heart, 
  Share2, 
  MoreVertical, 
  Users, 
  GraduationCap, 
  Zap, 
  Sparkles, 
  Loader2, 
  X,
  MapPin,
  Calendar,
  ChevronRight,
  BookOpen,
  Scale,
  Trash2,
  Book
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, getDocs, limit, doc, writeBatch, serverTimestamp, getDoc, addDoc, deleteDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { Post, Comment } from '@/ai/flows/types';
import { Button } from '@/components/ui/button';
import { sendCommentNotificationEmailAction } from '@/app/actions';


const OpslagstavlePageContent = () => {
  const { user, userProfile } = useApp();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<{[key: string]: Comment[]}>({});
  const [likes, setLikes] = useState<{[key: string]: Set<string>}>({});
  const [postsLoading, setPostsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  
  // New state for post creation
  const [newPostData, setNewPostData] = useState({
    title: '',
    content: '',
    category: '',
    bookId: '',
    chapter: '',
    isAnonymous: false,
  });

  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Fetch books for dropdown
  const booksQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'books'), orderBy('title', 'asc')) : null), [firestore]);
  const { data: booksData } = useCollection(booksQuery);

  // Fetch posts
  const postsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'posts'), orderBy('createdAt', 'desc')) : null), [firestore]);
  const { data: fetchedPosts, isLoading: postsDataLoading } = useCollection<Post>(postsQuery);

  // Handle URL params to pre-fill new post modal
  useEffect(() => {
    const bookId = searchParams.get('bookId');
    const bookTitle = searchParams.get('bookTitle');
    const caseTitle = searchParams.get('caseTitle');
    const caseLink = searchParams.get('caseLink');

    if (bookId && bookTitle) {
      setNewPostData(prev => ({
        ...prev,
        category: 'Materiale',
        bookId: bookId,
        title: `Spørgsmål til: ${bookTitle}`
      }));
      setShowNewPostModal(true);
      router.replace('/opslagstavle', { scroll: false });
    } else if (caseTitle && caseLink) {
        setNewPostData(prev => ({
            ...prev,
            category: 'Faglig Debat',
            title: `Debat om: ${caseTitle}`,
            content: `Jeg faldt over denne sag på Folketingets hjemmeside og tænkte, den var relevant for os:\n\n[${caseTitle}](${caseLink})\n\nHvad er jeres tanker om den?`
        }));
        setShowNewPostModal(true);
        router.replace('/opslagstavle', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!showNewPostModal) {
      setPostError(null);
    }
  }, [showNewPostModal]);


  useEffect(() => {
    if (fetchedPosts) {
      setPosts(fetchedPosts);
      setPostsLoading(false);
      
      const likesPromises = fetchedPosts.map(post => 
        getDocs(collection(firestore!, 'posts', post.id, 'likes'))
      );
      const commentsPromises = fetchedPosts.map(post => 
        getDocs(query(collection(firestore!, 'posts', post.id, 'comments'), orderBy('createdAt', 'asc')))
      );

      Promise.all(likesPromises).then(likesSnapshots => {
        const newLikes: {[key: string]: Set<string>} = {};
        likesSnapshots.forEach((snapshot, index) => {
          const postId = fetchedPosts[index].id;
          newLikes[postId] = new Set(snapshot.docs.map(doc => doc.id));
        });
        setLikes(newLikes);
      });

      Promise.all(commentsPromises).then(commentsSnapshots => {
        const newComments: {[key: string]: Comment[]} = {};
        commentsSnapshots.forEach((snapshot, index) => {
          const postId = fetchedPosts[index].id;
          newComments[postId] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
        });
        setComments(newComments);
      });
    }
  }, [fetchedPosts, firestore]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menuContainer = (event.target as HTMLElement).closest('[data-menu-container]');
      if (!menuContainer) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    return posts.filter(post => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (post.title?.toLowerCase() || '').includes(searchLower) || 
                           (post.content?.toLowerCase() || '').includes(searchLower);
      const matchesCategory = !activeCategory || post.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchQuery, activeCategory]);

 const handleLike = async (postId: string) => {
    if (!user || !firestore) return;

    const likeRef = doc(firestore, 'posts', postId, 'likes', user.uid);
    const postRef = doc(firestore, 'posts', postId);

    try {
      await runTransaction(firestore, async (transaction) => {
        const likeDoc = await transaction.get(likeRef);
        const postDoc = await transaction.get(postRef);

        if (!postDoc.exists()) {
          throw "Document does not exist!";
        }

        const currentLikes = likes[postId] || new Set();
        const newLikes = new Set(currentLikes);
        let newLikeCount = postDoc.data().likeCount || 0;

        if (likeDoc.exists()) {
          transaction.delete(likeRef);
          newLikeCount--;
          newLikes.delete(user.uid);
        } else {
          transaction.set(likeRef, { createdAt: serverTimestamp() });
          newLikeCount++;
          newLikes.add(user.uid);
        }
        
        transaction.update(postRef, { likeCount: newLikeCount < 0 ? 0 : newLikeCount });

        setLikes(prev => ({ ...prev, [postId]: newLikes }));
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likeCount: newLikeCount < 0 ? 0 : newLikeCount } : p));
      });
    } catch (error) {
      console.error("Like transaction failed: ", error);
    }
  };
  
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPosting || !newPostData.content.trim() || !newPostData.title.trim() || !newPostData.category || !user || !userProfile || !firestore) return;
    
    setIsPosting(true);
    setPostError(null);
    
    const postData: Omit<Post, 'id' | 'createdAt'> & { createdAt: any } = {
      title: newPostData.title,
      content: newPostData.content,
      category: newPostData.category,
      authorId: user.uid,
      authorEmail: user.email || '',
      membership: userProfile.membership || 'Kollega',
      createdAt: serverTimestamp(),
      likeCount: 0,
      commentCount: 0,
      isAnonymous: newPostData.isAnonymous,
      authorName: newPostData.isAnonymous ? 'Anonym' : (userProfile.username || 'Anonym'),
      authorProfilePicture: newPostData.isAnonymous ? '' : (userProfile.profilePicture || ''),
    };
    
    if (newPostData.bookId && booksData) {
        const selectedBook = booksData.find(b => b.id === newPostData.bookId);
        if (selectedBook) {
            postData.bookId = selectedBook.id;
            postData.bookTitle = selectedBook.title;
            postData.bookAuthor = selectedBook.author;
            if (newPostData.chapter) {
                postData.chapter = newPostData.chapter;
            }
        }
    }
    
    try {
      await addDoc(collection(firestore, 'posts'), postData);
      setShowNewPostModal(false);
      setNewPostData({ title: '', content: '', category: '', bookId: '', chapter: '', isAnonymous: false });
    } catch (error) {
      console.error("Error creating post: ", error);
      setPostError("Der opstod en fejl under oprettelsen af dit opslag. Prøv venligst igen.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!firestore || !window.confirm('Er du sikker på, du vil slette dette opslag?')) return;
    try {
      await deleteDoc(doc(firestore, 'posts', postId));
    } catch (error) {
      console.error("Error deleting post: ", error);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!firestore || !window.confirm('Er du sikker på, du vil slette denne kommentar?')) return;
    try {
      await deleteDoc(doc(firestore, 'posts', postId, 'comments', commentId));
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId].filter(c => c.id !== commentId)
      }));
       await runTransaction(firestore, async (transaction) => {
        const postRef = doc(firestore, 'posts', postId);
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) return;
        const newCommentCount = (postDoc.data().commentCount || 1) - 1;
        transaction.update(postRef, { commentCount: newCommentCount < 0 ? 0 : newCommentCount });
      });
    } catch (error) {
      console.error("Error deleting comment: ", error);
    }
  };

  const handleComment = async (e: React.FormEvent, post: Post) => {
    e.preventDefault();
    if (isCommenting || !commentText.trim() || !user || !userProfile || !firestore) return;
    
    setIsCommenting(true);

    const commentData = {
      content: commentText,
      authorId: user.uid,
      authorName: userProfile.username || 'Anonym',
      authorProfilePicture: userProfile.profilePicture || '',
      createdAt: serverTimestamp(),
    };
    
    try {
      const postRef = doc(firestore, 'posts', post.id);
      const commentsColRef = collection(firestore, 'posts', post.id, 'comments');
      
      await addDoc(commentsColRef, commentData);

      await runTransaction(firestore, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) return;
        const newCommentCount = (postDoc.data().commentCount || 0) + 1;
        transaction.update(postRef, { commentCount: newCommentCount });
      });

      setCommentText('');
      
      if (user.uid !== post.authorId && post.authorEmail) {
        sendCommentNotificationEmailAction({
          postAuthorEmail: post.authorEmail,
          postAuthorName: post.authorName || 'en bruger',
          commenterName: userProfile.username || 'En bruger',
          postTitle: post.title || 'dit opslag',
          postId: post.id,
          authorId: post.authorId
        });
      }

    } catch (error) {
      console.error("Error adding comment: ", error);
    } finally {
      setIsCommenting(false);
    }
  };

  const categories = ['Studiegruppe', 'Faglig Debat', 'Praktik', 'Materiale', 'Andet'];
  const isFormInvalid = !newPostData.title.trim() || !newPostData.content.trim() || !newPostData.category;


  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col selection:bg-rose-100">
      
      <header className="bg-white border-b border-amber-100 px-6 py-8 sticky top-24 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <Link href="/portal" className="p-3 bg-rose-50 text-rose-900 rounded-2xl hover:bg-rose-100 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <ClipboardList className="w-4 h-4 text-rose-700" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-900/50">Kollega-Netværk</span>
              </div>
              <h1 className="text-3xl font-bold text-amber-950 serif">Opslagstavlen</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="search-query"
                name="search-query" 
                type="text" 
                placeholder="Søg i opslag og debatter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-[#FDFCF8] border border-amber-100 rounded-2xl focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all shadow-inner text-sm font-medium"
              />
            </div>
            <button 
              onClick={() => setShowNewPostModal(true)}
              className="px-6 py-4 bg-amber-950 text-white rounded-2xl font-bold shadow-lg hover:bg-rose-900 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nyt opslag</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-6 py-12 grid lg:grid-cols-12 gap-12">
        <aside className="lg:col-span-3 space-y-10 lg:sticky lg:top-48 h-fit">
          
          <section>
             <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
               <Filter className="w-3.5 h-3.5" /> Kategorier
             </h4>
             <div className="grid gap-2">
                <button 
                    onClick={() => setActiveCategory(null)}
                    className={`'w-full text-left px-5 py-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                        !activeCategory ? 'bg-rose-100 text-rose-950 shadow-sm' : 'bg-white border border-amber-50 text-slate-500 hover:bg-rose-50'
                    }`}
                >Alle opslag</button>
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={`'w-full text-left px-5 py-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                      activeCategory === cat ? 'bg-rose-100 text-rose-950 shadow-sm' : 'bg-white border border-amber-50 text-slate-500 hover:bg-rose-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </section>

          <section className="p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] flex items-start gap-4">
             <GraduationCap className="w-8 h-8 text-amber-700 flex-shrink-0" />
             <div>
                <h4 className="text-xs font-black uppercase text-amber-900 mb-2 tracking-widest">Fagligt Kodeks</h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Husk tavshedspligten! Del aldrig personfølsomme oplysninger om borgere. Her debatterer vi jura og metode, ikke konkrete sager med navne.
                </p>
             </div>
          </section>
        </aside>
        
        <main className="lg:col-span-9 space-y-8">
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-amber-950 serif">
                {activeCategory ? `${activeCategory} Opslag` : 'Alle opslag'}
              </h2>
           </div>

           {postsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin"/></div>
           ) : (
             <div className="grid gap-8">
              {filteredPosts.map(post => (
                <article 
                  key={post.id}
                  id={post.id}
                  className={`rounded-[3rem] shadow-sm hover:shadow-lg transition-all overflow-hidden scroll-mt-32 border ${
                    post.membership === 'Kollega+' || post.membership === 'Semesterpakken' || post.membership === 'Kollega++' 
                    ? 'bg-amber-50/50 border-amber-200' 
                    : 'bg-white border-amber-100'
                  }`}
                >
                  <div className="p-8 md:p-10">
                    <div className="flex justify-between items-start mb-8">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-700 font-black text-xs shadow-inner">
                            {post.isAnonymous ? <Users className="w-6 h-6"/> : post.authorName?.charAt(0) || '?'}
                          </div>
                          <div>
                             <h3 className="text-sm font-bold text-amber-950 leading-none">
                                {post.isAnonymous ? 'Anonym' : post.authorName}
                                {userProfile?.role === 'admin' && post.isAnonymous && <span className="text-xs text-rose-500 ml-2">({post.authorName})</span>}
                             </h3>
                             {post.membership && <p className="text-xs text-amber-800/80 font-semibold">{post.membership}</p>}
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            post.category === 'Studiegruppe' ? 'bg-indigo-50 text-indigo-700' : 
                            post.category === 'Faglig Debat' ? 'bg-amber-50 text-amber-700' : 
                            post.category === 'Praktik' ? 'bg-blue-50 text-blue-700' :
                            post.category === 'Materiale' ? 'bg-lime-50 text-lime-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {post.category || 'Andet'}
                          </span>
                           {(user && (post.authorId === user.uid || userProfile?.role === 'admin')) && (
                            <div className="relative" data-menu-container>
                              <button onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} className="text-slate-300 hover:text-amber-950 transition-colors">
                                <MoreVertical className="w-5 h-5" />
                              </button>
                               <div className={`absolute top-full right-0 mt-2 w-32 bg-white border rounded-lg shadow-lg transition-opacity ${openMenuId === post.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                                  <button 
                                    onClick={() => {
                                      handleDeletePost(post.id);
                                      setOpenMenuId(null);
                                    }} 
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg">Slet Opslag</button>
                               </div>
                            </div>
                           )}
                       </div>
                    </div>
                    {post.bookTitle && (
                      <Link href="/pensum" className="inline-block mb-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full hover:bg-slate-100">
                          <Book className="w-3 h-3" />
                          <span className="font-semibold">{post.bookTitle}{post.chapter ? `: ${post.chapter}`: ''}</span>
                        </div>
                      </Link>
                    )}
                    <h2 className="text-2xl font-bold text-amber-950 serif mb-4 leading-tight">{post.title || "Uden titel"}</h2>
                    <p className="text-slate-600 leading-relaxed mb-8 text-base">
                       {post.content}
                    </p>
                    
                    <div className="flex items-center justify-between pt-8 border-t border-amber-50">
                       <div className="flex items-center gap-6">
                          <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 text-slate-400 hover:text-rose-600 transition-colors group">
                             <Heart className={`w-5 h-5 ${likes[post.id]?.has(user!.uid) ? 'fill-rose-600 text-rose-600' : 'fill-transparent'} group-hover:scale-110 transition-transform`} />
                             <span className="text-xs font-bold">{post.likeCount || 0} Synes godt om</span>
                          </button>
                          <button onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)} className="flex items-center gap-2 text-slate-400 hover:text-amber-950 transition-colors group">
                             <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                             <span className="text-xs font-bold">{post.commentCount || 0} Kommentarer</span>
                          </button>
                       </div>
                    </div>
                  </div>

                  {activeCommentPostId === post.id && (
                     <div className="bg-slate-50/70 p-8 border-t border-amber-50">
                       <h4 className="font-bold text-amber-950 mb-4 text-sm">Kommentarer</h4>
                       <div className="space-y-4 mb-6">
                        {comments[post.id]?.map((comment) => (
                           <div key={comment.id} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-600">
                                {comment.authorName?.charAt(0) || '?'}
                              </div>
                              <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200">
                                 <div className="flex justify-between items-center">
                                    <p className="text-xs font-bold text-amber-900">{comment.authorName}</p>
                                    {(user && (comment.authorId === user.uid || post.authorId === user.uid || userProfile?.role === 'admin')) && (
                                      <button onClick={() => handleDeleteComment(post.id, comment.id)} className="p-1 text-slate-300 hover:text-red-500"><X className="w-3 h-3"/></button>
                                    )}
                                 </div>
                                 <p className="text-sm text-slate-700 mt-1">{comment.content}</p>
                              </div>
                           </div>
                        ))}
                        {(!comments[post.id] || comments[post.id].length === 0) && <p className="text-xs text-slate-400 italic">Ingen kommentarer endnu.</p>}
                       </div>

                       <form onSubmit={(e) => handleComment(e, post)} className="flex gap-3">
                          <input id={`comment-${post.id}`} name={`comment-${post.id}`} type="text" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Skriv en kommentar..." className="flex-1 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900" />
                          <Button type="submit" size="sm" disabled={isCommenting || !commentText.trim()}>{isCommenting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Send'}</Button>
                       </form>
                     </div>
                  )}

                </article>
              ))}
           </div>
           )}

           {filteredPosts.length === 0 && !postsLoading && (
             <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-amber-100">
                <Search className="w-12 h-12 text-amber-100 mx-auto mb-4" />
                <p className="text-slate-400 italic">Ingen opslag matchede din søgning.</p>
             </div>
           )}
        </main>
      </div>

      {showNewPostModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-amber-950/70 backdrop-blur-xl" onClick={() => setShowNewPostModal(false)}></div>
          <form onSubmit={handlePost} className="relative bg-[#FDFCF8] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in-up">
             <div className="p-8 border-b border-amber-50 bg-white flex items-center justify-between">
                <h2 className="text-xl font-bold text-amber-950 serif">Opret nyt opslag</h2>
                <button type="button" onClick={() => setShowNewPostModal(false)} className="p-2 hover:bg-amber-50 rounded-xl transition-colors">
                   <X className="w-6 h-6 text-amber-900" />
                </button>
             </div>
             <div className="p-10 space-y-6 max-h-[80vh] overflow-y-auto">
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Kategori</label>
                   <div className="flex flex-wrap gap-2">
                      {categories.map(c => (
                        <button key={c} type="button" onClick={() => setNewPostData({...newPostData, category: c})} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${newPostData.category === c ? 'bg-amber-950 text-white' : 'bg-white border border-amber-100 text-amber-900 hover:bg-amber-100'}`}>
                           {c}
                        </button>
                      ))}
                   </div>
                </div>
                <div>
                   <label htmlFor="post-book" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Link til bog (valgfri)</label>
                   <select id="post-book" name="post-book" value={newPostData.bookId} onChange={e => setNewPostData({...newPostData, bookId: e.target.value})} className="h-12 w-full appearance-none pl-4 pr-10 bg-white border border-amber-100 rounded-xl text-sm">
                      <option value="">Vælg en bog fra pensum...</option>
                      {booksData?.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                   </select>
                </div>
                 {newPostData.bookId && (
                   <div>
                       <label htmlFor="post-chapter" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Specifikt kapitel (valgfri)</label>
                       <input type="text" id="post-chapter" name="post-chapter" placeholder="F.eks. 'Kapitel 3' eller 'Om anerkendelse'" value={newPostData.chapter} onChange={e => setNewPostData({...newPostData, chapter: e.target.value})} className="w-full h-12 px-4 bg-white border border-amber-100 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all" />
                   </div>
                )}
                <div>
                   <label htmlFor="post-title" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Titel</label>
                   <input type="text" id="post-title" name="post-title" placeholder="Hvad handler dit opslag om?" value={newPostData.title} onChange={e => setNewPostData({...newPostData, title: e.target.value})} required className="w-full h-12 px-4 bg-white border border-amber-100 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all" />
                </div>
                <div>
                   <label htmlFor="post-content" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Beskrivelse</label>
                   <textarea id="post-content" name="post-content" placeholder="Skriv dit indhold her..." value={newPostData.content} onChange={e => setNewPostData({...newPostData, content: e.target.value})} required className="w-full h-40 p-4 bg-white border border-amber-100 rounded-2xl focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all resize-none"></textarea>
                </div>
                
                 <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="isAnonymous"
                        checked={newPostData.isAnonymous}
                        onChange={(e) => setNewPostData({ ...newPostData, isAnonymous: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="isAnonymous" className="text-sm text-slate-600">
                        Opret som anonym (kun dit brugernavn er synligt for administratorer)
                    </label>
                 </div>

                {isFormInvalid && !isPosting && (
                    <p className="text-xs text-center text-slate-500 !mt-2">
                        Udfyld venligst titel, indhold og kategori for at kunne publicere.
                    </p>
                )}

                {postError && (
                    <div className="bg-rose-100 border border-rose-300 text-rose-800 p-3 rounded-xl text-center text-sm font-semibold !mt-4">
                        {postError}
                    </div>
                )}

                <button type="submit" disabled={!userProfile || isPosting || isFormInvalid} className="w-full py-5 bg-amber-950 text-white rounded-2xl font-bold shadow-xl hover:bg-rose-900 transition-all disabled:opacity-50 !mt-8">
                   {isPosting ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : (!userProfile ? 'Indlæser profil...' : 'Publicér opslag')}
                </button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

const OpslagstavlenPage = () => {
    const { user, isUserLoading, userProfile } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || userProfile === undefined) {
        return <AuthLoadingScreen />;
    }
    
    if (!user) {
        return <AuthLoadingScreen />;
    }

    return (
        <Suspense fallback={<AuthLoadingScreen />}>
            <OpslagstavlePageContent />
        </Suspense>
    );
};

export default OpslagstavlenPage;

    
