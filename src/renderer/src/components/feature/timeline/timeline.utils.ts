export interface RulerTick {
  time: number
  isMajor: boolean
}

export function formatTimecode(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const rest = total % 60

  return [hours, minutes, rest]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

export function formatRulerTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const rest = total % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
  }

  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export function getRulerTicks(
  duration: number,
  pixelsPerSecond: number,
): RulerTick[] {
  const minorStep = pixelsPerSecond >= 80 ? 0.5 : 1
  const majorStep = pixelsPerSecond >= 80 ? 2 : pixelsPerSecond >= 32 ? 5 : 10
  const majorsEvery = majorStep / minorStep
  const count = Math.ceil(duration / minorStep)
  const ticks: RulerTick[] = []

  for (let index = 0; index <= count; index += 1) {
    const time = index * minorStep

    if (time > duration) {
      break
    }

    ticks.push({
      time,
      isMajor: index % majorsEvery === 0,
    })
  }

  return ticks
}

export function getWaveformBars(seed: string, count: number): number[] {
  let hash = 0

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1000
  }

  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin((hash + index * 13) / 4)
    return 28 + Math.abs(wave) * 72
  })
}
