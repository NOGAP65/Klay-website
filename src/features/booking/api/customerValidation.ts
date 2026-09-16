import { validateCustomer, validateLocality, type LocalityIndex } from '@/core/customerValidation';
import localityUrl from '@/core/data/au-localities.json?url';

let localityRequest: Promise<LocalityIndex> | undefined;

/** Public, static asset. Never sends the customer's details to a lookup service. */
function fetchLocalities(): Promise<LocalityIndex> {
  if (!localityRequest) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    localityRequest = fetch(localityUrl, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Locality list unavailable');
        return await response.json() as LocalityIndex;
      }).catch((error: unknown) => { localityRequest = undefined; throw error; })
      .finally(() => clearTimeout(timeout));
  }
  return localityRequest;
}

export async function validateInstallationForm(form: Record<string, unknown>) {
  const errors = validateCustomer(form, 'installation');
  if (errors.postcode || errors.suburb) return errors;
  try { return { ...errors, ...validateLocality(form, await fetchLocalities()) }; }
  catch { return { ...errors, postcode: 'The suburb list could not load. Check your connection and try again; your details are still here.' }; }
}
