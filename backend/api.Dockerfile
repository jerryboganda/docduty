FROM node:22-alpine

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend ./
COPY web-app ../web-app

RUN mkdir -p /app/backend/data/uploads

ENV NODE_ENV=production
ENV PORT=3001
ENV UPLOADS_DIR=/app/data/uploads

EXPOSE 3001

CMD ["npm", "run", "start"]
