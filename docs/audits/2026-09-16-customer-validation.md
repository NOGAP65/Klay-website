# Customer field validation

Both the browser and the API now use `shared-core/customerValidation.ts`.
The API rejects invalid details before captcha verification, database writes,
email or Stripe requests. Disabling browser validation cannot bypass the rules.

- Full name with letters, normal name punctuation and separate name components;
  Unicode letters/accents are supported, including unspaced East Asian names.
- Email syntax checked with validator.js, preserving the mailbox's case and
  legitimate plus-addresses. No arbitrary ban on common or short email names.
- Installation enquiries require an Australian mobile or landline, including
  area code. Domestic and +61 formatting work; incomplete/repeated dummy digits
  are rejected. Contact phone remains optional but must be valid when supplied.
- Installation street number/name, suburb and postcode are required. PO boxes
  are not installation addresses. The suburb/postcode pair must match the
  bundled GeoNames snapshot; unit, lot and street-number ranges are supported.
- Preferred date remains optional. If supplied it must be a real date between
  tomorrow and 365 days ahead, using Australia's Melbourne business timezone.
  The browser calendar exposes the same bounds; the server recalculates them.
- Contact message is required (10–2000 characters). Installation notes are
  optional; supplied notes use the same bounds. Existing control-character,
  type, aggregate payload and field-length checks remain enforced.

Errors appear beside fields while moving between inputs and on submission.
Editing clears that field's old error; blur cannot erase a locality/API error.
Blur does not steal focus or move a submit button during a tap.
A failed locality download retains the form and can be retried; it never silently
skips address checking. The lookup uses a separate cached 229 KB JSON asset, not
startup JavaScript, and transmits no customer details to GeoNames.

`enquiryType: contact` allows an address-free general enquiry only. Requests with
installation fields or basket items cannot use it to bypass installation rules;
checkout always enforces installation requirements.

## Limits

Formatting and a locality match are not identity, mailbox ownership, phone
ownership or proof that a street/property exists. A plausible `fafa@gmail.com`
cannot honestly be labelled fake by its spelling. Email/SMS confirmation and an
authoritative street-address provider are separate launch decisions. GeoNames
can have omissions; update its snapshot when a legitimate mismatch is found.

Sources: [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html),
[ACMA numbering](https://www.acma.gov.au/choose-your-phone-number),
[validator.js](https://github.com/validatorjs/validator.js), and
[GeoNames data/licensing](https://download.geonames.org/export/zip/readme.txt).

Validation: all 61 domain tests passed, including direct API rejection of the
example's invalid details. The six-profile browser run passed all 66 tests for
forms, loading and joinery. An additional 12-test form/contact recovery run passed
on desktop, Android and iOS profiles. The complete production verification and
staged-file security scan passed. Live email/Stripe transactions were not sent.
