# 🚗 ParkShare

ParkShare is a peer-to-peer parking space sharing app where users can list, search, reserve, and message each other about parking spots with ease. Built with **React**, **Spring Boot**, **Stripe**, and **MongoDB**.

## ✨ Features

- 🔐 User registration and JWT-based login
- 📍 Parking space listings with title, price, description, and map-based location search
- 📅 Real-time reservations with start/end time selection and double-booking protection
- 💰 Airbnb-style pricing — itemized guest service fee, host service fee, and country-based tax on every quote and booking
- 🏷️ Special rates and per-guest discounts that hosts can attach to a listing
- 💳 Live Stripe payment integration — real charges at booking time
- ↩️ Booking cancellation with automatic Stripe refunds, from either the guest or host side
- 📖 A "My Bookings" page covering both a guest's trips and a host's incoming bookings
- 💬 In-app messaging between guests and hosts, per listing
- 🌗 Light and dark mode
- 📦 Clean backend architecture using Spring Boot + MongoDB

## 🛠️ Tech Stack

| Frontend | Backend | Database | Auth | Payment |
|----------|---------|----------|------|---------|
| React 19 (CRA + TypeScript) | Spring Boot 3 (Java 21) | MongoDB Atlas | JWT | Stripe API |

## 🚀 Getting Started

### Backend

```bash
cd Parkshare
./mvnw spring-boot:run
```

Create a `Parkshare/.env` file (gitignored) with:

```
STRIPE_SECRET_KEY=sk_test_...
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/parkshare?retryWrites=true&w=majority
```

Both are read from `.env` automatically — no shell environment variables needed. JWT signing uses a key generated at startup, so no `JWT_SECRET` is required.

### Frontend

```bash
cd frontend
npm install
npm start
```

Create a `frontend/.env` file (gitignored) with:

```
REACT_APP_GOOGLE_MAPS_API_KEY=...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

The Google Maps key powers location search/autocomplete on listings, and the Stripe publishable key is required for the card payment form to render.

## API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Log in

### Parking spaces
- `GET /api/parking-spaces` — List all spaces
- `POST /api/parking-spaces` — Create a parking space
- `GET /api/parking-spaces/{id}` — Get a space by id
- `GET /api/parking-spaces/owner/{email}` — List a host's own spaces
- `GET /api/parking-spaces/{id}/price-quote` — Itemized price quote for a candidate booking window
- `PUT /api/parking-spaces/{id}` — Update a space
- `DELETE /api/parking-spaces/{id}` — Delete a space

### Special rates & discounts
- `POST /api/parking-spaces/{id}/special-rates` — Add a special rate
- `GET /api/parking-spaces/{id}/special-rates` — List a space's special rates
- `DELETE /api/parking-spaces/{id}/special-rates/{rateId}` — Remove a special rate
- `POST /api/parking-spaces/{id}/discounts` — Add a per-guest discount
- `GET /api/parking-spaces/{id}/discounts` — List a space's discounts
- `DELETE /api/parking-spaces/{id}/discounts/{discountId}` — Remove a discount

### Reservations
- `POST /api/reservations/create` — Create a reservation (charges the guest's card via Stripe)
- `GET /api/reservations/mine` — The current user's own bookings
- `GET /api/reservations/hosting` — Bookings on the current user's listings
- `POST /api/reservations/{id}/cancel` — Cancel a booking and refund the guest via Stripe

### Messaging
- `POST /api/conversations` — Start (or find) a conversation about a listing
- `GET /api/conversations` — List the current user's conversations
- `GET /api/conversations/{id}/messages` — Fetch messages in a conversation
- `POST /api/conversations/{id}/messages` — Send a message

### Pricing
- `GET /api/pricing/config` — Current guest/host service fee rates
