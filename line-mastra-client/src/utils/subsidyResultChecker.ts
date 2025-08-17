export function checkSubsidyFound(responseText: string): boolean {
  // 補助金が見つからない場合のパターン
  const noSubsidyPatterns = [
    '該当する補助金が見つかりません',
    '該当する補助金はありません',
    '補助金が見つかりません',
    '見つかりませんでした',
    '該当なし',
    '対象となる補助金がありません',
    '利用できる補助金が見つかりません',
    '条件に合う補助金が見つかりません',
    '申し訳ございませんが、該当する',
    '残念ながら該当する',
  ];

  // レスポンステキストを小文字に変換して比較
  const lowerResponse = responseText.toLowerCase();
  
  // いずれかのパターンに一致すれば補助金なしと判定
  const hasNoSubsidy = noSubsidyPatterns.some(pattern => 
    lowerResponse.includes(pattern.toLowerCase())
  );

  // 補助金が見つかったかどうかを返す（見つからない場合はfalse）
  return !hasNoSubsidy;
}