import { OUTCOME_COLORS } from '../utils/outcomeColors'

function getPointTime(point) {
  return Date.parse(point.timestamp || point.time || point.created_at)
}

function getPointProbability(point) {
  return Number(point.probability ?? point.percent ?? 0)
}

function clampProbability(value) {
  return Math.max(0, Math.min(100, Number(value || 0)))
}

function sortPoints(points) {
  return [...points]
    .filter((point) => Number.isFinite(getPointTime(point)))
    .sort((a, b) => getPointTime(a) - getPointTime(b))
}

function getVisiblePoints(points, minTime, maxTime) {
  const sortedPoints = sortPoints(points)
  if (!sortedPoints.length) {
    return []
  }

  let previous = null
  const visible = []

  for (const point of sortedPoints) {
    const pointTime = getPointTime(point)

    if (pointTime < minTime) {
      previous = point
      continue
    }

    if (pointTime <= maxTime) {
      visible.push(point)
    }
  }

  if (previous) {
    visible.unshift({
      timestamp: new Date(minTime).toISOString(),
      probability: getPointProbability(previous),
    })
  }

  if (!visible.length && previous) {
    visible.push({
      timestamp: new Date(minTime).toISOString(),
      probability: getPointProbability(previous),
    })
  }

  const lastVisible = visible[visible.length - 1] || sortedPoints[sortedPoints.length - 1]
  if (lastVisible && getPointTime(lastVisible) < maxTime) {
    visible.push({
      timestamp: new Date(maxTime).toISOString(),
      probability: getPointProbability(lastVisible),
    })
  }

  return visible
}

function buildStepPath(points, xForTime, yForProbability) {
  if (!points.length) {
    return ''
  }

  const sortedPoints = sortPoints(points)
  const first = sortedPoints[0]
  let path = `M ${xForTime(getPointTime(first))} ${yForProbability(getPointProbability(first))}`

  for (let index = 1; index < sortedPoints.length; index += 1) {
    const point = sortedPoints[index]
    const x = xForTime(getPointTime(point))
    const y = yForProbability(getPointProbability(point))
    path += ` H ${x} V ${y}`
  }

  return path
}

function buildStepAreaPath(points, xForTime, yForProbability, baselineY) {
  const linePath = buildStepPath(points, xForTime, yForProbability)
  if (!linePath || !points.length) {
    return ''
  }

  const sortedPoints = sortPoints(points)
  const first = sortedPoints[0]
  const last = sortedPoints[sortedPoints.length - 1]

  return `${linePath} H ${xForTime(getPointTime(last))} V ${baselineY} H ${xForTime(getPointTime(first))} Z`
}

function formatAxisTime(value, timeRange) {
  if (timeRange > 36 * 60 * 60 * 1000) {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(new Date(value))
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function ProbabilityChart({
  series,
  height = 260,
  rangeEndMs = 0,
  theme = 'dark',
  windowMs = null,
}) {
  const cleanSeries = Array.isArray(series) ? series : []
  const points = cleanSeries.flatMap((item) => item.points || [])
  const times = points
    .map(getPointTime)
    .filter((value) => Number.isFinite(value))

  const width = 760
  const chartTop = 18
  const chartRight = 58
  const chartBottom = 34
  const chartLeft = 10
  const chartWidth = width - chartLeft - chartRight
  const chartHeight = height - chartTop - chartBottom
  const latestSeriesTime = times.length ? Math.max(...times) : 1
  const maxTime = Math.max(latestSeriesTime, rangeEndMs || 1)
  const minTime = windowMs ? maxTime - windowMs : (times.length ? Math.min(...times) : 0)
  const timeRange = Math.max(maxTime - minTime, 1)
  const visibleSeries = cleanSeries.map((item) => ({
    ...item,
    points: getVisiblePoints(item.points || [], minTime, maxTime),
  }))
  const visibleProbabilities = visibleSeries
    .flatMap((item) => item.points || [])
    .map(getPointProbability)
    .filter((value) => Number.isFinite(value))
  const maxProbability = Math.max(1, ...visibleProbabilities)
  const yMax = Math.min(100, Math.max(10, Math.ceil(maxProbability / 10) * 10))
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Number((yMax * ratio).toFixed(0)))

  const xForTime = (time) => chartLeft + ((time - minTime) / timeRange) * chartWidth
  const yForProbability = (probability) => (
    chartTop + ((yMax - Math.min(clampProbability(probability), yMax)) / yMax) * chartHeight
  )

  if (!cleanSeries.length) {
    return (
      <div className="probability-chart-empty">
        Probability history will appear after bets are placed.
      </div>
    )
  }

  return (
    <div className={`probability-chart probability-chart-${theme}`}>
      <div className="probability-legend">
        {visibleSeries.map((item, index) => {
          const color = item.color || OUTCOME_COLORS[index % OUTCOME_COLORS.length]
          const lastPoint = item.points?.[item.points.length - 1]
          return (
            <span key={item.option_id || item.label}>
              <i style={{ background: color }} />
              {item.label}
              <strong>{lastPoint ? `${getPointProbability(lastPoint)}%` : '0%'}</strong>
            </span>
          )
        })}
      </div>

      <svg
        role="img"
        aria-label="Outcome probability history"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {yTicks.map((tick) => {
          const y = yForProbability(tick)
          return (
            <g key={tick}>
              <line
                className="probability-gridline"
                x1={chartLeft}
                x2={width - chartRight}
                y1={y}
                y2={y}
              />
              <text className="probability-axis-label probability-axis-label-right" x={width - chartRight + 10} y={y + 4}>
                {tick}%
              </text>
            </g>
          )
        })}

        <line
          className="probability-axis"
          x1={chartLeft}
          x2={width - chartRight}
          y1={height - chartBottom}
          y2={height - chartBottom}
        />

        <text className="probability-axis-label" x={chartLeft} y={height - 8}>
          {formatAxisTime(minTime, timeRange)}
        </text>
        <text className="probability-axis-label probability-axis-label-center" x={chartLeft + chartWidth / 2} y={height - 8}>
          {formatAxisTime(minTime + timeRange / 2, timeRange)}
        </text>
        <text className="probability-axis-label probability-axis-label-end" x={width - chartRight} y={height - 8}>
          {formatAxisTime(maxTime, timeRange)}
        </text>

        {visibleSeries.map((item, index) => {
          const color = item.color || OUTCOME_COLORS[index % OUTCOME_COLORS.length]
          const areaPath = buildStepAreaPath(item.points || [], xForTime, yForProbability, yForProbability(0))

          if (!areaPath) {
            return null
          }

          return (
            <path
              className="probability-area"
              d={areaPath}
              fill={color}
              key={`${item.option_id || item.label}-area`}
            />
          )
        })}

        {visibleSeries.map((item, index) => {
          const color = item.color || OUTCOME_COLORS[index % OUTCOME_COLORS.length]
          const path = buildStepPath(item.points || [], xForTime, yForProbability)
          const lastPoint = item.points?.[item.points.length - 1]

          if (!path || !lastPoint) {
            return null
          }

          return (
            <g key={item.option_id || item.label}>
              <path
                className="probability-line"
                d={path}
                stroke={color}
                vectorEffect="non-scaling-stroke"
              />
              <circle
                className="probability-endpoint-glow"
                cx={xForTime(getPointTime(lastPoint))}
                cy={yForProbability(getPointProbability(lastPoint))}
                r="9"
                stroke={color}
              />
              <circle
                className="probability-endpoint"
                cx={xForTime(getPointTime(lastPoint))}
                cy={yForProbability(getPointProbability(lastPoint))}
                fill={color}
                r="4"
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default ProbabilityChart
