import React from 'react'

const DEFAULT_COLORS = ['#ffd100', '#2774ae', '#22c55e', '#f97316']

function StatusBar({ options = [], chosenOptionId, title = 'Market distribution', showLegend = true }) {
  const normalizedOptions = options.map((option, index) => ({
    ...option,
    percent: typeof option.percent === 'number' ? option.percent : 0,
    color: option.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }))

  const ariaLabel = normalizedOptions
    .map((opt) => `${opt.label} ${opt.percent}%`)
    .join(', ')

  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
      }}
    >
      <p
        style={{
          margin: 0,
          textTransform: 'uppercase',
          color: '#94a3b8',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.5px',
        }}
      >
        {title}
      </p>

      <div
        role="img"
        aria-label={ariaLabel}
        style={{
          display: 'flex',
          height: 42,
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.04)',
        }}
      >
        {normalizedOptions.map((option) => (
          <div
            key={option.id || option.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 13,
              transition: 'width 420ms ease',
              minWidth: 0,
              width: `${option.percent}%`,
              background: option.color,
              outline: option.id === chosenOptionId ? '3px solid #ffffff' : undefined,
              outlineOffset: option.id === chosenOptionId ? '-3px' : undefined,
            }}
          >
            {option.percent > 8 ? `${option.label} ${option.percent}%` : ''}
          </div>
        ))}
      </div>

      {showLegend && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 13,
            color: '#cbd5e1',
          }}
        >
          {normalizedOptions.map((option) => (
            <span
              key={option.id || option.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  display: 'inline-block',
                  background: option.color,
                }}
              />
              {option.label} — {option.percent}%
              {option.id === chosenOptionId && (
                <strong style={{ color: '#ffffff', fontWeight: 700 }}> (your bet)</strong>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default StatusBar
