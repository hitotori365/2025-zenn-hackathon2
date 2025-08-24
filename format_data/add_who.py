from dotenv import load_dotenv
import os
import glob
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from google.ai.generativelanguage_v1beta.types import Tool as GenAITool

def summarize_url(url, llm):
    print(f"\n--- {url} ---")
    query = f"""
    ##命令
    以下のURLから、補助金を利用できる対象を特定してください。
    特定した対象を、余計な説明や補足を一切付けずに、1単語で出力してください。

    ##条件
    出力は1単語のみとすること。
    出力形式は、「中小企業」、「法人」、「個人事業主」、「NPO法人」 のように、利用対象を明確に示す単語とします。
    もし情報を見つけられなかったり記載がなかったりする場合は必ず「不明」と出力してください。
    説明文や補足、相槌は一切禁止です。

    ##入力
    {url}
    """
    resp = llm.invoke(
        query,
        tools=[GenAITool(google_search={})],
    )

    # resp.content がリストの場合は最後の要素、文字列なら空白で最後の単語
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

    # subsidy_json フォルダ内のすべてのJSONを取得
    folder_path = "subsidy_json"
    files = sorted(glob.glob(os.path.join(folder_path, "subsidy_*.json")))

    for file_path in files:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        url = data.get("url", "")
        if url in ["", "NaN", None]:
            data["who"] = "不明"
        else:
            # URL がある場合のみ LLM に問い合わせ
            data["who"] = summarize_url(url, llm)

        # 元のファイルに上書き保存
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
