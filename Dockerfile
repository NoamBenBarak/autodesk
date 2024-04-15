FROM node:12
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV port = 3000
EXPOSE 3000
CMD ["npm", "start"]