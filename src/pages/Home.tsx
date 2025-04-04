
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { Dog, ShieldCheck } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Helmet>
        <title>McKaynine Training Centre</title>
      </Helmet>
      
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-mckaynine-700">
              McKaynine Training Centre
            </h1>
          </div>
          {user && (
            <Button variant="outline" asChild>
              <Link to="/dashboard">
                Dashboard
              </Link>
            </Button>
          )}
        </div>
      </header>
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900">
              Welcome to McKaynine Training
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Please sign in to access your account
            </p>
          </div>
          
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="bg-mckaynine-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Dog className="h-10 w-10 text-mckaynine-600" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">McKaynine Portal</h3>
              <p className="text-gray-600 text-center mb-6">
                Sign in to access your training classes, profiles, and communications
              </p>
              <Button variant="mckaynine" className="w-full" asChild>
                <Link to="/auth">
                  Sign In / Register
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} McKaynine Training Centre. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
