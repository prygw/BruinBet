import { useState } from 'react'
import BASE_URL from '../api'

function AdminCreateMarketPage({ session, onCreated }) {
  if (!session || !onCreated) {
    setServerError('Either session or onCreated callback is missing. Please ensure you are logged in and try again.');
    return <p>{serverError}</p>;
  }

  const [marketName, setMarketName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [closesAt, setClosesAt] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleAddOption = () => setOptions((prev) => [...prev, ''])

  const handleRemoveOption = (idx) =>
    setOptions(
      (prev) => prev.filter((_, i) => i !== idx)
    )
  
  const handleOptionChange = (idx, value) =>
    setOptions(
      (prev) => prev.map((opt, i) => (i === idx ? value : opt))
    )

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError('')
    setErrors({}) 

  const trimmedOptions = options.map((o) => o.trim()).filter(Boolean)

  setSubmitting(true)
  try {
    const response = await fetch(`${BASE_URL}/api/markets`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market_name: marketName.trim(),
        description: description.trim(),
        category: category.trim() || null,
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
        options: trimmedOptions,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      setServerError(data.error || 'Failed to create market')
      return
    }

    // reset form
    setMarketName('')
    setDescription('')
    setCategory('')
    setClosesAt('')
    setOptions(['', ''])
    onCreated(data.market);
  } catch (err) {
    setServerError('Network error. Please try again.')
  } finally {
    setSubmitting(false)
  }
}

if (!session.is_admin) {
  return <p className="empty-results">Admins only.</p>
}

return (
  <section className="landing-layout" aria-labelledby="admin-create-title">
    <div className="section-heading">
      <p className="eyebrow">Admin</p>
      <h1 id="admin-create-title">Create a new market</h1>
    </div>

    <form className="admin-form" onSubmit={handleSubmit} noValidate>
      <label>
        Market name
        <input
          type="text"
          value={marketName}
          onChange={(e) => setMarketName(e.target.value)}
        />
        {errors.marketName && <span className="field-error">{errors.marketName}</span>}
      </label>

      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </label>

      <label>
        Category (optional)
        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
      </label>

      <label>
        Closes at
        <input
          type="datetime-local"
          value={closesAt}
          onChange={(e) => setClosesAt(e.target.value)}
          aria-invalid={Boolean(errors.closesAt)}
        />
        {errors.closesAt && <span className="field-error">{errors.closesAt}</span>}
      </label>

      <fieldset className="options-fieldset">
        <legend>Options</legend>
        {options.map((opt, idx) => (
          <div key={idx} className="option-row">
            <input
              type="text"
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              placeholder={`Option ${idx + 1}`}
            />
            {options.length > 2 && (
              <button type="button" onClick={() => handleRemoveOption(idx)}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" className="secondary-button" onClick={handleAddOption}>
          Add option
        </button>
        {errors.options && <span className="field-error">{errors.options}</span>}
      </fieldset>

      {serverError && (
        <p role="alert" className="form-server-error">
          {serverError}
        </p>
      )}

      <button type="submit" className="primary-button" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create market'}
      </button>
    </form>
  </section>
  )
}

export default AdminCreateMarketPage
