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

export function validateQuantity(
  value: string,
  min: number,
  max: number,
): string | null {
  if (!value.trim()) return "La cantidad es obligatoria.";
  const n = Number(value);
  if (!Number.isInteger(n)) return "La cantidad debe ser un número entero.";
  if (n < min) return `La cantidad mínima es ${min}.`;
  if (n > max) return `La cantidad máxima es ${max}.`;
  return null;
}

export function validateUrl(value: string): string | null {
  if (!value.trim()) return "La URL del recurso es obligatoria.";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:")
      return "La URL debe comenzar con http:// o https://";
  } catch {
    return "Ingresa una URL válida (ej: https://ejemplo.com/documento.pdf).";
  }
  return null;
}

export function hasInvalidPhoneChars(value: string): boolean {
  return !/^[0-9+\-()\s]*$/.test(value);
}
