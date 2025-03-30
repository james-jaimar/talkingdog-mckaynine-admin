
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Handlers from "./pages/Handlers";
import Trainers from "./pages/Trainers";
import Branches from "./pages/Branches";
import Classes from "./pages/Classes";
import ClassSchedules from "./pages/ClassSchedules";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/handlers" element={<Handlers />} />
          <Route path="/trainers" element={<Trainers />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/class-schedules/:classId" element={<ClassSchedules />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
