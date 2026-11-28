import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { theme } from '../theme';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import LoginPage from '../pages/Auth/LoginPage';
import ForgotPasswordPage from '../pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/Auth/ResetPasswordPage';
import LandingPage from '../pages/Marketing/LandingPage';
import ManpowerSupplyPage from '../pages/Marketing/ManpowerSupplyPage';
import ServicesPage from '../pages/Marketing/ServicesPage';
import AboutPage from '../pages/Marketing/AboutPage';
import ContactPage from '../pages/Marketing/ContactPage';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/manpower-supply" element={<ManpowerSupplyPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/organization/dashboard" element={<DashboardPage role="organization" />} />
          <Route path="/admin/dashboard" element={<DashboardPage role="admin" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;