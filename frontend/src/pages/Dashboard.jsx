import { useState, useEffect, useCallback } from "react"
import { NavLink } from "react-router-dom"
import { RefreshCw } from "lucide-react"
import StatusBadge from "../components/StatusBadge"
import PriorityBadge from "../components/PriorityBadge"
import { formatDate } from "../utils/format"
import { isSlaBreached, sortNeedsAttention } from "../utils/sla"
import { getTickets } from "../services/api"

export default function Dashboard() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadTickets = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getTickets()
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError("Unable to load tickets.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const openTickets = tickets.filter((t) => t.status === "Open").length
  const inProgressTickets = tickets.filter((t) => t.status === "In Progress").length
  const totalTickets = tickets.length

  const resolvedToday = (() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return tickets.filter((t) => {
      if (t.status !== "Closed") return false
      const updated = new Date(t.updated_at)
      return updated >= start
    }).length
  })()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your support tickets and team activity.
          </p>
        </div>
        <button
          onClick={loadTickets}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Open Tickets</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{openTickets}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">In Progress</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{inProgressTickets}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Resolved Today</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{resolvedToday}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Tickets</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{totalTickets}</p>
        </div>
      </div>

      {(() => {
        const needsAttention = sortNeedsAttention(tickets)
        if (needsAttention.length === 0) return null
        const displayed = needsAttention.slice(0, 5)
        return (
          <div className="bg-white rounded-lg border border-red-200 shadow-sm">
            <div className="px-6 py-4 border-b border-red-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-red-800">
                Needs Attention
              </h3>
              <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
                {needsAttention.length}
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {displayed.map((ticket) => (
                <div
                  key={ticket.ticket_id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={ticket.priority} />
                    <NavLink
                      to={`/tickets/${ticket.ticket_id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {ticket.ticket_id}
                    </NavLink>
                    <span className="text-sm text-gray-700">{ticket.subject}</span>
                  </div>
                  <span className="text-xs text-red-600 font-medium">
                    {isSlaBreached(ticket.sla_due_at) ? "SLA BREACHED" : ""}
                  </span>
                </div>
              ))}
            </div>
            {needsAttention.length > displayed.length && (
              <div className="px-6 py-3 border-t border-gray-100 text-right">
                <NavLink
                  to="/tickets"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View all →
                </NavLink>
              </div>
            )}
          </div>
        )
      })()}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Recent Tickets</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-500">Loading tickets...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={loadTickets}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Try again
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-500">No tickets yet</p>
            <p className="mt-1 text-xs text-gray-400">
              Create your first support ticket to get started.
            </p>
            <NavLink
              to="/tickets/new"
              className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              New Ticket
            </NavLink>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">
                    Ticket ID
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.ticket_id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-3">
                      <NavLink
                        to={`/tickets/${ticket.ticket_id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {ticket.ticket_id}
                      </NavLink>
                    </td>
                    <td className="px-6 py-3 text-gray-900">{ticket.customer_name}</td>
                    <td className="px-6 py-3 text-gray-700">{ticket.subject}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {formatDate(ticket.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
