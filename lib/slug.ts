export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ё/g, 'e')
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}
export function usernameFromName(name: string) {
  const base = name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '').slice(0, 14) || 'user';
  return `${base}${Math.floor(1000 + Math.random() * 9000)}`;
}
