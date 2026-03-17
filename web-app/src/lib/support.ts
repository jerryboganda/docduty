export const SUPPORT_EMAIL = "support@docduty.pk";
export const SUPPORT_PHONE = "+92 321 4261 950";

/** Safely extract an error message from an unknown catch value. */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'An unexpected error occurred';
}
