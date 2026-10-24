# Indigram web

React + TypeScript client for the Indigram API.

## Development

```bash
cp apps/web/.env.example apps/web/.env
npm install
npm run dev --workspace=@indigram/web
```

The app runs at `http://localhost:5173`. The API must be running at the URL configured in `VITE_API_URL`.

The current client includes account login/registration and the presigned media post flow: select an image or video, upload it directly to storage, and submit it for asynchronous processing.
