const priorityStyles = {
  Low: "bg-gray-50 text-gray-700 border-gray-200",
  Medium: "bg-indigo-50 text-indigo-700 border-indigo-200",
  High: "bg-amber-50 text-amber-700 border-amber-200",
  Urgent: "bg-red-50 text-red-700 border-red-200",
}

export default function PriorityBadge({ priority }) {
  const safe = priority || "Medium"
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
        priorityStyles[safe] || priorityStyles.Medium
      }`}
    >
      {safe}
    </span>
  )
}
