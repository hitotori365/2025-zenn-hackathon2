import pandas as pd

# 入力ファイル名と出力ファイル名
input_csv = "original_data\hojokin2024.csv"
output_csv = "SubsidyList.csv"

# CSV読み込み
df = pd.read_csv(input_csv, encoding="utf-8")#cp932

# 必要な列だけ抽出（存在しない場合はエラーを防ぐため）
required_columns = ["補助金名", "補助金の概要"]
for col in required_columns:
    if col not in df.columns:
        raise ValueError(f"列 '{col}' がCSVに見つかりません")

# 新しいデータフレーム作成（detail_id, keywordsなし）
new_df = pd.DataFrame({
    "id": ["subsidy_" + str(i+1).zfill(3) for i in range(len(df))],
    "name": df["補助金名"],
    "summary": df["補助金の概要"]
})
#改行を削除
new_df = new_df.applymap(lambda x: str(x).replace("\n", "").replace("\r", "") if isinstance(x, str) else x)
# CSVとして保存
new_df.to_csv(output_csv, sep="\t", index=False, encoding="utf-8-sig")