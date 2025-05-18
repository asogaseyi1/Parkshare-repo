# 🚗 ParkShare

ParkShare is a peer-to-peer parking space sharing app where users can list, search, and reserve parking spots with ease. Built with **React**, **Spring Boot**, **Stripe**, and **MongoDB**.

## ✨ Features

- 🔐 User registration and JWT-based login
- 📍 Parking space listings with title, price, and location
- 📅 Real-time reservations with start/end time selection
- 💳 Stripe payment integration (in progress)
- 📦 Clean backend architecture using Spring Boot + MongoDB

## 🛠️ Tech Stack

| Frontend | Backend | Database | Auth | Payment |
|----------|---------|----------|------|---------|
| React (CRA + TypeScript) | Spring Boot (Java 17) | MongoDB Atlas | JWT | Stripe API |

## 🚀 Getting Started

### Backend

```bash
cd parkshare
./mvnw spring-boot:run


Environment Variables:

    STRIPE_SECRET_KEY

    MONGODB_URI

    JWT_SECRET

### Frontend

cd frontend
npm install
npm start


# API Endpoints
POST /api/auth/register - Register

POST /api/auth/login - Login

GET /api/parking-spaces - List all spaces

POST /api/parking-spaces - Create a parking space

POST /api/reservations/create - Create reservation

