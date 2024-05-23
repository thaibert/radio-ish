
export const generateRandomString = (length: number) => {
  const values = crypto.getRandomValues(new Uint8Array(length));
  return spotifyBase64encode(values)
}

export const sha256 = async (codePoints: string) => window.crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(codePoints)
)

export const spotifyBase64encode = (input: ArrayLike<number> | ArrayBufferLike) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}