# User Notification System

## Overview
A toast-style notification system has been added to the Digital Humanities Dashboard to provide real-time feedback to users.

## Features

### 1. **Multiple Notification Types**
- **Info** (blue): General information messages
- **Success** (green): Successful actions or confirmations
- **Warning** (amber/yellow): Important warnings or alerts
- **Error** (red): Error messages

### 2. **Auto-dismiss**
- Notifications automatically disappear after a configurable duration (default: 5 seconds)
- Can be set to 0 for persistent notifications

### 3. **Manual Dismiss**
- Users can close notifications manually by clicking the X button

### 4. **Smooth Animations**
- Slide-in animation when notifications appear
- Slide-out animation when dismissing
- Positioned in top-right corner for non-intrusive user experience

## Implementation Details

### Components Added:
1. **NotificationContext**: React Context for managing notification state
2. **NotificationProvider**: Provider component that wraps the app
3. **NotificationContainer**: Container for rendering all active notifications
4. **Notification**: Individual notification component with styling and animations

### Usage in Dashboard:
- **Welcome message**: Shows when the dashboard first loads
- **Tab change notifications**: Provides feedback when switching between analysis views

## How to Use

To add a notification anywhere in the app, use the `addNotification` function from the context:

```javascript
const { addNotification } = useNotification();

// Examples:
addNotification('Your message here', 'success', 3000);
addNotification('Warning message', 'warning', 5000);
addNotification('Error occurred', 'error', 4000);
addNotification('Information', 'info', 3000);
```

### Parameters:
- `message` (string): The notification text
- `type` (string): One of 'info', 'success', 'warning', or 'error' (default: 'info')
- `duration` (number): Time in milliseconds before auto-dismiss (default: 5000, set to 0 for persistent)

## Visual Design
- Uses Tailwind CSS for styling
- Integrates FontAwesome icons for visual indicators
- Matches the existing dashboard design language
- Responsive and works on all screen sizes
