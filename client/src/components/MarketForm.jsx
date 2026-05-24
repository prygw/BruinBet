import { useState } from 'react'

export function MarketForm({ onSubmit, isSubmitting, serverError }) {
const [name, setName] = useState('')
const [description, setDescription] = useState('')
const [category, setCategory] = useState('')
const [closesAt, setClosesAt] = useState('')
const [errors, setErrors] = useState({})

const handlePublish = async () => {
  setErrors({})

  const payload = {
    market_name: name.trim(),
    description: description.trim(),
    category: category.trim() || null,
    closes_at: closesAt ? new Date(closesAt).toISOString() : null,
    options: ['Yes', 'No'],
  }

  const success = await onSubmit(payload)
  if (success) {
    setName('')
    setDescription('')
    setCategory('')
    setClosesAt('')
  }
}

return (
    <div className="admin-form">
    
    {/* question */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                Market Question
            </label>
            <input
                type="text"
                placeholder="e.g., Will it rain in LA tomorrow?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

    {/* description */}
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

    {/* category */}
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
            
    {/* date it closes at */}
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

    {/* possible outcomes, hard-coded for now */}
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

    <div className="form-actions" style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
        <button 
            type="button" // 3. Explicitly set to button, not submit
            disabled={isSubmitting}
            onClick={handlePublish} // 4. Trigger logic on click instead
            style={{ padding: '12px 32px', fontWeight: 'bold', borderRadius: '8px' }}
        >
            {isSubmitting ? 'Publishing…' : 'Publish Market'}
        </button>
    </div>
</div>
    )
}
