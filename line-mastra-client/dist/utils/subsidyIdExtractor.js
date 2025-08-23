/**
 * 補助金一覧確認エージェントの応答から補助金情報を抽出する
 */
export function extractSubsidyInfo(responseText) {
    const subsidyInfoList = [];
    // パターン1: "1. IT導入補助金（subsidy_001）" のような形式
    const pattern1 = /(\d+)\.\s*(.+?)（(subsidy_\d+)）/g;
    let match;
    while ((match = pattern1.exec(responseText)) !== null) {
        subsidyInfoList.push({
            id: match[3],
            name: match[2].trim()
        });
    }
    // パターン2: "【subsidy_001】IT導入補助金" のような形式
    const pattern2 = /【(subsidy_\d+)】\s*(.+?)(?=\n|$)/g;
    while ((match = pattern2.exec(responseText)) !== null) {
        // 重複チェック
        if (!subsidyInfoList.some(s => s.id === match[1])) {
            subsidyInfoList.push({
                id: match[1],
                name: match[2].trim()
            });
        }
    }
    // パターン3: 既存のsubsidy_XXX形式のIDのみを検出（名前は不明）
    if (subsidyInfoList.length === 0) {
        const idPattern = /subsidy_\d+/g;
        const matches = responseText.match(idPattern);
        if (matches) {
            const uniqueIds = [...new Set(matches)];
            uniqueIds.forEach(id => {
                subsidyInfoList.push({
                    id: id,
                    name: `補助金 ${id}`
                });
            });
        }
    }
    return subsidyInfoList;
}
/**
 * 補助金一覧確認エージェントの応答から補助金IDを抽出する（後方互換性のため残す）
 */
export function extractSubsidyIds(responseText) {
    const subsidyInfo = extractSubsidyInfo(responseText);
    return subsidyInfo.map(info => info.id);
}
/**
 * 最初の補助金IDを取得する（後方互換性のため残す）
 */
export function getFirstSubsidyId(responseText) {
    const subsidyInfo = extractSubsidyInfo(responseText);
    return subsidyInfo.length > 0 ? subsidyInfo[0].id : null;
}
export function parseSubsidyListResponse(agentResponse) {
    const subsidies = extractSubsidyInfo(agentResponse);
    return {
        subsidies,
        hasMultiple: subsidies.length > 1
    };
}
