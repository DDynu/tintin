export function decodeJwtPayload(token: string) {
  const parts = token.split('.')
  if (parts.length < 2) return {}
  const base64url = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64url + '='.repeat((4 - (base64url.length % 4)) % 4)
  try {
    return JSON.parse(atob(padded))
  } catch {
    return {}
  }
}
