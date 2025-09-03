import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ClientsList from './pages/clients/ClientsList.jsx'
import ClientForm from './pages/clients/ClientForm.jsx'
import ClientDetail from './pages/clients/ClientDetail.jsx'
import ServicesList from './pages/services/ServicesList.jsx'
import ServiceForm from './pages/services/ServiceForm.jsx'
import ServiceDetail from './pages/services/ServiceDetail.jsx'
import BillingList from './pages/billing/BillingList.jsx'
import BillingForm from './pages/billing/BillingForm.jsx'
import Invoice from './pages/billing/Invoice.jsx'
import RemindersList from './pages/reminders/RemindersList.jsx'
import Reports from './pages/reports/Reports.jsx'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
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
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default App