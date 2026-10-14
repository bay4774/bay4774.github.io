export function withBase(path: string): string {
  if (/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
