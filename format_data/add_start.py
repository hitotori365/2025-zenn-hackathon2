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
    query = f"""
    ## 命令
    次のURLから、補助金の申し込み開始日を特定してください。
    特定した開始日を、余計な説明や補足を一切付けずに、1行の文字列として出力してください。
    出力は1行のみとすること。
    ## 条件
    出力形式は、「YYYY/MM/DD」 または 「令和○年度」 のように、日付または年度を明確に示す形式とします。
    もし情報を見つけられなかったり記載がなかったりする場合は相槌などは打たず、必ず「不明」の二文字だけを出力してください。
    説明文や補足、相槌は一切禁止です。
    
    ## 入力
    {url}
    ## 出力
    （例：2026/08/23、令和7年度、不明）：
    """
    resp = llm.invoke(
        query,
        tools=[GenAITool(google_search={})],
    )

    # resp.content がリストの場合は最後の要素、文字列なら空白で分割して最後の単語を取得
    if isinstance(resp.content, list):
        target = resp.content[-1]
    else:
        target = str(resp.content).split()[-1]

    print("開始:", target)
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
    formatted_df['start'] = formatted_df['url'].map(lambda url: summarize_url(url, llm))

    # JSONとして保存
    output_file = "SubsidyDetail.json"
    formatted_df.to_json(output_file, orient="records", force_ascii=False, indent=2)
    print(f"\nJSONに保存しました: {output_file}")

if __name__ == "__main__":
    main()
