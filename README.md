# Doozy

A social media to-do app that combines task management with social interaction, allowing users to create and share accomplishments with friends. It makes organizing daily tasks engaging by integrating social features like following friends, commenting on tasks, and viewing shared timelines of activities. Designed to foster productivity through connection, this app helps users stay motivated and accountable while managing their personal and collaborative goals.

## Watch the demo
[![Watch the demo](https://img.youtube.com/vi/y3X5wKtbIBE/0.jpg)](https://www.youtube.com/watch?v=y3X5wKtbIBE)

## Tech Stack

Frontend: React Native (Expo)
Backend: Node.js, Express
Database: MySQL
Authentication: JWT
Storage: AWS S3

## Installation and Running

1. **Clone the repository**

- git clone https://github.com/adiaz129/Doozy-v2.git

2. **Backend Setup**

- cd backend
- Install Dependencies:
- npm install / yarn install (depending on your package manager)
- Configure environment variables:
- cp .env.example .env
- Update .env with your credentials.
- npm start

3. **Frontend Setup**

- cd ../client
- Install Dependencies:
- npm install / yarn install (depending on your package manager)
- npx expo start --go

4. **Open the app on your device**

- **iOS:** Open the Camera app and scan the QR code displayed in the terminal or browser. This will prompt you to open the project in Expo Go.
- **Android:** Open the Expo Go app and scan the QR code displayed in the terminal or browser.

## Additional Tips

- Feel free to use the demo account to log in rather than signing up
  - email: demo_account@gmail.com
  - password: password
- There are some minor bugs on Android that don't allow task edit or task sorting
