# RideShare App

A modern, full-featured ride-hailing application built with **React Native (Expo)**, **Supabase**, and **Stripe**. Inspired by apps like Uber and inDrive, this project demonstrates a real-time bidding engine where drivers and riders negotiate fares.

## 🚀 Features

- **Real-time Bidding**: Riders request rides, drivers place bids, and riders accept the best offer.
- **Live Location Tracking**: Real-time driver tracking on the map using **PostGIS** and **Supabase Realtime**.
- **Role-based Architecture**: Unified app for both **Riders** and **Drivers** (switchable roles).
- **Secure Payments**: integrated **Stripe** payment sheet for seamless transactions.
- **Offline Capable**: Robust offline support using **MMKV** for local storage.
- **Authentication**: Phone number authentication with OTP via Supabase Auth.

## 🛠 Tech Stack

- **Frontend**: React Native, Expo, NativeWind (Tailwind CSS), Zustand
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth, Realtime)
- **Maps**: react-native-maps, Google Maps API
- **Payments**: Stripe (React Native SDK + Edge Functions)
- **Design**: Stitch (UI Generation)

## 📸 Screenshots

|                         Onboarding                          |                         Rider View                          |                         Driver View                          |
| :---------------------------------------------------------: | :---------------------------------------------------------: | :----------------------------------------------------------: |
| <img src="assets/screenshots/onboarding.png" width="200" /> | <img src="assets/screenshots/rider_view.png" width="200" /> | <img src="assets/screenshots/driver_view.png" width="200" /> |

_(Note: These screenshots are placeholders. Actual app screens may vary)_

## 🏁 Getting Started

### Prerequisites

- Node.js and npm/yarn
- Expo Go app on your device or an emulator
- Supabase account
- Stripe account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/IbroCalculus/RideShareApp.git
   cd RideShareApp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file based on `.env.example`:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the App**
   ```bash
   npx expo start
   ```

## 🏗 Architecture

The app uses a **Bidirectional Realtime** architecture:

1. **Rider** creates a `ride` record (INSERT).
2. **Drivers** subscribed to the `rides` table receive the request.
3. **Driver** creates a `bid` record (INSERT).
4. **Rider** subscribed to `bids` receives the offer.
5. **Rider** accepts a bid -> Ride status updates -> Driver notified.

## 📄 License

This project is licensed under the MIT License.
