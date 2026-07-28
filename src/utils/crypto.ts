// Utility for encrypting and decrypting Arcana Journal backup files securely.

const BACKUP_MAGIC_HEADER = "ARCANA_JOURNAL_BACKUP_V1";
const ENCRYPTION_PASSPHRASE = "ArcanaJournal_Wisdom_SecretKey_2026";

// Derives a Web Crypto Key using PBKDF2
async function getCryptoKey(salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(ENCRYPTION_PASSPHRASE),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface BackupPackage {
  magic: string;
  version: number;
  exportedAt: string;
  count: number;
  salt: string;
  iv: string;
  payload: string; // Base64 AES-GCM Encrypted JSON
}

/**
 * Encrypts array of journal entries into a secure JSON string backup package.
 */
export async function exportEncryptedBackup(entries: unknown[]): Promise<string> {
  const jsonString = JSON.stringify(entries);
  const enc = new TextEncoder();
  const data = enc.encode(jsonString);

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await getCryptoKey(salt);

  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  const backupPackage: BackupPackage = {
    magic: BACKUP_MAGIC_HEADER,
    version: 1,
    exportedAt: new Date().toISOString(),
    count: entries.length,
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    payload: arrayBufferToBase64(encryptedContent),
  };

  return JSON.stringify(backupPackage, null, 2);
}

/**
 * Decrypts and validates an imported backup package string.
 * Throws human-readable error if invalid header, corrupt file, or wrong format.
 */
export async function importEncryptedBackup(rawJson: string): Promise<any[]> {
  let pkg: Partial<BackupPackage>;
  try {
    pkg = JSON.parse(rawJson);
  } catch (err) {
    throw new Error("올바른 아르카나 백업 데이터 형식(JSON)이 아닙니다.");
  }

  // Validate magic header
  if (pkg.magic !== BACKUP_MAGIC_HEADER) {
    throw new Error("아르카나 저널의 정식 백업 파일이 아니거나 손상된 파일입니다.");
  }

  if (!pkg.salt || !pkg.iv || !pkg.payload) {
    throw new Error("백업 파일의 암호화 데이터 검증 정보가 유실되었습니다.");
  }

  try {
    const salt = base64ToUint8Array(pkg.salt);
    const iv = base64ToUint8Array(pkg.iv);
    const encryptedBytes = base64ToUint8Array(pkg.payload);

    const key = await getCryptoKey(salt);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedBytes
    );

    const dec = new TextDecoder();
    const decryptedJson = dec.decode(decryptedBuffer);
    const parsedData = JSON.parse(decryptedJson);

    if (!Array.isArray(parsedData)) {
      throw new Error("복호화된 백업 데이터가 올바른 저널 리스트 형식이 아닙니다.");
    }

    return parsedData;
  } catch (err: any) {
    if (err.message && err.message.includes("아르카나")) {
      throw err;
    }
    throw new Error("백업 파일의 암호 해독에 실패했습니다. 유효하지 않은 파일이거나 데이터가 위변조되었습니다.");
  }
}
