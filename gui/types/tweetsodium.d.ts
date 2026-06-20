declare module "tweetsodium" {
  // Sealed box : chiffre `message` à destination de la clé publique `publicKey`.
  export function seal(message: Uint8Array, publicKey: Uint8Array): Uint8Array;
}
