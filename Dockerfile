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

# copy lock file too, then install only prod deps
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && \
    npm install drizzle-kit --no-save  

# compiled JS from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/modules/ai/prompt.txt ./src/modules/ai/prompt.txt

# to have drizzle schema and config
COPY --from=build /app/src /app/src

# startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3000
CMD ["/app/start.sh"]
