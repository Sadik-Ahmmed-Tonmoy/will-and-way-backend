FROM node:24-bullseye AS builder

WORKDIR /app


# Copy package files
COPY package*.json ./

# Copy prisma schema
COPY prisma ./prisma

# Install dependencies
RUN npm install

# Copy full source
COPY . .

EXPOSE 5017

CMD [ "npm", "run", "dev" ]


