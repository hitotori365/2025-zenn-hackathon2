from dotenv import load_dotenv
import os
import pandas as pd
from langchain_google_genai import ChatGoogleGenerativeAI
from google.ai.generativelanguage_v1beta.types import Tool as GenAITool

def format_data(file_path: str) -> pd.DataFrame:
    # JSON読み込み
    data = pd.read_json(file_path, encoding="utf-8")
    data = data[data['url'].notna()]
    return data.head(10)

def summarize_url(url, llm):
    print(f"\n--- {url} ---")
    query = f"次のURLの補助金を利用できる対象を一単語だけで出力してください。出力は必ず1語のみ（例: 中小企業, 法人, 個人事業主, NPO法人 など）説明文や補足は禁止。：{url}"
    resp = llm.invoke(
        query,
        tools=[GenAITool(google_search={})],
    )

    # resp.content がリストの場合は最後の要素、文字列なら空白で分割して最後の単語を取得
    if isinstance(resp.content, list):
        target = resp.content[-1]
    else:
        target = str(resp.content).split()[-1]

    print("対象:", target)
    return target

def main():
    load_dotenv()
    
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("API_KEYが設定されていません")
        return

    os.environ["GOOGLE_API_KEY"] = api_key
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0)

    file_path = "SubsidyDetail.json"
    formatted_df = format_data(file_path)

    # URL列に対してsummarize_urlを適用して「who」列を作成
    formatted_df['who'] = formatted_df['url'].map(lambda url: summarize_url(url, llm))

    # JSONとして保存
    output_file = "SubsidyDetail.json"
    formatted_df.to_json(output_file, orient="records", force_ascii=False, indent=2)
    print(f"\nJSONに保存しました: {output_file}")

if __name__ == "__main__":
    main()
