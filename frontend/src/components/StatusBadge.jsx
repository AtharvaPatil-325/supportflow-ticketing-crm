const statusStyles = {
  Open: "bg-green-50 text-green-700 border-green-200",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
  Closed: "bg-gray-100 text-gray-700 border-gray-200",
}

export default function StatusBadge({ status }) {
  const safeStatus = status || "Open"
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusStyles[safeStatus] || statusStyles.Open}`}
    >
      {safeStatus}
    </span>
  )
}
