# Indigram web

React + TypeScript client for the Indigram API.

The UI is organized by feature under `src/components`: authentication, home/upload, profile, layout, and shared UI feedback. API request modules live under `src/api`, shared response contracts live under `src/types`, and styling uses Tailwind CSS v4 through the Vite plugin.

## Development

```bash
cp apps/web/.env.example apps/web/.env
npm install
npm run dev --workspace=@indigram/web
```

The app runs at `http://localhost:5173`. The API must be running at the URL configured in `VITE_API_URL`.

The current client includes account login/registration and the presigned media post flow: select an image or video, upload it directly to storage, and submit it for asynchronous processing.
