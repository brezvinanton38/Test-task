export { COMPANY_SLUG } from '../config';

export const SERVICES = {
  haircut: 'Чоловіча стрижка',
  beardTrim: 'Стрижка бороди',
} as const;

/** Unique per call, so parallel runs never collide on the same client. */
export function randomValidPhone(): string {
  const rest = Math.floor(1000000 + Math.random() * 8999999).toString();
  return `067${rest}`.slice(0, 9);
}

export function randomClientName(prefix: string): { firstName: string; lastName: string } {
  const suffix = Math.floor(Math.random() * 100000);
  return { firstName: `${prefix}`, lastName: `Test${suffix}` };
}
