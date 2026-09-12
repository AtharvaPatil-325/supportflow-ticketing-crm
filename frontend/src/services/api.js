const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

async function handleResponse(response) {
  if (!response.ok) {
    const error = new Error("Request failed")
    error.status = response.status
    throw error
  }
  return response.json()
}

export async function getTickets({ search, status } = {}) {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (status) params.set("status", status)
  const query = params.toString()
  const url = query
    ? `${API_BASE_URL}/api/tickets?${query}`
    : `${API_BASE_URL}/api/tickets`
  const response = await fetch(url)
  return handleResponse(response)
}

export async function createTicket(ticketData) {
  const response = await fetch(`${API_BASE_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ticketData),
  })
  return handleResponse(response)
}

export async function getTicket(ticketId) {
  const response = await fetch(`${API_BASE_URL}/api/tickets/${encodeURIComponent(ticketId)}`)
  return handleResponse(response)
}

export async function updateTicket(ticketId, data) {
  const response = await fetch(`${API_BASE_URL}/api/tickets/${encodeURIComponent(ticketId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
  return handleResponse(response)
}
