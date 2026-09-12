import { useParams, Link } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import { ArrowLeft } from "lucide-react"
import StatusBadge from "../components/StatusBadge"
import PriorityBadge from "../components/PriorityBadge"
import SlaDisplay from "../components/SlaDisplay"
import Banner from "../components/ui/Banner"
import { getTicket, updateTicket } from "../services/api"
import { formatDate } from "../utils/format"
import { VALID_PRIORITIES } from "../utils/sla"

export default function TicketDetails() {
  const { ticketId } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notFound, setNotFound] = useState(false)

  const [updating, setUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState("")
  const [updateError, setUpdateError] = useState("")
  const [form, setForm] = useState({
    status: "Open",
    priority: "Medium",
    notes: "",
  })

  const loadTicket = useCallback(async () => {
    setLoading(true)
    setError("")
    setNotFound(false)
    setUpdateSuccess("")
    setUpdateError("")
    try {
      const data = await getTicket(ticketId)
      setTicket(data)
      setForm({ status: data.status || "Open", priority: data.priority || "Medium", notes: "" })
    } catch (err) {
      if (err.status === 404) {
        setNotFound(true)
      } else {
        setError("Unable to load this ticket.")
      }
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    loadTicket()
  }, [loadTicket])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setUpdateError("")
    setUpdating(true)
    try {
      const payload = {
        status: form.status,
        priority: form.priority,
        notes: form.notes.trim() || null,
      }
      await updateTicket(ticketId, payload)
      await loadTicket()
      setUpdateSuccess("Ticket updated successfully.")
    } catch (err) {
      setUpdateError("Unable to update ticket. Please try again.")
    } finally {
      setUpdating(false)
    }
  }

  const handleRetry = () => {
    loadTicket()
  }

  if (loading) {
    return (
      <div className="max-w-3xl space-y-6">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft size={16} />
          Back to Tickets
        </Link>
        <p className="text-sm text-gray-500">Loading ticket...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-3xl space-y-6">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft size={16} />
          Back to Tickets
        </Link>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center space-y-4">
          <p className="text-sm text-gray-900 font-medium">Ticket not found.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg text-sm font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
            >
              Try again
            </button>
            <Link
              to="/tickets"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            >
              Back to Tickets
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl space-y-6">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft size={16} />
          Back to Tickets
        </Link>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center space-y-4">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg text-sm font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
            >
              Try again
            </button>
            <Link
              to="/tickets"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            >
              Back to Tickets
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return null
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft size={16} />
          Back to Tickets
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Ticket {ticket.ticket_id}</h2>
            <p className="mt-1 text-sm text-gray-500">
              View and update support ticket details.
            </p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Ticket ID
            </p>
            <p className="mt-1 text-sm text-gray-900">{ticket.ticket_id}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Status
            </p>
            <p className="mt-1">
              <StatusBadge status={ticket.status} />
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Priority
            </p>
            <p className="mt-1">
              <PriorityBadge priority={ticket.priority} />
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              SLA
            </p>
            <div className="mt-1">
              <SlaDisplay slaDueAt={ticket.sla_due_at} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Customer
            </p>
            <p className="mt-1 text-sm text-gray-900">{ticket.customer_name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Email
            </p>
            <p className="mt-1 text-sm text-gray-900">{ticket.customer_email}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Subject
            </p>
            <p className="mt-1 text-sm text-gray-900">{ticket.subject}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Description
            </p>
            <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Created
            </p>
            <p className="mt-1 text-sm text-gray-900">{formatDate(ticket.created_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Updated
            </p>
            <p className="mt-1 text-sm text-gray-900">{formatDate(ticket.updated_at)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Activity</h3>
        </div>
        <div className="p-6">
          {ticket.notes && ticket.notes.length > 0 ? (
            <ul className="space-y-4">
              {ticket.notes.map((note) => (
                <li key={note.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-gray-300 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.note_text}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(note.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No activity yet.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Update Ticket</h3>
        <form className="space-y-4" onSubmit={handleUpdate}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option>Open</option>
              <option>In Progress</option>
              <option>Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {VALID_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Note
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Add a note..."
            />
          </div>
          <div className="flex flex-col gap-3">
            {updateSuccess && <Banner type="success" message={updateSuccess} />}
            {updateError && <Banner type="error" message={updateError} />}
            <div className="flex items-center justify-end gap-3">
              <Link
                to="/tickets"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Updating..." : "Update Ticket"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
