
import { Toaster } from '@/components/ui/toaster';
import './App.css';
import { BranchProvider } from './context/BranchContext';
import { AuthProvider } from './context/auth';

function App({ children }: { children: React.ReactNode }) {
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
