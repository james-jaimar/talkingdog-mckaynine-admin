
import "./App.css";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { BranchProvider } from "./context/BranchContext";
import { TermProvider } from "./context/TermContext";
import router from "./router";

function App() {
  return (
    <AuthProvider>
      <BranchProvider>
        <TermProvider>
          <RouterProvider router={router} />
        </TermProvider>
      </BranchProvider>
    </AuthProvider>
  );
}

export default App;
