import { BrowserRouter, Routes, Route } from "react-router-dom"
import AppShell from "./components/layout/AppShell"
import Dashboard from "./pages/Dashboard"
import Tickets from "./pages/Tickets"
import CreateTicket from "./pages/CreateTicket"
import TicketDetails from "./pages/TicketDetails"
import Analytics from "./pages/Analytics"
import Settings from "./pages/Settings"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/tickets/new" element={<CreateTicket />} />
          <Route path="/tickets/:ticketId" element={<TicketDetails />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
