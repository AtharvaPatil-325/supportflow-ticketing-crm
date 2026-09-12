const PRIORITY_LABELS = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
  Urgent: "Urgent",
}

export const VALID_PRIORITIES = ["Low", "Medium", "High", "Urgent"]

export function formatSlaRemaining(slaDueAt, now = new Date()) {
  if (!slaDueAt) return null
  const due = new Date(slaDueAt)
  if (Number.isNaN(due.getTime())) return null
  const diff = due.getTime() - now.getTime()
  if (diff <= 0) return { breached: true, label: "SLA BREACHED" }

  const totalMinutes = Math.floor(diff / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  let label
  if (days > 0) {
    label = `${days}d ${hours}h`
  } else if (hours > 0) {
    label = `${hours}h ${minutes}m`
  } else {
    label = `${minutes}m`
  }
  return { breached: false, label, due, diff }
}

export function isSlaBreached(slaDueAt, now = new Date()) {
  const res = formatSlaRemaining(slaDueAt, now)
  return res ? res.breached : false
}

export { PRIORITY_LABELS }

export function isNeedingAttention(t) {
  if (!t) return false
  const status = (t.status || "").toLowerCase()
  if (status === "closed") return false
  return t.priority === "Urgent" || (t.sla_due_at && isSlaBreached(t.sla_due_at))
}

export function needsAttentionRank(t) {
  const urgent = t.priority === "Urgent"
  const breached = t.sla_due_at ? isSlaBreached(t.sla_due_at) : false
  if (urgent && breached) return 0
  if (urgent && !breached) return 1
  if (!urgent && breached) return 2
  return 3
}

export function sortNeedsAttention(tickets) {
  return (tickets || [])
    .filter(isNeedingAttention)
    .sort((a, b) => {
      const r = needsAttentionRank(a) - needsAttentionRank(b)
      if (r !== 0) return r
      return new Date(b.created_at) - new Date(a.created_at)
    })
}
