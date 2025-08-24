import pandas as pd
import json
import os

# 入力ファイル名
input_csv = r"original_data\hojokin2024.csv"

# 出力フォルダ
output_dir = "subsidy_json"
os.makedirs(output_dir, exist_ok=True)

# CSV読み込み
df = pd.read_csv(input_csv, encoding="utf-8")  # cp932 に変える場合あり

# 必要な列チェック
required_columns = ["補助金名", "補助金の概要", "所管部署", "問い合わせ先", "各局HPリンク"]
for col in required_columns:
    if col not in df.columns:
        raise ValueError(f"列 '{col}' がCSVに見つかりません")

# 各行ごとに保存
for j in range(len(df)):
    row = df.iloc[j]

    # urlが空文字やNaNなら文字列 "NaN" にする
    url = row["各局HPリンク"]
    if pd.isna(url) or url == "":
        url = "NaN"

    # 1行分を辞書に変換
    data = {
        "id": f"subsidy_{j+1:03}",
        "submit": row["所管部署"],
        "contactInformation": row["問い合わせ先"],
        "url": url,
        "who": "",
        "amount": "",
        "start": "",
        "end": ""
    }

    # 出力ファイル名
    output_json = os.path.join(output_dir, f"subsidy_{j+1:03}.json")

    # JSON保存（要素だけ）
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print(f"個別JSONファイルを {output_dir} に保存しました。")
