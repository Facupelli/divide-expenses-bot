#Build stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

#Production stage
FROM node:20-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy compiled JavaScript from build stage
COPY --from=build /app/dist ./dist

# Copy your prompt file
COPY --from=build /app/src/modules/ai/prompt.txt ./src/modules/ai/prompt.txt

# Copy migration files from the correct location
COPY --from=build /app/src/db/migrations ./src/db/migrations

ENV DATABASE_PATH=/app/data/app.db
ENV SQLITE_PATH=/app/data/app.db

EXPOSE 3000
CMD ["node", "dist/index.js"]
