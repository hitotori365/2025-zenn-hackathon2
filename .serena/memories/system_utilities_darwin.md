# Darwin (macOS) システムユーティリティコマンド

## ファイル・ディレクトリ操作
```bash
ls -la              # ファイル一覧（隠しファイル含む）
ls -lah             # 人間が読みやすいサイズ表示
find . -name "*.ts" # ファイル検索
grep -r "pattern"   # 再帰的に文字列検索
```

## プロセス管理
```bash
ps aux              # 実行中のプロセス一覧
kill -9 PID         # プロセス強制終了
lsof -i :3000       # ポート3000を使用中のプロセス確認
```

## ネットワーク
```bash
netstat -an | grep LISTEN  # リスニングポート確認
curl http://localhost:3000 # HTTPリクエスト送信
```

## 環境変数
```bash
echo $PATH          # PATH確認
export VAR=value    # 環境変数設定
env                 # すべての環境変数表示
```

## ファイル編集
```bash
nano file.txt       # nanoエディタ
vim file.txt        # vimエディタ
cat file.txt        # ファイル内容表示
head -n 20 file.txt # 先頭20行表示
tail -f log.txt     # ログファイル監視
```

## パーミッション
```bash
chmod +x script.sh  # 実行権限付与
chmod 644 file.txt  # 読み書き権限設定
chown user:group file # 所有者変更
```

## アーカイブ・圧縮
```bash
tar -czf archive.tar.gz dir/  # 圧縮
tar -xzf archive.tar.gz       # 解凍
zip -r archive.zip dir/       # ZIP圧縮
```

## システム情報
```bash
uname -a            # システム情報
df -h               # ディスク使用状況
du -sh dir/         # ディレクトリサイズ
top                 # システムリソース監視
```

## Git操作
```bash
git init            # リポジトリ初期化
git clone URL       # リポジトリクローン
git branch -a       # ブランチ一覧
git log --oneline   # コミット履歴（簡潔）
```

## npm/Node.js関連
```bash
which node          # Node.jsパス確認
node -v             # Node.jsバージョン
npm -v              # npmバージョン
npm list            # インストール済みパッケージ
```

## macOS固有コマンド
```bash
open .              # Finderで現在のディレクトリを開く
pbcopy < file.txt   # ファイル内容をクリップボードにコピー
pbpaste > file.txt  # クリップボードから貼り付け
say "Hello"         # テキスト読み上げ
```