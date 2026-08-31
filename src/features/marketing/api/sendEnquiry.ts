import { requestQuote, type ApiResult } from '../../../lib/api';

// ---------------------------------------------------------------------------
// The contact form's one network operation.
//
// Extracted from ContactPage in Phase 4.1.3. §4: "api/ is the only place in a
// feature that touches the network", and "components/ do not fetch".
//
// ---------------------------------------------------------------------------
// WHAT THIS WRAPPER IS ACTUALLY FOR, AND IT IS NOT TIDINESS.
//
// A contact enquiry has no blind configuration — somebody is asking a question,
// not ordering a roller. But it is stored in the same table as a quote request
// and read out of the same inbox, and `quote_requests` has NOT NULL columns for
// blind_type, window_size and operation (supabase/migrations/0001_bookings.sql).
//
// So three placeholder values have to be supplied, and they were previously
// typed inline in the middle of a submit handler, in a component, where they
// read as if somebody had chosen them:
//
//     blindType: 'blockout', windowSize: 'medium', operation: 'manual'
//
// They are not choices. They are the schema's defaults, and the real message
// travels in `notes`. Putting them here, named and explained once, is the
// difference between a reader thinking the contact form quietly quotes for a
// medium blockout roller and knowing that it does not.
//
// IF THE SCHEMA EVER MAKES THOSE COLUMNS NULLABLE, this wrapper is where the
// placeholders come out — one file, not two components.
// ---------------------------------------------------------------------------

/** The schema's defaults, not the customer's choices. See above. */
const NO_CONFIGURATION = {
  blindType: 'blockout',
  windowSize: 'medium',
  operation: 'manual',
  quantity: 1,
} as const;

/** Said in `notes` when the visitor left the message empty, so the row is never
 *  a name and an address with no indication of what was wanted. */
const NO_MESSAGE = 'Sent via the contact form (no configuration).';

export interface EnquiryInput {
  name: string;
  email: string;
  phone: string;
  notes: string;
  /** Honeypot. Empty for a human; the server silently drops a filled one. */
  website: string;
  turnstileToken: string;
}

export function sendEnquiry(input: EnquiryInput): Promise<ApiResult<{ id: string }>> {
  return requestQuote({
    name: input.name,
    email: input.email,
    phone: input.phone,
    notes: input.notes || NO_MESSAGE,
    website: input.website,
    turnstileToken: input.turnstileToken,
    ...NO_CONFIGURATION,
  });
}
