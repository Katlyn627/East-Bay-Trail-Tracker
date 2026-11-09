# East Bay Trail Tracker

East Bay Trail Tracker is a community-minded trail maintenance and outdoor activity app designed to help hikers and volunteers log cleanup efforts, report trail issues, and grow a virtual forest as a reward for positive environmental impact.

The application combines Firebase authentication, Firestore data persistence, and Firebase Storage for photo uploads. It is built with React, Vite, and Tailwind CSS, with a mobile-first UX tailored to trail reporting and on-the-go cleanup tracking.

## Highlights

- Firebase-powered authentication and onboarding flow
- User profile creation and trail preference setup
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
- Express (for local backend support when needed)

## Project Structure

```text
East-Bay-Trail-Tracker/
├─ public/                           # Static public assets
├─ src/
│  ├─ components/                    # UI modules and reusable interactive features
│  ├─ context/                       # Auth context and app-wide state
│  ├─ firebase.js                    # Firebase initialization and exports
│  ├─ pages/                         # App pages and dashboards
│  ├─ services/                      # Firebase-related service integrations
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
├─ server.js                         # Local Express backend for app support
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

4. Fill in your Firebase credentials in `.env`.

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
npm run server       # start the local Express backend
npm run build        # create a production build
npm run preview      # preview the production build locally
```

## Security Notes

- Keep all real credentials in a local `.env` file and do not commit secret values.

## License

This project is licensed under the MIT license. See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome. For larger changes, please open an issue or pull request with a clear explanation of the proposed feature or fix.

