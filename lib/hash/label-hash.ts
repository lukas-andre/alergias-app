/**
 * Label Hash Utility
 *
 * Generates MD5 hash from image data for deduplication and caching.
 * Used to prevent re-analyzing the same label multiple times.
 */

import crypto from "crypto";

/**
 * Calculate MD5 hash from image buffer
 *
 * @param buffer - Image data as Buffer or ArrayBuffer
 * @returns MD5 hash as hex string
 */
export function calculateLabelHash(buffer: Buffer | ArrayBuffer): string {
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  return crypto.createHash("md5").update(data).digest("hex");
}

/**
 * Calculate MD5 hash from base64 data URL
 *
 * @param dataUrl - Image as base64 data URL (e.g., "data:image/jpeg;base64,...")
 * @returns MD5 hash as hex string
 */
export function calculateHashFromDataUrl(dataUrl: string): string {
  // Extract base64 data from data URL
  const base64Data = dataUrl.split(",")[1];
  if (!base64Data) {
    throw new Error("Invalid data URL format");
  }

  const buffer = Buffer.from(base64Data, "base64");
  return calculateLabelHash(buffer);
}

/**
 * Calculate MD5 hash from text (for text-only scans)
 *
 * @param text - OCR text or pasted text
 * @returns MD5 hash as hex string
 */
export function calculateHashFromText(text: string): string {
  // Normalize text: lowercase, trim whitespace, remove extra spaces
  const normalized = text.toLowerCase().trim().replace(/\s+/g, " ");
  return crypto.createHash("md5").update(normalized, "utf8").digest("hex");
}
