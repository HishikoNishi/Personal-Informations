export const PBKDF2_ITERATIONS: number;
export function inspectPasswordHash(encoded: string): { valid: true; iterations: number; salt: Uint8Array; digest: Uint8Array } | { valid: false; message: string };
export function isValidPasswordHashConfiguration(encoded: string): boolean;
export function isValidSessionSecretConfiguration(secret: string): boolean;
export function hashPassword(password: string, salt?: Uint8Array, iterations?: number, cryptoApi?: Crypto): Promise<string>;
export function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean;
export function verifyPassword(password: string, encoded: string, cryptoApi?: Crypto): Promise<boolean>;
