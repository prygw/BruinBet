import { useState } from 'react'
import BASE_URL from '../api'

function AdminCreateMarketPage({ session, onCreated }) {
  // Added a fallback for serverError if session check fails initially
  if (!session || !onCreated) {
    return <p className="form-server-error">Either session or onCreated callback is missing. Please ensure you are logged in and try again.</p>;
  }

  const [marketName, setMarketName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [closesAt, setClosesAt] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError('')
    setErrors({}) 

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
          options: ['Yes', 'No'], // Hardcoded to always be Yes/No
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
      onCreated(data.market);
    } catch (err) {
      setServerError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!session.is_admin) {
    return <p className="empty-results text-center mt-10">Admins only.</p>
  }

  return (
    <section className="landing-layout flex-center-wrapper" aria-labelledby="admin-create-title">
      
      {/* This div acts as the modal/box. 
        CSS idea: max-width: 550px, margin: 40px auto, background: white, 
        border-radius: 12px, box-shadow: 0 4px 15px rgba(0,0,0,0.05), padding: 32px 
      */}
      <div className="market-creation-card" style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#232f48' }}>
        
        <div className="section-heading" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p className="eyebrow" style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: '#ffffff' }}>Admin Dashboard</p>
          <h1 id="admin-create-title" style={{ margin: '8px 0 0', fontSize: '1.5rem' }}>Create a New Market</h1>
        </div>

        <form className="admin-form" onSubmit={handleSubmit} noValidate>
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
              Market Question
            </label>
            <input
              type="text"
              placeholder="e.g., Will it rain in LA tomorrow?"
              value={marketName}
              onChange={(e) => setMarketName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            {errors.marketName && <span className="field-error">{errors.marketName}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
              Rules & Description
            </label>
            <textarea
              placeholder="Provide context and resolution criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }}
            />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          {/* Side-by-side row for compact UI */}
          <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Category (optional)</label>
              <input 
                type="text" 
                placeholder="e.g., Politics"
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Closes at</label>
              <input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                aria-invalid={Boolean(errors.closesAt)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
              {errors.closesAt && <span className="field-error">{errors.closesAt}</span>}
            </div>
          </div>

          {/* Visual indicator of the locked options */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
             <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Outcomes</label>
             <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ padding: '6px 16px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '20px', fontWeight: '600' }}>Yes</span>
                <span style={{ padding: '6px 16px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '20px', fontWeight: '600' }}>No</span>
             </div>
          </div>

          {serverError && (
            <p role="alert" className="form-server-error" style={{ color: 'red', textAlign: 'center' }}>
              {serverError}
            </p>
          )}

          {/* Centered Publish Button */}
          <div className="form-actions" style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
            <button 
              type="submit" 
              className="primary-button" 
              disabled={submitting}
              style={{ padding: '12px 32px', fontSize: '1rem', fontWeight: 'bold', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? 'Publishing…' : 'Publish Market'}
            </button>
          </div>

        </form>
      </div>
    </section>
  )
}

export default AdminCreateMarketPage
