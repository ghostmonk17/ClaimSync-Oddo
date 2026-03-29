import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeExpenses from "./pages/employee/EmployeeExpenses";
import AddExpense from "./pages/employee/AddExpense";
import EmployeeReports from "./pages/employee/EmployeeReports";
import ManagerApprovals from "./pages/manager/ManagerApprovals";
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import CfoDashboard from "./pages/cfo/CfoDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPolicy from "./pages/admin/AdminPolicy";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminCurrency from "./pages/admin/AdminCurrency";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
              <Route path="/employee/expenses" element={<EmployeeExpenses />} />
              <Route path="/employee/expenses/new" element={<AddExpense />} />
              <Route path="/employee/reports" element={<EmployeeReports />} />
              <Route path="/manager/approvals" element={<ManagerApprovals />} />
              <Route path="/finance/dashboard" element={<FinanceDashboard />} />
              <Route path="/finance/approvals" element={<FinanceDashboard />} />
              <Route path="/cfo/dashboard" element={<CfoDashboard />} />
              <Route path="/cfo/approvals" element={<CfoDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/policy" element={<AdminPolicy />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/currency" element={<AdminCurrency />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
