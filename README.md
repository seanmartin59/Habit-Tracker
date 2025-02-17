# Sean's Habit Tracker

## Scope

### MVP (First Iteration)
- Basic user authentication and profile setup
- Be able to add a daily habit I want to track with:
  - Name
  - Description (optional)
  - Target frequency (daily, specific days of week)
  - Preferred time of day (morning, afternoon, evening)
- Be able to mark a habit as complete/incomplete for a day
- Basic habit history view
- Simple streak counting for individual habits
- Designate habits as "non-negotiable"
- Basic daily progress overview

### Future Iterations
- Allow for notification reminders of habits
- Create a streak that tallies every consecutive day that all non-negotiables are completed
- Create a mobile widget displaying non-negotiable habits
- More advanced habit configurations:
  - Multiple times per day
  - Quantity-based habits (e.g., drink 8 glasses of water)
  - Time-based habits (e.g., meditate for 10 minutes)
- Habit categories/tags
- Progress analytics and insights
- Export/backup functionality
- Offline support

## Tech Stack

### Frontend
- React Native
- Expo
- TypeScript
- React Native Paper (UI components)

### Backend & Services
- Firebase
  - Authentication
  - Firestore (database)
  - Cloud Functions
  - Cloud Messaging (notifications)
- Expo EAS (build service)

### Development Tools
- VS Code
- Git
- npm/yarn

### Testing & Deployment
- Jest
- TestFlight
- App Store Connect
