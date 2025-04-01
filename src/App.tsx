
import { Toaster } from '@/components/ui/toaster';
import './App.css';
import { BranchProvider } from './context/BranchContext';
import { AuthProvider } from './context/auth';

function App({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BranchProvider>
        <div className="min-h-screen bg-gray-100">
          {children}
          <Toaster />
        </div>
      </BranchProvider>
    </AuthProvider>
  );
}

export default App;
