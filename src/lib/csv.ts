export const quoteCsvCell = (value: string | number) => {
  const text = String(value);
  const safeText = typeof value === "string" && /^[\s\uFEFF]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
};
