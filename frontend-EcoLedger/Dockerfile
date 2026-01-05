FROM --platform=linux/amd64 node:20-alpine

ENV NODE_ENV=development
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm install --legacy-peer-deps

# Copy source
COPY . /app

EXPOSE 3000

# Start dev server (Next.js)
CMD ["npm", "run", "dev"]