declare module 'crypto' {
  interface Cipher {
    getAuthTag(): Buffer;
  }

  interface Decipher {
    setAuthTag(buffer: Buffer): this;
  }
}
