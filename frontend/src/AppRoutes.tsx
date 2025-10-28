import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./screens/HomePage";
import PreSignupPage from "./screens/PreSignupPage";
import SignupPage from "./screens/SignupPage";
import LoginPage from "./screens/LoginPage";
import ExplorePage from "./screens/ExplorePage";
import AccountPage from "./screens/AccountPage";
import WalletPage from "./screens/WalletPage";
import DashboardPage from "./screens/DashboardPage";
import ActiveJobPage from "./screens/ActiveJobPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pre-signup" element={<PreSignupPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/job/:id" element={<ActiveJobPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
