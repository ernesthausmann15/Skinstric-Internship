/**
 * Name and location are collected before any portrait is read.
 * A value is one or more words of letters. Digits, punctuation, and an
 * empty field cannot continue, because the Phase One service stores that
 * pair as the customer record.
 * The pair is written to local storage first, then posted. The service
 * answers with `{ success, message }`. The documented `{ SUCCUSS }` key is
 * accepted as the same success signal.
 */

const PHASE_ONE =
  "https://us-central1-api-skinstric-ai.cloudfunctions.net/skinstricPhaseOne";

const STORAGE_KEY = "skinstric-customer";

const PERSON_TEXT = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

export type Customer = {
  name: string;
  location: string;
};

export function isPersonText(value: string) {
  return PERSON_TEXT.test(value.trim());
}

export function readCustomer(): Customer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Customer>;
    const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
    const location = typeof parsed.location === "string" ? parsed.location.trim() : "";
    if (!isPersonText(name) || !isPersonText(location)) return null;
    return { name, location };
  } catch {
    return null;
  }
}

export function saveCustomer(customer: Customer) {
  const record = {
    name: customer.name.trim(),
    location: customer.location.trim(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  return record;
}

export async function submitCustomer(customer: Customer) {
  const record = saveCustomer(customer);
  if (!isPersonText(record.name) || !isPersonText(record.location)) {
    throw new Error("Enter a name and a location using letters only.");
  }
  const response = await fetch(PHASE_ONE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: record.name, location: record.location }),
  });
  const body = (await response.json()) as {
    SUCCUSS?: unknown;
    success?: unknown;
    message?: unknown;
  };
  const documented = typeof body.SUCCUSS === "string" ? body.SUCCUSS : "";
  const message = typeof body.message === "string" ? body.message : "";
  const accepted = documented.length > 0 || (body.success === true && message.length > 0);
  if (!response.ok || !accepted) {
    throw new Error("The introduction could not be saved.");
  }
  return documented || message;
}
