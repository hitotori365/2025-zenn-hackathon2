import { getUserSession, updateSubsidyMode, saveSelectedSubsidy } from './firestoreService';

export interface PostbackResult {
  success: boolean;
  message: string;
  shouldTransitionToDetailAgent?: boolean;
}

export async function handlePostback(data: string, userId: string): Promise<PostbackResult> {
  try {
    const params = new URLSearchParams(data);
    const action = params.get('action');
    const subsidyId = params.get('subsidyId');
    
    if (action === 'cancel') {
      // isActiveをfalseに更新
      await updateSubsidyMode(userId, false);
      return { 
        success: true, 
        message: '補助金の確認を終了しました。' 
      };
    }
    
    if (action === 'select' && subsidyId) {
      // 選択された補助金情報を取得
      const session = await getUserSession(userId);
      // selectedFromは配列形式で保存されているはずなので、そこから検索
      const subsidyList = session?.selectedSubsidy?.selectedFrom as Array<{id: string, name: string}>;
      const selectedSubsidy = subsidyList?.find(s => s.id === subsidyId);
      
      if (selectedSubsidy) {
        // 選択された補助金をFirestoreに保存
        await saveSelectedSubsidy(userId, selectedSubsidy);
        
        return { 
          success: true, 
          message: `${selectedSubsidy.name}を選択しました。詳細な申請条件を確認するためのヒアリングを開始します。`,
          shouldTransitionToDetailAgent: true
        };
      } else {
        return { 
          success: false, 
          message: '選択された補助金が見つかりませんでした。' 
        };
      }
    }
    
    return { 
      success: false, 
      message: '無効な選択です。' 
    };
    
  } catch (error) {
    console.error('Error handling postback:', error);
    return { 
      success: false, 
      message: 'エラーが発生しました。再度お試しください。' 
    };
  }
}