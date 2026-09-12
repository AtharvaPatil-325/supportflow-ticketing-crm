import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { Plus, Search } from "lucide-react"
import StatusBadge from "../components/StatusBadge"
import PriorityBadge from "../components/PriorityBadge"
import { formatDate } from "../utils/format"
import { getTickets } from "../services/api"

const STATUS_FILTERS = ["All Statuses", "Open", "In Progress", "Closed"]

export default function Tickets() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("All Statuses")
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchTickets = useCallback(
    async (nextSearch, nextStatus) => {
      setLoading(true)
      setError("")
      try {
        const data = await getTickets({
          search: nextSearch || undefined,
          status:
            nextStatus && nextStatus !== "All Statuses"
              ? nextStatus
              : undefined,
        })
        setTickets(Array.isArray(data) ? data : [])
      } catch (err) {
        setTickets([])
        setError("Unable to load tickets.")
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const debouncedSearch = (search || "").trim()

  useEffect(() => {
    const activeSearch = debouncedSearch
    const activeStatus = status || "All Statuses"
    const id = setTimeout(() => {
      fetchTickets(activeSearch, activeStatus)
    }, 300)
    return () => clearTimeout(id)
  }, [debouncedSearch, status, fetchTickets])

  const activeFilters =
    debouncedSearch.length > 0 || (status && status !== "All Statuses")

  const clearFilters = () => {
    setSearch("")
    setStatus("All Statuses")
  }

  const retry = () => {
    fetchTickets(debouncedSearch, status)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Tickets</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track customer support requests.
          </p>
        </div>

        <Link
          to="/tickets/new"
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          New Ticket
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {activeFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-500">Loading tickets...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Try again
            </button>
          </div>
        ) : !activeFilters && tickets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-500">No tickets yet</p>
            <p className="mt-1 text-xs text-gray-400">
              Create your first support ticket to get started.
            </p>
            <Link
              to="/tickets/new"
              className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              New Ticket
            </Link>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-gray-500">No tickets found</p>
            <p className="mt-1 text-xs text-gray-400">
              Try adjusting your search or status filter.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto sm:overflow-visible">
            <table className="min-w-full text-sm">
              <thead className="hidden sm:table-header-group">
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
                    Priority
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
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 sm:table-row"
                  >
                    <td
                      className="block sm:table-cell px-6 py-2 sm:py-3"
                      data-label="Ticket ID"
                    >
                      <Link
                        to={`/tickets/${ticket.ticket_id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {ticket.ticket_id}
                      </Link>
                    </td>
                    <td
                      className="block sm:table-cell px-6 py-2 sm:py-3 text-gray-900"
                      data-label="Customer"
                    >
                      {ticket.customer_name}
                    </td>
                    <td
                      className="block sm:table-cell px-6 py-2 sm:py-3 text-gray-700"
                      data-label="Subject"
                    >
                      {ticket.subject}
                    </td>
                    <td
                      className="block sm:table-cell px-6 py-2 sm:py-3"
                      data-label="Priority"
                    >
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td
                      className="block sm:table-cell px-6 py-2 sm:py-3"
                      data-label="Status"
                    >
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td
                      className="block sm:table-cell px-6 py-2 sm:py-3 text-gray-500"
                      data-label="Created"
                    >
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