FROM node:20-alpine

WORKDIR /app
COPY ./package.json ./package-lock.json* ./

# Increase timeout and use cache for cross-platform builds
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm ci --prefer-offline --no-audit || npm install

COPY ./ ./
COPY ./SQL_Commands.sql ./SQL_Commands.sql

RUN npm run build

COPY ./templates ./dist/templates

RUN apk add --no-cache dcron
RUN touch /var/log/cron.log
RUN echo "0 0 * * * TZ=UTC cd /app && node dist/utils/logger/upload-logs-to-do.js >> /var/log/cron.log 2>&1" > /etc/crontabs/root

EXPOSE 3000

# CMD ["npm", "start"]

# Copy and setup start script
COPY ./start.sh ./start.sh
RUN chmod +x ./start.sh

CMD ["./start.sh"]
