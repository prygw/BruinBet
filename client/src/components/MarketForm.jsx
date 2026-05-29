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
        <div className="form-group">
            <label>
                Market question
            </label>
            <input
                type="text"
                placeholder="e.g., Will it rain in LA tomorrow?"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

    <div className="form-group">
        <label>
            Rules & Description
        </label>
        <textarea
            placeholder="Provide context and resolution criteria..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
    </div>

    <div className="form-row">
        <div className="form-group">
            <label>Category (optional)</label>
            <input 
            type="text" 
            placeholder="e.g., Politics"
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            />
        </div>
            
        <div className="form-group">
            <label>Closes at</label>
            <input
            type="datetime-local"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            aria-invalid={Boolean(errors.closesAt)}
            />
            {errors.closesAt && <span className="field-error">{errors.closesAt}</span>}
        </div>
    </div>

    <div className="form-group">
        <label>Outcomes</label>
        <div className="outcome-editor">
        {options.map((option, index) => (
            <div className="outcome-row" key={index}>
                <input
                    type="text"
                    placeholder={`Outcome ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                />
                <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    disabled={options.length <= 2}
                    className="secondary-button"
                >
                    Remove
                </button>
            </div>
        ))}
        <button
            type="button"
            onClick={handleAddOption}
            className="secondary-button fit-button"
        >
            Add outcome
        </button>
        </div>
        {errors.options && <span className="field-error">{errors.options}</span>}
    </div>

    {serverError && (
    <p role="alert" className="form-error">
        {serverError}
    </p>
    )}

    <div className="form-actions">
        <button 
            type="button"
            disabled={isSubmitting}
            onClick={handlePublish}
            className="primary-button"
        >
            {isSubmitting ? 'Publishing…' : 'Publish Market'}
        </button>
    </div>
</div>
    )
}
