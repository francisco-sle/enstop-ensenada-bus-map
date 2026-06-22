export const FARES = {
  NORMAL: 15.5,
  STUDENT: 5.85,
  SENIOR: 7.75,
  DISABILITY: 7.75,
  DISABILITY_FREE: 0.0,
} as const

export const DEFAULT_FARE = FARES.NORMAL
