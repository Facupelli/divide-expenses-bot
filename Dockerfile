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

# copy lock file too, then install only prod deps
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# compiled JS from build stage
COPY --from=build /app/dist ./dist

COPY --from=build /app/src/modules/ai/prompt.txt ./src/modules/ai/prompt.txt

EXPOSE 3000
CMD ["node", "dist/index.js"]
