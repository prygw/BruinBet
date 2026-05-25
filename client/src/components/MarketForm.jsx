import { useState } from 'react'

const DEFAULT_OPTIONS = ['Yes', 'No']

export function MarketForm({ onSubmit, isSubmitting, serverError }) {
const [name, setName] = useState('')
const [description, setDescription] = useState('')
const [category, setCategory] = useState('')
const [closesAt, setClosesAt] = useState('')
const [options, setOptions] = useState(DEFAULT_OPTIONS)
const [errors, setErrors] = useState({})

const handlePublish = async () => {
  setErrors({})
  const optionLabels = options.map((option) => option.trim()).filter(Boolean)
  const uniqueOptionLabels = [...new Set(optionLabels)]

  if (uniqueOptionLabels.length < 2) {
    setErrors({ options: 'Add at least two unique outcomes.' })
    return
  }

  const payload = {
    market_name: name.trim(),
    description: description.trim(),
    category: category.trim() || null,
    closes_at: closesAt ? new Date(closesAt).toISOString() : null,
    options: uniqueOptionLabels,
  }

  const success = await onSubmit(payload)
  if (success) {
    setName('')
    setDescription('')
    setCategory('')
    setClosesAt('')
    setOptions(DEFAULT_OPTIONS)
  }
}

const handleOptionChange = (index, value) => {
  setOptions((current) =>
    current.map((option, optionIndex) => optionIndex === index ? value : option),
  )
}

const handleAddOption = () => {
  setOptions((current) => [...current, ''])
}

const handleRemoveOption = (index) => {
  setOptions((current) => current.filter((_, optionIndex) => optionIndex !== index))
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

    {/* possible outcomes */}
    <div className="form-group" style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Outcomes</label>
        <div style={{ display: 'grid', gap: '10px' }}>
        {options.map((option, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder={`Outcome ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
                <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    disabled={options.length <= 2}
                    style={{ padding: '10px 12px', borderRadius: '6px' }}
                >
                    Remove
                </button>
            </div>
        ))}
        <button
            type="button"
            onClick={handleAddOption}
            style={{ width: 'fit-content', padding: '10px 14px', borderRadius: '6px', fontWeight: 'bold' }}
        >
            Add outcome
        </button>
        </div>
        {errors.options && <span className="field-error">{errors.options}</span>}
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
