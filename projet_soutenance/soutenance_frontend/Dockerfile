### STAGE 1: Build de l'application Angular ###
FROM node:24-alpine as build

WORKDIR /usr/src/app

# Copier uniquement package.json et package-lock.json pour optimiser le cache
COPY package*.json ./

RUN npm install

# Copier tout le code source
COPY . .

# Build Angular en production (Angular 19)
RUN npm run build -- --configuration production

### STAGE 2: Serveur Nginx ###
FROM nginx:stable-alpine

# Copier la config nginx (attention, nom du fichier dans nginx.conf plus standard : default.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers build Angular depuis la première étape
COPY --from=build /usr/src/app/dist/soutenance_frontend /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
