#Build stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

#Production stage
FROM node:20-alpine AS production
ENV NODE_ENV=production    
WORKDIR /app

COPY package*.json .
RUN npm ci --only=production && npm cache clean --force

COPY --from=build /app/dist ./dist

CMD ["node", "dist/index.js"]
