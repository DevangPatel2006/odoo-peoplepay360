FROM node:20-alpine

WORKDIR /app

# Copy backend package definition and root package definition if needed
COPY package.json ./
RUN npm install --omit=dev

COPY src/ ./src/

EXPOSE 5000

CMD ["node", "src/server.js"]
