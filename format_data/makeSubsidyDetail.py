import pandas as pd

# 入力ファイル名と出力ファイル名
input_csv = "original_data\hojokin2024.csv"
output_json = "SubsidyDetail.json"

# CSV読み込み
df = pd.read_csv(input_csv, encoding="utf-8")#cp932

# 必要な列だけ抽出（存在しない場合はエラーを防ぐため）
required_columns = ["補助金名", "補助金の概要", "所管部署", "問い合わせ先", "各局HPリンク"]
for col in required_columns:
    if col not in df.columns:
        raise ValueError(f"列 '{col}' がCSVに見つかりません")

# 新しいデータフレーム作成
new_df = pd.DataFrame({
    "id": ["subsidy_" + str(i+1).zfill(3) for i in range(len(df))],
    "submit": df["所管部署"],
    "contactInformation": df["問い合わせ先"],
    "url": df["各局HPリンク"]
})

# who, amount, start, end, note を空欄で追加
for col in ["who", "amount", "start", "end"]:
    new_df[col] = ""   # 空の列を追加

# JSONとして保存（UTF-8で整形出力）
new_df.to_json(output_json, orient="records", force_ascii=False, indent=2)
