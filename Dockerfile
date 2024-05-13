# Node.jsの公式Dockerイメージをベースに作成
FROM node:18

# アプリケーションディレクトリを作成
WORKDIR /usr/src/app

# アプリケーションの依存関係をインストールするためのファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションのソースをコピー
COPY . .

# アプリケーションがリッスンするポートを指定
EXPOSE 8080

# アプリケーションを実行
CMD [ "node", "server/app.mjs" ]