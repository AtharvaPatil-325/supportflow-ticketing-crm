import { useLocation } from "react-router-dom"
import { Bell } from "lucide-react"

export default function TopBar() {
  const location = useLocation()

  let title = "Dashboard"
  if (location.pathname === "/tickets") title = "Tickets"
  else if (location.pathname === "/tickets/new") title = "Create Ticket"
  else if (location.pathname.startsWith("/tickets/")) title = "Ticket Details"
  else if (location.pathname === "/analytics") title = "Analytics"
  else if (location.pathname === "/settings") title = "Settings"

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-4">
        <button
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-indigo-700">A</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-700">Admin User</p>
            <p className="text-xs text-gray-500">Support Agent</p>
          </div>
        </div>
      </div>
    </header>
  )
}
