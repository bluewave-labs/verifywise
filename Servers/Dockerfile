FROM node:20-alpine

WORKDIR /app
COPY ./package.json ./
RUN npm install

COPY ./ ./
COPY ./SQL_Commands.sql ./SQL_Commands.sql

RUN npm run build

COPY ./templates ./dist/templates

EXPOSE 3000

COPY ./start.sh ./start.sh
RUN chmod +x ./start.sh

CMD ["./start.sh"]
