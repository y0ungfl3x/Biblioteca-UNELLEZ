export function validateEmail(value: string): string | null {
  if (!value.trim()) return "El correo electrónico es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()))
    return "Ingresa un correo válido (ej: usuario@unellez.edu.ve).";
  return null;
}

export function validateRequired(value: string, message: string): string | null {
  if (!value.trim()) return message;
  return null;
}

export function validateMinLength(
  value: string,
  min: number,
  emptyMessage: string,
  shortMessage: string,
): string | null {
  if (!value.trim()) return emptyMessage;
  if (value.length < min) return shortMessage;
  return null;
}
