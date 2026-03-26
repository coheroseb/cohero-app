'use server';

import { adminFirestore, admin } from '@/firebase/server-init';

export async function submitPublicReviewAction(data: {
  institutionId: string;
  institutionName: string;
  rating: number;
  reviewText: string;
  userName: string;
  userEmail?: string;
  isAnonymous?: boolean;
}) {
  try {
    const reviewData = {
      ...data,
      isPublic: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending' // Maybe add a moderation step for public reviews
    };

    await adminFirestore.collection('institution_reviews').add(reviewData);
    
    // Also update a counter or something if needed, but for now just add the doc
    return { success: true };
  } catch (error) {
    console.error("Error submitting public review:", error);
    return { success: false, error: "Kunne ikke gemme din bedømmelse." };
  }
}

export async function searchInstitutionsAction(query: string, id?: string) {
  try {
    if (id) {
        const doc = await adminFirestore.collection('institutions').doc(id).get();
        if (doc.exists) {
            return [{ id: doc.id, ...doc.data() }];
        }
        return [];
    }

    const searchStr = query.toLowerCase().trim();
    if (searchStr.length < 2) return [];

    const endStr = searchStr.replace(/.$/, c => String.fromCharCode(c.charCodeAt(0) + 1));
    
    const snapshot = await adminFirestore.collection('institutions')
      .where('search_name', '>=', searchStr)
      .where('search_name', '<', endStr)
      .limit(10)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error searching institutions:", error);
    return [];
  }
}

export async function deleteReviewAction(id: string) {
  try {
    const { adminFirestore } = await import('@/firebase/server-init');
    await adminFirestore.collection('institution_reviews').doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error("Error deleting review:", error);
    return { success: false, error: "Kunne ikke slette bedømmelsen." };
  }
}

export async function getReviewsAction() {
  try {
    const { adminFirestore } = await import('@/firebase/server-init');
    const snapshot = await adminFirestore.collection('institution_reviews')
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString()
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

export async function getTopRatedInstitutionsAction() {
  try {
    const { adminFirestore } = await import('@/firebase/server-init');
    const snapshot = await adminFirestore.collection('institution_reviews')
      .where('isPublic', '==', true)
      .get();
    
    const stats: Record<string, { name: string, total: number, count: number, id: string }> = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const id = data.institutionId;
      if (!id) return;
      
      if (!stats[id]) {
        stats[id] = { name: data.institutionName, total: 0, count: 0, id };
      }
      stats[id].total += data.rating;
      stats[id].count += 1;
    });

    const results = Object.values(stats).map(s => ({
      ...s,
      average: Number((s.total / s.count).toFixed(1))
    })).sort((a, b) => b.average - a.average || b.count - a.count);

    return results;
  } catch (error) {
    console.error("Error getting top rated institutions:", error);
    return [];
  }
}
