// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* Public */
import PublicLayout from "./components/PublicLayout.jsx";
import Landing from "./pages/LandinPage.jsx";
import PricingPage from "./payment/PricingPage.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
/* Auth / App */
import Login from "./pages/Login.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

/* App pages */
import Dashboard from "./pages/Dashboard.jsx";
import ClientsList from "./pages/clients/ClientsList.jsx";
import ClientForm from "./pages/clients/ClientForm.jsx";
import ClientDetail from "./pages/clients/ClientDetail.jsx";
import ServicesList from "./pages/services/ServicesList.jsx";
import ServiceForm from "./pages/services/ServiceForm.jsx";
import ServiceDetail from "./pages/services/ServiceDetail.jsx"; // adjust if path differs
import BillingList from "./pages/billing/BillingList.jsx";
import BillingForm from "./pages/billing/BillingForm.jsx";
import Invoice from "./pages/billing/Invoice.jsx";
import RemindersList from "./pages/reminders/RemindersList.jsx";
import Reports from "./pages/reports/Reports.jsx";
import DetailsPage from "./pages/details/DetailsPage.jsx";
import { ThemeProvider } from './contexts/ThemeContext';

import CarGarage from "./pages/garages/CarGarage.jsx";
import BikeGarage from "./pages/garages/BikeGarage.jsx";
import WashingCenter from "./pages/garages/WashingCenter.jsx";
import BikeSpareParts from "./pages/spareparts/BikeSpareParts.jsx";
import CarSpareParts from "./pages/spareparts/CarSpareParts.jsx";
import ContactUs from "./pages/ContactUs.jsx";

function App() {
  return (
    <ThemeProvider>
        <ScrollToTop />
      <Routes>
        {/* Public pages (landing, pricing) */}
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/car-garage" element={<CarGarage />} />
          <Route path="/bike-garage" element={<BikeGarage />} />
          <Route path="/washing-center" element={<WashingCenter />} />
          <Route path="/spare-parts/bike" element={<BikeSpareParts />} />
          <Route path="/spare-parts/car" element={<CarSpareParts />} />
          <Route path="/contactus" element={<ContactUs />} />
        </Route>

        {/* Login route (public) */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<ClientsList />} />
          <Route path="/clients/new" element={<ClientForm />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/clients/:id/edit" element={<ClientForm />} />
          <Route path="/services" element={<ServicesList />} />
          <Route path="/services/new" element={<ServiceForm />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/services/:id/edit" element={<ServiceForm />} />
          <Route path="/billing" element={<BillingList />} />
          <Route path="/billing/new" element={<BillingForm />} />
          <Route path="/billing/:id" element={<Invoice />} />
          <Route path="/reminders" element={<RemindersList />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/details" element={<DetailsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
