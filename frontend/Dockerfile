FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --prod
RUN npm install -g serve
EXPOSE 80
CMD ["serve","-s","dist/frontend","-l","80"]
