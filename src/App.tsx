
import "./App.css";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { BranchProvider } from "./context/BranchContext";
import { TermProvider } from "./context/TermContext";
import router from "./router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BranchProvider>
          <TermProvider>
            <RouterProvider router={router} />
          </TermProvider>
        </BranchProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
