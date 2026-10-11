export function calculateExpiryDate(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString();
}
