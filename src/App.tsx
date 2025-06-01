
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import OpticDashboard from "./pages/OpticDashboard";
import MeasurementPage from "./pages/MeasurementPage";
import FrameSuggestionPage from "./pages/FrameSuggestionPage";
import HistoryPage from "./pages/HistoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/optica" element={<OpticDashboard />} />
            <Route path="/aferir" element={<MeasurementPage />} />
            <Route path="/sugestao" element={<FrameSuggestionPage />} />
            <Route path="/historico" element={<HistoryPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
