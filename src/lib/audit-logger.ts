import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, getFirestore } from 'firebase/firestore';

export type AuditLogAction = 
  | 'USER_DELETE' 
  | 'USER_UPDATE' 
  | 'LAW_CREATE' 
  | 'LAW_UPDATE' 
  | 'LAW_DELETE' 
  | 'CAMPAIGN_CREATE' 
  | 'CAMPAIGN_UPDATE' 
  | 'CAMPAIGN_DELETE' 
  | 'SYSTEM_SETTING_UPDATE' 
  | 'MAINTENANCE_TOGGLE'
  | 'SURVEY_DELETE'
  | 'NOTIFICATION_SEND';

export interface AuditLog {
  action: AuditLogAction;
  adminId: string;
  adminName: string;
  targetId?: string;
  targetName?: string;
  details?: any;
  timestamp: any;
}

export const logAdminAction = async (
  action: AuditLogAction,
  adminId: string,
  adminName: string,
  targetId?: string,
  targetName?: string,
  details?: any
) => {
  try {
    const { firestore } = initializeFirebase();
    const logRef = collection(firestore, 'auditLogs');
    await addDoc(logRef, {
      action,
      adminId,
      adminName,
      targetId: targetId || null,
      targetName: targetName || null,
      details: details || null,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};
