from dotenv import load_dotenv
import os
import pandas as pd
from langchain_google_genai import ChatGoogleGenerativeAI
from google.ai.generativelanguage_v1beta.types import Tool as GenAITool

def format_data(file_path: str) -> pd.DataFrame:
    data = pd.read_csv(file_path)
    data = data[data['各局HPリンク'].notna()]
    return data.head(3)

def main():
    load_dotenv()
    api_key = os.getenv("API_KEY")
    if not api_key:
        print("API_KEYが設定されていません")
        return

    os.environ["GOOGLE_API_KEY"] = api_key
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0)

    file_path = "original_data/hojokin2024.csv"
    formatted_df = format_data(file_path)

    for idx, row in formatted_df.iterrows():
        url = row['各局HPリンク']
        print(f"\n--- {url} ---")
        query = f"次のURLのページ内容を日本語で200文字以内に要約してください: {url}"
        # google_searchツールを有効化
        resp = llm.invoke(
            query,
            tools=[GenAITool(google_search={})],
        )
        print("要約:", resp.content)

if __name__ == "__main__":
    main()
