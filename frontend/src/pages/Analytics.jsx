import { useState, useEffect, useCallback } from "react"
import { NavLink } from "react-router-dom"
import StatusBadge from "../components/StatusBadge"
import PriorityBadge from "../components/PriorityBadge"
import { formatDate } from "../utils/format"
import { isSlaBreached, sortNeedsAttention, VALID_PRIORITIES } from "../utils/sla"
import { getTickets } from "../services/api"

const STATUS_ORDER = ["Open", "In Progress", "Closed"]

export default function Analytics() {
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
      setTickets([])
      setError("Unable to load analytics data.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const now = useCallback(
    () => new Date(),
    [],
  )

  const metrics = tickets.reduce(
    (acc, t) => {
      acc.total += 1
      if (t.status === "Open") acc.open += 1
      else if (t.status === "In Progress") acc.inProgress += 1
      else if (t.status === "Closed") acc.closed += 1

      const p = t.priority || "Medium"
      if (p in acc.priorities) acc.priorities[p] += 1
      else acc.priorities[p] = (acc.priorities[p] || 0) + 1

      if (t.sla_due_at && isSlaBreached(t.sla_due_at, now())) {
        acc.slaBreached += 1
      } else {
        acc.slaOk += 1
      }
      return acc
    },
    {
      total: 0,
      open: 0,
      inProgress: 0,
      closed: 0,
      priorities: {},
      slaBreached: 0,
      slaOk: 0,
    },
  )

  const pct = (value) =>
    metrics.total > 0 ? Math.round((value / metrics.total) * 100) : 0

  const needsAttention = sortNeedsAttention(tickets)
  const needsAttentionDisplayed = needsAttention.slice(0, 5)

  const recent = tickets.slice(0, 5)

  const StatCard = ({ label, value, valueClassName = "text-gray-900" }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${valueClassName}`}>{value}</p>
    </div>
  )

  const Bar = ({ label, count }) => {
    const percentage = pct(count)
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700">{label}</span>
          <span className="text-gray-500">
            {count} ({percentage}%)
          </span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Analytics</h2>
        <p className="mt-1 text-sm text-gray-500">
          Ticket volume, priority, and SLA overview.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm animate-pulse"
              >
                <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-7 w-12 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm animate-pulse space-y-4">
            <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-3 w-full bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center space-y-3 shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={loadTickets}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      ) : metrics.total === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
          <p className="text-sm text-gray-500">No ticket data available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <StatCard label="Total Tickets" value={metrics.total} />
              <StatCard label="Open" value={metrics.open} valueClassName="text-green-700" />
              <StatCard
                label="In Progress"
                value={metrics.inProgress}
                valueClassName="text-amber-700"
              />
              <StatCard label="Closed" value={metrics.closed} valueClassName="text-gray-700" />
              <StatCard
                label="Urgent"
                value={metrics.priorities.Urgent || 0}
                valueClassName="text-red-700"
              />
              <StatCard
                label="SLA Breached"
                value={metrics.slaBreached}
                valueClassName="text-red-700"
              />
            </div>

            {/* SLA Health */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                SLA Health
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Within SLA</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {metrics.slaOk}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Breached</p>
                  <p className="mt-1 text-2xl font-semibold text-red-700">
                    {metrics.slaBreached}
                  </p>
                </div>
              </div>
            </div>

            {/* Status breakdown */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Status Breakdown
              </h3>
              <div className="space-y-4">
                {STATUS_ORDER.map((s) => {
                  const count =
                    s === "Open"
                      ? metrics.open
                      : s === "In Progress"
                        ? metrics.inProgress
                        : metrics.closed
                  return <Bar key={s} label={s} count={count} />
                })}
              </div>
            </div>

            {/* Priority breakdown */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Priority Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {VALID_PRIORITIES.map((p) => (
                  <div key={p} className="flex items-center gap-3">
                    <PriorityBadge priority={p} />
                    <span className="text-sm text-gray-700">
                      {metrics.priorities[p] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Needs Attention + Recent */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">
                  Needs Attention
                </h3>
              </div>
              <div className="p-4">
                {needsAttention.length === 0 ? (
                  <p className="text-sm text-gray-500">All caught up.</p>
                ) : (
                  <>
                    <ul className="space-y-3">
                      {needsAttentionDisplayed.map((t) => (
                        <li
                          key={t.ticket_id}
                          className="border-b border-gray-100 last:border-0 pb-3 last:pb-0"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <NavLink
                              to={`/tickets/${t.ticket_id}`}
                              className="font-medium text-indigo-600 hover:text-indigo-700"
                            >
                              {t.ticket_id}
                            </NavLink>
                            <PriorityBadge priority={t.priority} />
                          </div>
                          <p className="mt-1 text-sm text-gray-700">{t.subject}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {t.sla_due_at && isSlaBreached(t.sla_due_at, now())
                              ? "SLA BREACHED"
                              : t.priority === "Urgent"
                                ? "Urgent"
                                : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                    {needsAttention.length > needsAttentionDisplayed.length && (
                      <div className="pt-3 text-right">
                        <NavLink
                          to="/tickets"
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          View all →
                        </NavLink>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">
                  Recent Tickets
                </h3>
              </div>
              <div className="p-4">
                <ul className="space-y-3">
                  {recent.map((t) => (
                    <li
                      key={t.ticket_id}
                      className="border-b border-gray-100 last:border-0 pb-3 last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <NavLink
                          to={`/tickets/${t.ticket_id}`}
                          className="font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          {t.ticket_id}
                        </NavLink>
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{t.subject}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <PriorityBadge priority={t.priority} />
                        <span className="text-xs text-gray-500">
                          {formatDate(t.created_at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
