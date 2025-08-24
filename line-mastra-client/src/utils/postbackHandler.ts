import { getUserSession, updateSubsidyMode, saveSelectedSubsidy } from './firestoreService';

export interface PostbackResult {
  success: boolean;
  message: string;
  shouldTransitionToDetailAgent?: boolean;
}

// アクションハンドラーのマップ
const actionHandlers = {
  cancel: async (userId: string): Promise<PostbackResult> => {
    await updateSubsidyMode(userId, false);
    return { 
      success: true, 
      message: '補助金の確認を終了しました。' 
    };
  },
  
  select: async (userId: string, subsidyId?: string): Promise<PostbackResult> => {
    if (!subsidyId) {
      return { 
        success: false, 
        message: '補助金IDが指定されていません。' 
      };
    }
    
    const selectedSubsidy = await findSelectedSubsidy(userId, subsidyId);
    
    if (!selectedSubsidy) {
      return { 
        success: false, 
        message: '選択された補助金が見つかりませんでした。' 
      };
    }
    
    await saveSelectedSubsidy(userId, selectedSubsidy);
    
    return { 
      success: true, 
      message: `${selectedSubsidy.name}を選択しました。詳細な申請条件を確認するためのヒアリングを開始します。`,
      shouldTransitionToDetailAgent: true
    };
  }
};

// 補助金を検索する純粋関数
async function findSelectedSubsidy(userId: string, subsidyId: string): Promise<{id: string, name: string} | undefined> {
  const session = await getUserSession(userId);
  const subsidyList = session?.selectedSubsidy?.selectedFrom as Array<{id: string, name: string}> | undefined;
  return subsidyList?.find(s => s.id === subsidyId);
}

// パラメータを解析する純粋関数
function parsePostbackData(data: string): { action: string | null, subsidyId: string | null } {
  const params = new URLSearchParams(data);
  return {
    action: params.get('action'),
    subsidyId: params.get('subsidyId')
  };
}

export async function handlePostback(data: string, userId: string): Promise<PostbackResult> {
  try {
    const { action, subsidyId } = parsePostbackData(data);
    
    // アクションが存在しない場合の早期リターン
    if (!action || !(action in actionHandlers)) {
      return { 
        success: false, 
        message: '無効な選択です。' 
      };
    }
    
    // 対応するハンドラーを実行
    const handler = actionHandlers[action as keyof typeof actionHandlers];
    return await handler(userId, subsidyId || undefined);
    
  } catch (error) {
    console.error('Error handling postback:', error);
    return { 
      success: false, 
      message: 'エラーが発生しました。再度お試しください。' 
    };
  }
}