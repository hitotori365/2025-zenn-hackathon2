import { db } from '../index';
import { FieldValue } from 'firebase-admin/firestore';

interface UserSession {
  userId: string;
  subsidyMode: {
    isActive: boolean;
    startedAt: Date;
    lastActivityAt: Date;
  };
  selectedSubsidy: {
    subsidyId: string;
    subsidyName: string;
    selectedFrom: string[];
  };
  conversation: {
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }>;
  };
  hearingProgress: {
    requiredInfoList: string[];
    collectedInfo: Record<string, string>;
    missingInfo: string[];
    completionStatus: '進行中' | '完了' | '条件不適合';
  };
}

export async function saveUserSession(userId: string): Promise<void> {
  const sessionData: UserSession = {
    userId,
    subsidyMode: {
      isActive: true,
      startedAt: new Date(),
      lastActivityAt: new Date(),
    },
    selectedSubsidy: {
      subsidyId: 'dummy_id',
      subsidyName: 'ダミー補助金',
      selectedFrom: [],
    },
    conversation: {
      messages: [],
    },
    hearingProgress: {
      requiredInfoList: [],
      collectedInfo: {},
      missingInfo: [],
      completionStatus: '進行中',
    },
  };

  try {
    await db.collection('userSessions').doc(userId).set(sessionData, { merge: true });
    console.log(`User session saved for userId: ${userId}`);
  } catch (error) {
    console.error('Error saving user session:', error);
    throw error;
  }
}

export async function getUserSession(userId: string): Promise<UserSession | null> {
  try {
    const doc = await db.collection('userSessions').doc(userId).get();
    if (!doc.exists) {
      return null;
    }
    const data = doc.data() as UserSession;
    // Firestoreのタイムスタンプを Date オブジェクトに変換
    if (data.subsidyMode?.startedAt) {
      data.subsidyMode.startedAt = (data.subsidyMode.startedAt as any).toDate();
    }
    if (data.subsidyMode?.lastActivityAt) {
      data.subsidyMode.lastActivityAt = (data.subsidyMode.lastActivityAt as any).toDate();
    }
    
    // subsidyIdをconsole.logで確認
    if (data.selectedSubsidy?.subsidyId) {
      console.log(`Retrieved subsidyId for userId ${userId}: ${data.selectedSubsidy.subsidyId}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}

export async function isActiveSessionWithinTimeLimit(userId: string, timeLimitSeconds: number = 30): Promise<boolean> {
  try {
    const session = await getUserSession(userId);
    if (!session || !session.subsidyMode.isActive) {
      return false;
    }
    
    const now = new Date();
    const startedAt = session.subsidyMode.startedAt;
    const timeDiffSeconds = (now.getTime() - startedAt.getTime()) / 1000;
    
    return timeDiffSeconds <= timeLimitSeconds;
  } catch (error) {
    console.error('Error checking active session:', error);
    return false;
  }
}

export async function updateLastActivityAt(userId: string): Promise<void> {
  try {
    await db.collection('userSessions').doc(userId).update({
      'subsidyMode.lastActivityAt': new Date(),
    });
    console.log(`Updated lastActivityAt for userId: ${userId}`);
  } catch (error) {
    console.error('Error updating lastActivityAt:', error);
    throw error;
  }
}

export async function saveSubsidyList(userId: string, subsidies: Array<{id: string, name: string}>): Promise<void> {
  try {
    await db.collection('userSessions').doc(userId).update({
      'selectedSubsidy.selectedFrom': subsidies,
      'subsidyMode.lastActivityAt': new Date(),
    });
    console.log(`Saved subsidy list for userId: ${userId}`, subsidies);
  } catch (error) {
    console.error('Error saving subsidy list:', error);
    throw error;
  }
}

export async function updateSubsidyMode(userId: string, isActive: boolean): Promise<void> {
  try {
    await db.collection('userSessions').doc(userId).update({
      'subsidyMode.isActive': isActive,
      'subsidyMode.lastActivityAt': new Date(),
    });
    console.log(`Updated subsidy mode for userId: ${userId}, isActive: ${isActive}`);
  } catch (error) {
    console.error('Error updating subsidy mode:', error);
    throw error;
  }
}

export async function saveSelectedSubsidy(userId: string, selectedSubsidy: {id: string, name: string}): Promise<void> {
  try {
    await db.collection('userSessions').doc(userId).update({
      'selectedSubsidy.subsidyId': selectedSubsidy.id,
      'selectedSubsidy.subsidyName': selectedSubsidy.name,
      'subsidyMode.lastActivityAt': new Date(),
    });
    console.log(`Saved selected subsidy for userId: ${userId}`, selectedSubsidy);
  } catch (error) {
    console.error('Error saving selected subsidy:', error);
    throw error;
  }
}