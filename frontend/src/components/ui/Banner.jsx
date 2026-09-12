const styles = {
  success: "bg-green-50 text-green-800 border-green-200",
  error: "bg-red-50 text-red-800 border-red-200",
}

export default function Banner({ type = "success", message, onDismiss }) {
  if (!message) return null
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles[type] || styles.success}`}>
      <div className="flex items-center justify-between gap-4">
        <p>{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-current opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
