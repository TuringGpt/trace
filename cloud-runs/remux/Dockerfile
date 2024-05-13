FROM node:18.15.0

WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean

COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY . .

CMD ["node", "server.js"]
