
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { Currency } from "lucide-react";

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
      
      <main className="flex-grow flex items-center justify-center">
        <div className="max-w-md w-full p-6">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-mckaynine-100 rounded-full w-20 h-20 flex items-center justify-center">
                <Currency className="h-12 w-12 text-mckaynine-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              McKaynine Training Centre
            </h2>
            <p className="text-gray-600">
              Sign in to access your account
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
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
