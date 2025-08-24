import pandas as pd
import numpy as np
import google.generativeai as genai
import os
from dotenv import load_dotenv

def add_embeddings_to_csv():
    # .envファイルの読み込み
    load_dotenv('../.env')
    api_key = os.getenv('API_KEY')
    
    if not api_key:
        raise ValueError("API_KEY not found in .env file")
    
    # Gemini APIの設定
    genai.configure(api_key=api_key)
    
    # CSVファイルを読み込み（タブ区切り）
    df = pd.read_csv('hojokin2024.csv', sep='\t').head(10)
    
    # 全ての要素から半角カンマを削除
    df = df.replace(',', '', regex=True)
    
    print(f"Processing {len(df)} rows...")
    
    # エンベディングを格納するリスト
    embeddings = []
    
    # 各行のsummaryからエンベディングを生成
    for idx, row in df.iterrows():
        summary_text = row['summary']
        
        try:
            # Gemini APIを使ってエンベディングを生成
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=summary_text,
                task_type="RETRIEVAL_DOCUMENT",
                output_dimensionality=768
            )
            
            # エンベディングを取得し、正規化
            embedding_values = np.array(result['embedding'])
            normalized_embedding = embedding_values / np.linalg.norm(embedding_values)
            
            # リストに変換して追加
            embeddings.append(normalized_embedding.tolist())
            
            print(f"Processed row {idx + 1}/{len(df)}: {row['id']}")
            
        except Exception as e:
            print(f"Error processing row {idx + 1}: {e}")
            # エラーの場合はNoneを追加
            embeddings.append(None)
    
    # embedカラムを追加
    df['embed'] = embeddings
    
    # 結果をCSVファイルに保存
    output_filename = 'hojokin2024_with_embeddings.csv'
    df.to_csv(output_filename, index=False)
    
    print(f"Embeddings added successfully! Output saved as '{output_filename}'")
    print(f"Successfully processed: {len([e for e in embeddings if e is not None])} rows")

if __name__ == "__main__":
    add_embeddings_to_csv()