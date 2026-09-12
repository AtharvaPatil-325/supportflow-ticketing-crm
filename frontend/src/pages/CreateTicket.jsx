import { useState, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import Banner from "../components/ui/Banner"
import { createTicket } from "../services/api"
import { VALID_PRIORITIES } from "../utils/sla"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function CreateTicket() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    subject: "",
    description: "",
    priority: "Medium",
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState("")
  const [serverError, setServerError] = useState("")

  const validate = useCallback(() => {
    const next = {}
    if (!form.customer_name.trim()) next.customer_name = "Customer name is required"
    if (!form.customer_email.trim()) {
      next.customer_email = "Customer email is required"
    } else if (!EMAIL_REGEX.test(form.customer_email.trim())) {
      next.customer_email = "Enter a valid email address"
    }
    if (!form.subject.trim()) next.subject = "Subject is required"
    if (!form.description.trim()) next.description = "Description is required"
    setErrors(next)
    return Object.keys(next).length === 0
  }, [form])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setServerError("")
    setSuccess("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError("")
    setSuccess("")

    if (!validate()) return

    setSubmitting(true)
    try {
      const data = await createTicket({
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        subject: form.subject.trim(),
        description: form.description.trim(),
        priority: form.priority,
      })
      setSuccess(`Ticket ${data.ticket_id} created successfully.`)
      setTimeout(() => navigate("/tickets"), 1200)
    } catch (err) {
      setServerError("Unable to create ticket. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft size={16} />
          Back to Tickets
        </Link>
        <h2 className="text-2xl font-semibold text-gray-900">Create Ticket</h2>
        <p className="mt-1 text-sm text-gray-500">
          Submit a new customer support request.
        </p>
      </div>

       <form className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6" onSubmit={handleSubmit}>
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Customer Information
            </legend>

            <div>
              <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                id="customer_name"
                type="text"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.customer_name ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Rahul Sharma"
              />
              {errors.customer_name && (
                <p className="mt-1 text-xs text-red-600">{errors.customer_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email
              </label>
              <input
                id="customer_email"
                type="email"
                name="customer_email"
                value={form.customer_email}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.customer_email ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="rahul@gmail.com"
              />
              {errors.customer_email && (
                <p className="mt-1 text-xs text-red-600">{errors.customer_email}</p>
              )}
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Issue Information
            </legend>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.subject ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Payment issue"
              />
              {errors.subject && (
                <p className="mt-1 text-xs text-red-600">{errors.subject}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
               <textarea
                 id="description"
                 name="description"
                 value={form.description}
                 onChange={handleChange}
                 rows={4}
                 className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${
                   errors.description ? "border-red-300" : "border-gray-300"
                 }`}
                 placeholder="Unable to complete payment"
               />
               {errors.description && (
                 <p className="mt-1 text-xs text-red-600">{errors.description}</p>
               )}
             </div>
           </fieldset>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              aria-label="Ticket priority"
            >
              {VALID_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Higher priority tickets get a shorter SLA deadline.
            </p>
          </div>

        <div className="flex flex-col gap-3 pt-2">
          {success && <Banner type="success" message={success} />}
          {serverError && <Banner type="error" message={serverError} />}

          <div className="flex items-center justify-end gap-3">
            <Link
              to="/tickets"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating Ticket..." : "Create Ticket"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
