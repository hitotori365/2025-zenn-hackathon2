import { db } from '../index';
import { FieldValue } from 'firebase-admin/firestore';
export async function saveUserSession(userId) {
    const sessionData = {
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
    }
    catch (error) {
        console.error('Error saving user session:', error);
        throw error;
    }
}
export async function getUserSession(userId) {
    try {
        const doc = await db.collection('userSessions').doc(userId).get();
        if (!doc.exists) {
            return null;
        }
        const data = doc.data();
        // Firestoreのタイムスタンプを Date オブジェクトに変換
        if (data.subsidyMode?.startedAt) {
            data.subsidyMode.startedAt = data.subsidyMode.startedAt.toDate();
        }
        if (data.subsidyMode?.lastActivityAt) {
            data.subsidyMode.lastActivityAt = data.subsidyMode.lastActivityAt.toDate();
        }
        return data;
    }
    catch (error) {
        console.error('Error getting user session:', error);
        return null;
    }
}
export async function isActiveSessionWithinTimeLimit(userId, timeLimitSeconds = 30) {
    try {
        const session = await getUserSession(userId);
        if (!session || !session.subsidyMode.isActive) {
            return false;
        }
        const now = new Date();
        const startedAt = session.subsidyMode.startedAt;
        const timeDiffSeconds = (now.getTime() - startedAt.getTime()) / 1000;
        return timeDiffSeconds <= timeLimitSeconds;
    }
    catch (error) {
        console.error('Error checking active session:', error);
        return false;
    }
}
export async function updateLastActivityAt(userId) {
    try {
        await db.collection('userSessions').doc(userId).update({
            'subsidyMode.lastActivityAt': new Date(),
        });
        console.log(`Updated lastActivityAt for userId: ${userId}`);
    }
    catch (error) {
        console.error('Error updating lastActivityAt:', error);
        throw error;
    }
}
export async function saveSubsidyList(userId, subsidies) {
    try {
        await db.collection('userSessions').doc(userId).update({
            'selectedSubsidy.selectedFrom': subsidies,
            'subsidyMode.lastActivityAt': new Date(),
        });
        console.log(`Saved subsidy list for userId: ${userId}`, subsidies);
    }
    catch (error) {
        console.error('Error saving subsidy list:', error);
        throw error;
    }
}
export async function updateSubsidyMode(userId, isActive) {
    try {
        await db.collection('userSessions').doc(userId).update({
            'subsidyMode.isActive': isActive,
            'subsidyMode.lastActivityAt': new Date(),
        });
        console.log(`Updated subsidy mode for userId: ${userId}, isActive: ${isActive}`);
    }
    catch (error) {
        console.error('Error updating subsidy mode:', error);
        throw error;
    }
}
export async function saveSelectedSubsidy(userId, selectedSubsidy) {
    try {
        await db.collection('userSessions').doc(userId).update({
            'selectedSubsidy.subsidyId': selectedSubsidy.id,
            'selectedSubsidy.subsidyName': selectedSubsidy.name,
            'subsidyMode.lastActivityAt': new Date(),
        });
        console.log(`Saved selected subsidy for userId: ${userId}`, selectedSubsidy);
    }
    catch (error) {
        console.error('Error saving selected subsidy:', error);
        throw error;
    }
}
