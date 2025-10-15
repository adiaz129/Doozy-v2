import React from 'react';
import { AuthProvider } from './src/AuthContext';
import AppContent from './src/AppContent';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}