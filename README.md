# AgriNetwork

AgriNetwork is a React + Vite frontend with an Express/MongoDB backend in the `backend/` directory.

## Frontend setup

1. Install dependencies in the repo root:

```bash
yarn install
```

2. Create a frontend env file from the template:

```powershell
Copy-Item .env.example .env
```

For local development, the frontend expects the backend at `http://localhost:5000`.

3. Start the frontend:

```bash
yarn dev
```

## Backend setup

1. Install backend dependencies:

```bash
cd backend
yarn install
```

2. Create the backend env file:

```powershell
Copy-Item .env.example .env
```

3. Set at least these backend values:

- `MONGO_URI`
- `JWT_SECRET`
- `PORT=5001`
- `FRONTEND_URL=http://localhost:5173`
- `BACKEND_PUBLIC_URL=http://localhost:5001`
- Either configure `SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWORD`, or set `SSLCOMMERZ_MOCK_MODE=true` for local development

4. Start the backend:

```bash
yarn dev
```

## Notes

- The frontend uses `VITE_API_URL` for API requests.
- `VITE_SOCKET_URL` can be omitted when sockets use the same backend URL, but setting both keeps local setup explicit.
