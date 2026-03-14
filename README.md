# MovieVault - Movie Streaming Platform

A modern web-based movie streaming platform that allows users to watch movies directly on the website after completing payment through M-Pesa.

## Tech Stack

- **Frontend**: React + Tailwind CSS + Video.js
- **Backend**: FastAPI
- **Database**: MongoDB
- **Storage**: Firebase Storage
- **Payment**: M-Pesa Daraja API

## Features

- User authentication (register/login)
- Movie catalog browsing
- M-Pesa payment integration for movie access
- Secure video streaming with Video.js
- Admin dashboard for movie management
- Secure token-based streaming

## Project Structure

```
mv/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py       # Main application
│   │   ├── models.py      # Database models
│   │   ├── schemas.py     # Pydantic schemas
│   │   ├── database.py    # MongoDB connection
│   │   ├── auth.py        # Authentication
│   │   ├── mpesa.py       # M-Pesa integration
│   │   └── routes/        # API routes
│   └── requirements.txt
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   └── services/      # API services
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Set up environment variables in `.env`:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   MPESA_CONSUMER_KEY=your_mpesa_consumer_key
   MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
   MPESA_BUSINESS_SHORT_CODE=your_short_code
   MPESA_PASSKEY=your_passkey
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_PROJECT_ID=your_project_id
   ```

6. Run the backend:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   REACT_APP_API_URL=http://localhost:8000
   REACT_APP_FIREBASE_CONFIG=your_firebase_config
   ```

4. Run the frontend:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Movies
- `GET /api/movies` - Get all movies
- `GET /api/movies/{id}` - Get movie details
- `POST /api/movies` - Create movie (admin)
- `PUT /api/movies/{id}` - Update movie (admin)
- `DELETE /api/movies/{id}` - Delete movie (admin)

### Payments
- `POST /api/payments/initiate` - Initiate M-Pesa payment
- `POST /api/payments/callback` - M-Pesa callback
- `GET /api/payments/status/{id}` - Check payment status

### Streaming
- `GET /api/stream/{movie_id}` - Get streaming URL (requires payment)

## License

MIT
