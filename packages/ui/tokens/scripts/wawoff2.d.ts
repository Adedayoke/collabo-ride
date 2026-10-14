// wawoff2 ships no types; this is the one call the token build uses.
declare module 'wawoff2' {
  export function compress(ttf: Uint8Array): Promise<Uint8Array>
}
