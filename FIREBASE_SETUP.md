# Firebase Setup Guide

This guide will help you set up Firebase for your Habit Tracker app.

## Firebase Security Rules

The app requires specific security rules to function properly. Follow these steps to set up your Firebase security rules:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Copy the contents of the `firebase.rules` file in this project (use OPTION 1 for testing)
6. Paste the rules into the Firebase console's rules editor
7. Click **Publish** to save the rules

### Important Note About Security Rules

The default security rules in `firebase.rules` require authentication, but this app doesn't implement authentication yet. For testing purposes, use the OPTION 1 rules which allow public access:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**WARNING**: These rules allow anyone to read and write to your database. DO NOT use in production!

## Collection Names

The app uses the following collections:
- `habits` - For storing habit information
- `habit_logs` - For storing habit completion logs (note the underscore)
- `test_collection` - For testing Firebase connectivity

Make sure these collections exist and have the correct permissions.

## Common Issues

If you're experiencing issues with the app not being able to write to Firebase, check the following:

### 1. Firebase Configuration

Check that your Firebase configuration in `config/firebase.ts` is correct and matches your Firebase project. The API key in the default configuration is incomplete and needs to be replaced with your actual API key.

### 2. Security Rules

Ensure that the security rules have been properly set up as described above. For testing, use the public access rules (OPTION 1).

### 3. Collection Names

Make sure you're using the correct collection names:
- `habits` (not `Habits`)
- `habit_logs` (not `habitLogs` or `HabitLogs`)

### 4. Network Connectivity

Ensure that your device has a stable internet connection.

## Debugging

If you're still experiencing issues, you can check the Firebase console's **Logs** section to see if there are any errors related to your requests.

You can also enable debug mode in the Firebase console:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Click on the **Rules Playground** button
6. Test your queries to see if they're being allowed or denied

## Firebase Structure

The app uses the following structure in Firestore:

```
/habits/{habitId} - Habit documents
  - name: string
  - description: string
  - createdAt: timestamp
  - updatedAt: timestamp

/habit_logs/{logId} - Habit log documents
  - habitId: string
  - date: timestamp
  - completed: boolean
  - notes: string (optional)
  - createdAt: timestamp
  - updatedAt: timestamp
```

Make sure your data follows this structure for the app to work correctly. 