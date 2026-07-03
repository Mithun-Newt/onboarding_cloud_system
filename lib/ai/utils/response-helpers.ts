export function nullOrMessage<T>(value: T | null | undefined, message: string): T | string {
  return value ?? message;
}

export function formatError(message: string) {
  return { status: 'error' as const, message };
}
