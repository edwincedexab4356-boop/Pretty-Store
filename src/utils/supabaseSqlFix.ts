export function isPermissionError(errOrMessage: any): boolean {
  if (!errOrMessage) return false;
  const str = typeof errOrMessage === 'string' ? errOrMessage : errOrMessage.message || '';
  return (
    str.includes('42501') ||
    str.includes('permission denied') ||
    str.includes('row-level security') ||
    str.includes('violates row-level security policy')
  );
}
