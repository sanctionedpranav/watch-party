/**
 * password.js
 * -----------
 * Never store plain-text passwords. bcrypt adds a random SALT and runs a slow
 * hash (cost factor = SALT_ROUNDS) so leaked hashes are very hard to brute-force.
 */
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/** "secret123" -> "$2a$10$Kx..." (different every time because of the salt) */
export const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, SALT_ROUNDS);

/** Re-hashes the input with the stored salt and compares. Returns true/false. */
export const comparePassword = (plainPassword, hashedPassword) =>
  bcrypt.compare(plainPassword, hashedPassword);
