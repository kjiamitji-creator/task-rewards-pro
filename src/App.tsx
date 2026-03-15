import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { UserRoute, AdminRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Wallet from "./pages/Wallet";
import Profile from "./pages/Profile";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPayments from "./pages/admin/Payments";
import AdminUsers from "./pages/admin/Users";
import UserDetail from "./pages/admin/UserDetail";
import AdminAds from "./pages/admin/Ads";
import AdDetail from "./pages/admin/AdDetail";
import AdminRewards from "./pages/admin/Rewards";
import AdminSettings from "./pages/admin/Settings";
import Rewards from "./pages/Rewards";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/home" element={<UserRoute><Home /></UserRoute>} />
              <Route path="/rewards" element={<UserRoute><Rewards /></UserRoute>} />
              <Route path="/wallet" element={<UserRoute><Wallet /></UserRoute>} />
              <Route path="/profile" element={<UserRoute><Profile /></UserRoute>} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/users/:userId" element={<AdminRoute><UserDetail /></AdminRoute>} />
              <Route path="/admin/ads" element={<AdminRoute><AdminAds /></AdminRoute>} />
              <Route path="/admin/ads/:adType/:adId" element={<AdminRoute><AdDetail /></AdminRoute>} />
              <Route path="/admin/rewards" element={<AdminRoute><AdminRewards /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AdminAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
