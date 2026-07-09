// Client side hashing for the purpose of
// minimizing handling/exposure of clear text secrets
// This is by no means a sufficient security measure.
export async function hash(password: string) {
  // Encode the password as UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Hash the password using SHA-256
  const hash = await crypto.subtle.digest("SHA-256", data);

  // Convert the hash to a hexadecimal string
  return Array
    .from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
