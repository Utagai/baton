import { randomBytes, pbkdf2Sync } from 'crypto';

const defaultPBKDF2Iterations = 10000;

export type PasswordHashInfo = {
  hash: string;
  salt: string;
  iterations: number;
};

function hashPassword(
  plaintextPassword: string,
  salt: string,
  iterations: number,
): PasswordHashInfo {
  const hash = pbkdf2Sync(plaintextPassword, salt, iterations, 512, 'sha512');

  return {
    hash: hash.toString('hex'),
    salt,
    iterations,
  };
}

export function createPasswordHashInfo(
  plaintextPassword: string,
): PasswordHashInfo {
  const salt = randomBytes(128).toString('base64');
  return hashPassword(plaintextPassword, salt, defaultPBKDF2Iterations);
}

export function passwordMatchesHash(
  plaintextPassword: string,
  expectedPasswordHash: PasswordHashInfo,
): boolean {
  const hashedPassword = hashPassword(
    plaintextPassword,
    expectedPasswordHash.salt,
    expectedPasswordHash.iterations,
  );

  return hashedPassword.hash === expectedPasswordHash.hash;
}
