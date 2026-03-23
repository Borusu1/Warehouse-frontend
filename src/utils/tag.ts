export function normalizeTagId(tagId: string) {
  return tagId.trim().replace(/\s+/g, '').toUpperCase();
}
