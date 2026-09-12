import { formatDate } from "../utils/format"
import { formatSlaRemaining } from "../utils/sla"

export default function SlaDisplay({ slaDueAt }) {
  const res = formatSlaRemaining(slaDueAt)

  if (!res) {
    return <span className="text-gray-400 text-sm">—</span>
  }

  if (res.breached) {
    return (
      <span className="text-xs font-medium text-red-600">SLA BREACHED</span>
    )
  }

  const colorClass =
    res.diff < 3600000
      ? "text-red-600"
      : res.diff < 14400000
        ? "text-amber-600"
        : "text-gray-600"

  return (
    <div className="flex flex-col">
      <span className={`text-sm font-medium ${colorClass}`}>{res.label} remaining</span>
      <span className="text-xs text-gray-500">
        Due {formatDate(res.due)}
      </span>
    </div>
  )
}
