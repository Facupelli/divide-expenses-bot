#Build stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

RUN npm install -g tsx

#Production stage
FROM node:20-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# copy lock file too, then install only prod deps
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# compiled JS from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/modules/ai/prompt.txt ./src/modules/ai/prompt.txt

# to have drizzle schema and config
COPY --from=build /app/src /app/src

# copy tsx binary (≈ 5 MB)
COPY --from=build /usr/local/bin/tsx /usr/local/bin/tsx

# startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3000
CMD ["/app/start.sh"]
