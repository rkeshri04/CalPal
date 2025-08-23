# CalPal

CalPal is a cross-platform mobile application for tracking food purchases, nutritional intake, and personal health metrics. Built with React Native, Expo, and Redux Toolkit, CalPal helps users log foods (via barcode scanning or manual entry), monitor their spending, and visualize their weight/BMI trends over time.

## Features

- **Food Logging:**  
  - Scan barcodes to quickly log foods using Open Food Facts.
  - Manually add foods with nutritional details, cost, and weight.
  - Edit or delete logged foods.

- **Analytics & Insights:**  
  - Visualize weight and BMI history with interactive charts.
  - View summaries of calories, macros, and spending over various time frames.
  - Get helpful tips for healthy eating and consistent tracking.

- **User Profile:**  
  - Store age, height, weight, and preferred unit system (US/Metric).
  - BMI is calculated and tracked over time.
  - Weekly prompts to update weight/height for accurate analytics.

- **Local-First & Privacy:**  
  - All data is stored locally on the device.
  - No data is sent to external servers.

- **Modern UI:**  
  - Themed interface with support for light/dark mode.
  - Tab navigation for Home, Restaurant, Analytics, and Profile.

## Tech Stack

- **React Native** (with Expo)
- **Redux Toolkit** for state management
- **TypeScript** for type safety
- **react-native-chart-kit** and custom SVG for charts
- **react-native-popup-menu** for contextual actions
- **Open Food Facts API** for barcode lookups

## Project Structure

- `app/` — Main application screens and navigation.
- `components/` — Reusable UI components (modals, charts, etc).
- `store/` — Redux slices and store configuration.
- `constants/` — Color themes and static values.
- `hooks/` — Custom React hooks.
- `scripts/` — Utility scripts (e.g., project reset).

### Restaurant Menu Finder

- The `app/(tabs)/restaurant.tsx` file implements a searchable, filterable restaurant menu explorer.
- Users can:
  - Select a restaurant (currently McDonald's).
  - Search menu items by name.
  - Filter by calories and protein range.
  - View menu sections and nutritional info.
  - Infinite scroll and collapsible sections for large menus.

## Notes

- This project is for personal/local use and does not sync data to the cloud.
- All nutritional and spending data is stored on your device.
- For barcode scanning, camera permissions are required.

## License

MIT

