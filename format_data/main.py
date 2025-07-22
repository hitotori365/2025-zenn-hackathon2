import pandas as pd

def load_data(file_path: str) -> pd.DataFrame:
    return pd.read_csv(file_path)

def format_data(data: pd.DataFrame) -> pd.DataFrame:
    data = data[data['各局HPリンク'].notna()]
    return data

def main():
    file_path = "original_data/hojokin2024.csv"
    df = load_data(file_path)
    formatted_df = format_data(df)
    print(formatted_df)
    print(len(df))
    print(len(formatted_df))


if __name__ == "__main__":
    main()
