# Sean's Habit Tracker

A simple habit tracking app built with React Native, Expo, TypeScript, and Firebase.

## Features

- Add daily habits to track
- Mark habits as completed for each day
- View habit history and streaks
- Edit and delete habits

## Setup Instructions

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   cd habit-tracker
   npm install
   ```

### Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Firestore Database in your Firebase project
3. In the Firebase console, go to Project Settings > General > Your apps > Web app
4. Register a new web app and get your Firebase configuration
5. Update the Firebase configuration in `config/firebase.ts` with your own credentials:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

6. Set up Firebase security rules by following the instructions in `FIREBASE_SETUP.md`

### Testing Firebase Connection

To verify your Firebase configuration is working correctly:

1. Update the Firebase configuration in `scripts/test-firebase.js` with your credentials
2. Run the test script:
   ```
   node scripts/test-firebase.js
   ```
3. If the test passes, your Firebase configuration is correct
4. If the test fails, check the error message and follow the troubleshooting steps in `FIREBASE_SETUP.md`

### Diagnosing Firebase Issues

If you're having trouble with Firebase, you can use the diagnostic script:

1. Update the Firebase configuration in `scripts/diagnose-firebase.js` with your credentials
2. Run the diagnostic script:
   ```
   node scripts/diagnose-firebase.js
   ```
3. The script will test various aspects of your Firebase setup and report any issues
4. Follow the troubleshooting steps in `FIREBASE_SETUP.md` to resolve any issues

### Running the App

```
npm start
```

Then, scan the QR code with the Expo Go app on your mobile device or press 'a' to open in an Android emulator or 'i' for iOS simulator.

## Troubleshooting

If you encounter issues with the app not being able to write to Firebase:

1. Check your Firebase configuration in `config/firebase.ts`
2. Verify your Firebase security rules are set up correctly (see `FIREBASE_SETUP.md`)
3. Ensure you have a stable internet connection
4. Run the Firebase test script to verify your configuration
5. Run the Firebase diagnostic script to identify specific issues

For more detailed troubleshooting steps, see `FIREBASE_SETUP.md`.

## Project Structure

- `/app` - Main screens and navigation
- `/components` - Reusable UI components
- `/config` - Configuration files (Firebase)
- `/models` - TypeScript interfaces and types
- `/services` - Business logic and API calls
- `/scripts` - Utility scripts for testing and setup

## Usage

### Adding a Habit

1. Tap the "Add Habit" button on the home screen
2. Enter a name and optional description for your habit
3. Tap "Add Habit" to save

### Tracking a Habit

1. Tap the circle next to a habit to mark it as completed for today
2. Tap again to mark it as not completed

### Viewing Habit Details

1. Tap on a habit to view its details
2. See the streak and history of the habit
3. Mark the habit as completed or not completed for today

### Deleting a Habit

1. Go to the habit details screen
2. Tap the trash icon in the top right
3. Confirm deletion

## Future Enhancements

- Notifications
- Habit categories
- Different habit frequencies (daily, weekly, monthly, specific days)
- Data visualization and statistics
- User authentication

## License

MIT
