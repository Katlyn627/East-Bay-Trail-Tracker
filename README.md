# East Bay Trail Tracker

East Bay Trail Tracker is a community-minded trail maintenance and outdoor activity app designed to help hikers, runners, and volunteers log cleanup efforts, report trail issues, connect fitness data, and grow a virtual forest as a reward for positive environmental impact.

The application combines Firebase authentication, Firestore data persistence, Firebase Storage for photo uploads, and Strava OAuth for activity linking. It is built with React, Vite, and Tailwind CSS, with a mobile-first UX tailored to trail reporting and on-the-go cleanup tracking.

## Highlights

- Firebase-powered authentication and onboarding flow
- User profile creation and trail preference setup
- Strava OAuth connection and recent activity linking
- Trail cleanup reporting with issue type selection and optional photo upload
- Firebase Storage uploads for maintenance and cleanup images
- Gamified virtual forest and achievement system
- Points, saplings, and cleanup stats tracked in Firestore
- Mobile-friendly dashboard experience for volunteers and trail stewards

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Firebase Auth, Firestore, Storage
- Strava OAuth and activity API
- Express (for local token-exchange debugging and local server support)

## Project Structure

```text
East-Bay-Trail-Tracker/
├─ api/
│  └─ strava-token.js               # Serverless Strava token exchange handler
├─ public/                           # Static public assets
├─ src/
│  ├─ components/                    # UI modules and reusable interactive features
│  ├─ context/                       # Auth context and app-wide state
│  ├─ firebase.js                    # Firebase initialization and exports
│  ├─ pages/                         # App pages and dashboards
│  ├─ services/                      # Firebase/Strava service integrations
│  ├─ styles/                        # Global styling and utility layers
│  ├─ utils/                         # Helper utilities such as image upload logic
│  ├─ App.jsx                        # App routing and layout
│  ├─ main.jsx                       # App entry point
│  └─ ...
├─ .env.example                      # Safe example environment template
├─ .gitignore                        # Standard ignores for env files, logs, and build output
├─ firestore.rules                   # Firestore security rules reference
├─ index.html                        # HTML shell for Vite
├─ LICENSE                           # License information
├─ package.json                      # Scripts and dependency metadata
├─ server.js                         # Local Express backend for backend token exchange testing
├─ tailwind.config.js                # Tailwind configuration
├─ tsconfig.json                     # TypeScript config (if used by tooling)
├─ README.md                         # Project documentation
└─ vite.config.js                   # Vite configuration
```

## Features

### Authentication and profiles

- Secure email/password signup and login
- Google sign-in support via Firebase Auth
- Profile setup wizard for trail preferences, home location, bio, and units
- User records stored in Firestore under `users/{uid}`

### Trail cleanup reporting

- Report issues such as litter, overgrowth, downed tree, and erosion
- Capture bag counts and notes
- Upload cleanup photos to Firebase Storage
- Save report objects to a `reports` collection in Firestore
- Reward users with points and saplings for participation

### Strava integration

- OAuth redirect using Strava client credentials
- Token exchange using the official Strava token endpoint
- Storage of access and refresh tokens in the user profile
- Recent activities can be linked to cleanup reports

### Gamification

- Points and saplings accrue for cleanup work
- Users can plant virtual saplings in a forest plot
- Achievement badges unlock based on milestones such as cleanup volume, tree growth, and logged miles

## Local Development Setup

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Create a local environment file based on the example:

```bash
cp .env.example .env
```

4. Fill in your Firebase and Strava credentials in `.env`.

5. Start the frontend:

```bash
npm run dev
```

6. If you are testing the local backend token exchange flow, start the proxy server as well:

```bash
npm run server
```

## Environment Variables

The project expects the following environment variables.

### Frontend Firebase

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Strava

```env
VITE_STRAVA_CLIENT_ID=your_strava_client_id
VITE_STRAVA_CLIENT_SECRET=your_strava_client_secret
VITE_STRAVA_REDIRECT_URI=http://localhost:5174/auth/strava-callback
```

### Optional server-side token exchange

```env
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
VITE_STRAVA_REDIRECT_URI=http://localhost:5174/auth/strava-callback
PORT=3001
```

## Strava OAuth Notes

The app currently supports a direct in-browser token exchange flow against Strava’s public OAuth endpoint, which removes the need for a local backend during client-side testing. The project also includes a backend token exchange route in `server.js` and `api/strava-token.js` for debugging and server-side compatibility.

## Firebase and Firestore Setup

The app expects a Firebase project with:

- Firebase Authentication enabled
- Google Sign-In enabled
- Firestore initialized
- Storage enabled for `trail-reports/` uploads

User data is stored in `users/{uid}` and reports are stored in a `reports` collection.

## Scripts

```bash
npm run dev          # start the Vite frontend
npm run server       # start the local Express Strava token server
npm run build        # create a production build
npm run preview      # preview the production build locally
```

## Security Notes

- Keep all real credentials in a local `.env` file and do not commit secret values.
- Do not expose production Strava secrets in browser code for production deployment.
- Use a secure serverless or backend endpoint in production if you want to keep client secrets out of the frontend bundle.

## License

This project is licensed under the MIT license. See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome. For larger changes, please open an issue or pull request with a clear explanation of the proposed feature or fix.

