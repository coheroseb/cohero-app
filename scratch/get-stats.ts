import { adminDb } from './src/firebase/server-init';

async function getStats() {
  const usersSnap = await adminDb.collection('users').count().get();
  const totalUsers = usersSnap.data().count;

  const aiUsageSnap = await adminDb.doc('stats/ai_usage').get();
  const aiUsage = aiUsageSnap.data();
  // If we don't have a direct count, we can estimate from tokens or other fields.
  // Let's see if there's a totalRequests.
  const aiRequests = aiUsage?.totalRequests || 0;

  // Count materials (seminars, curriculums, etc)
  const seminarsSnap = await adminDb.collection('seminars').count().get();
  const curriculumsSnap = await adminDb.collection('curriculums').count().get();
  const totalMaterials = seminarsSnap.data().count + curriculumsSnap.data().count;

  // Count exam trainings
  const simulationsSnap = await adminDb.collection('case_simulations').count().get();
  const trainingsSnap = await adminDb.collection('exam_trainings').count().get();
  const totalTrainings = simulationsSnap.data().count + trainingsSnap.data().count;

  console.log({
    totalUsers,
    aiRequests,
    totalMaterials,
    totalTrainings
  });
}

getStats();
