// ---------------------------------------------------------------------------
// Builds the /book URL from a visualiser configuration.
//
// The configuration travels in query params rather than in the zustand store:
// the store is not persisted, so a refresh or a link pasted to a partner would
// silently drop back to defaults and quote for the wrong blind. Params survive
// both, and /book re-validates them through parseOrderConfig anyway.
//
// Param names are short (type/size/op/qty) because these URLs get shared.
// ---------------------------------------------------------------------------

import type { BlindType, Operation, WindowSize } from './pricing'

export interface BookingLinkConfig {
  blindType: BlindType
  windowSize: WindowSize
  operation: Operation
  quantity?: number
  fabricColour?: string
  hardwareColour?: string
}

export function bookingLink(config: BookingLinkConfig): string {
  const params = new URLSearchParams({
    type: config.blindType,
    size: config.windowSize,
    op: config.operation,
  })
  if (config.quantity && config.quantity > 1) params.set('qty', String(config.quantity))
  if (config.fabricColour) params.set('fabric', config.fabricColour)
  if (config.hardwareColour) params.set('hw', config.hardwareColour)
  return `/book?${params.toString()}`
}
