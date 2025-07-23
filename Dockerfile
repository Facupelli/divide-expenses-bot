#Build stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# generate migrations so they exist in the image
RUN npx drizzle-kit generate

#Production stage
FROM node:20-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
COPY --from=build /app/src ./src

RUN npm ci --legacy-peer-deps

COPY --from=build /app/dist ./dist
COPY --from=build /app/src/modules/ai/prompt.txt ./src/modules/ai/prompt.txt

# startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3000
CMD ["/app/start.sh"]
