const DEFAULT_COLORS = ['#ffd100', '#2774ae', '#22c55e', '#f97316']

function StatusBar({ options = [], chosenOptionId, title = 'Market distribution', showLegend = true }) {
  const hasActivity = options.some((option) => Number(option.percent || 0) > 0)
  const fallbackWidth = options.length > 0 ? 100 / options.length : 0
  const normalizedOptions = options.map((option, index) => {
    const percent = typeof option.percent === 'number' ? option.percent : 0

    return {
      ...option,
      percent,
      displayPercent: hasActivity ? percent : fallbackWidth,
      color: option.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }
  })

  const ariaLabel = normalizedOptions
    .map((opt) => `${opt.label} ${opt.percent}%`)
    .join(', ')

  return (
    <div className="status-module">
      <p className="status-title">{title}</p>

      <div
        className="probability-bar"
        role="img"
        aria-label={ariaLabel}
      >
        {normalizedOptions.map((option) => (
          <div
            className={option.id === chosenOptionId ? 'probability-segment chosen' : 'probability-segment'}
            key={option.id || option.label}
            style={{
              width: `${option.displayPercent}%`,
              background: option.color,
            }}
          >
            {option.displayPercent > 8 ? `${option.label}${hasActivity ? ` ${option.percent}%` : ''}` : ''}
          </div>
        ))}
      </div>

      {showLegend && (
        <div className="status-legend">
          {normalizedOptions.map((option) => (
            <span
              className="status-legend-item"
              key={option.id || option.label}
            >
              <span
                className="status-swatch"
                style={{
                  background: option.color,
                }}
              />
              {option.label} — {hasActivity ? `${option.percent}%` : 'No bets'}
              {option.id === chosenOptionId && (
                <strong> (your bet)</strong>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default StatusBar
