
import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth'; // Fixed import path
import { BranchProvider } from '@/context/BranchContext';
import './App.css';

interface AppProps {
  children: React.ReactNode;
}

function App({ children }: AppProps) {
  return (
    <AuthProvider>
      <BranchProvider>
        {children}
        <Toaster />
      </BranchProvider>
    </AuthProvider>
  );
}

export default App;
