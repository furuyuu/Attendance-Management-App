# Dockerfile

# ベースイメージ → Node.js 20 LTS
FROM node:20

# タイムゾーン
ENV TZ=Asia/Tokyo

# 作業ディレクトリ作成
WORKDIR /usr/src/app

# package.json, package-lock.json をコピー
COPY package*.json ./

# npm install
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# 公開ポート（3000番）
EXPOSE 3000

# サーバー起動コマンド
CMD [ "npm", "run", "dev" ]
