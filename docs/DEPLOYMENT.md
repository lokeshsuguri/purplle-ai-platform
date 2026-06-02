# Deployment Guide

## Docker Compose (Recommended)

```yaml
# docker-compose.yml
version: '3.9'
services:
  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: purplle_ai

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      MONGO_URI: mongodb://mongo:27017/purplle_ai
      NODE_ENV: production
      OCCUPANCY_THRESHOLD: 50
    depends_on:
      - mongo

  ai-service:
    build: ./ai-service
    ports:
      - "8000:8000"
    environment:
      BACKEND_URL: http://backend:5000
    volumes:
      - ./videos:/videos   # mount video files here

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongo_data:
```

## Backend Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/app.js"]
```

## AI Service Dockerfile

```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "src/main.py"]
```

## Frontend Dockerfile

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure MongoDB Atlas URI
- [ ] Add Redis for Socket.IO adapter (multi-instance)
- [ ] Set `ALLOWED_ORIGINS` to production domain
- [ ] Enable HTTPS (nginx/cert-manager)
- [ ] Add MongoDB indexes: `db.events.createIndex({timestamp:-1,event_type:1})`
- [ ] Schedule daily occupancy reset: `0 8 * * * curl -X POST /api/occupancy/reset`
- [ ] Set up log aggregation (CloudWatch / Datadog)
