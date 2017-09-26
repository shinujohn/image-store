FROM node:7
COPY . .
WORKDIR .
CMD ["npm", "start"]
