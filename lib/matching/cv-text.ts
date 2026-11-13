import 'server-only';
// Must load before pdf-parse: it gives pdf.js the DOMMatrix/ImageData/Path2D it
// needs on a server (from @napi-rs/canvas, imported here so deployments trace it)
// and the pdf.js worker inline, so nothing is read from a file path at runtime.
import { CanvasFactory, getData } from 'pdf-parse/worker';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { CV_BUCKET } from '@/lib/cv-storage';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { normalizeText } from './vector';

/** Stored CV text is capped; the embedding reads far less than this anyway (see MAX_CHUNKS). */
const MAX_CV_TEXT_CHARS = 20_000;

/** Pages read from a PDF. A CV is a few pages; a crafted file can claim thousands. */
const MAX_PDF_PAGES = 15;

/** Most a .docx may unpack to. A real CV is a few MB; a zip bomb unpacks to gigabytes. */
const MAX_DOCX_UNPACKED_BYTES = 50 * 1024 * 1024;

PDFParse.setWorker(getData());

async function pdfText(data: Uint8Array): Promise<string> {
  const parser = new PDFParse({ data, CanvasFactory });
  try {
    // A plain newline between pages instead of the default "-- 1 of 2 --" marker.
    return (await parser.getText({ pageJoiner: '\n', first: MAX_PDF_PAGES })).text;
  } finally {
    await parser.destroy();
  }
}

/**
 * The total size a ZIP says its files unpack to, read from its central
 * directory without unpacking anything. Null if the file isn't a readable ZIP.
 */
export function zipUnpackedBytes(buffer: Buffer): number | null {
  const END_SIGNATURE = 0x06054b50;
  const ENTRY_SIGNATURE = 0x02014b50;
  // The end record sits in the last 22 bytes plus an optional comment of up to 65,535.
  const searchFrom = Math.max(0, buffer.length - 22 - 0xffff);
  let end = -1;
  for (let i = buffer.length - 22; i >= searchFrom; i--) {
    if (buffer.readUInt32LE(i) === END_SIGNATURE) {
      end = i;
      break;
    }
  }
  if (end < 0) return null;

  const entries = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16);
  let total = 0;
  for (let i = 0; i < entries; i++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== ENTRY_SIGNATURE) return null;
    total += buffer.readUInt32LE(offset + 24);
    offset += 46 + buffer.readUInt16LE(offset + 28) + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32);
  }
  return total;
}

async function docxText(buffer: Buffer): Promise<string | null> {
  const unpacked = zipUnpackedBytes(buffer);
  // Not a readable ZIP, or far bigger than any CV: treated as unreadable instead of unpacked.
  if (unpacked === null || unpacked > MAX_DOCX_UNPACKED_BYTES) return null;
  return (await mammoth.extractRawText({ buffer })).value;
}

/**
 * Downloads a CV from storage and returns its plain text, or null when there is
 * none to read: an old binary .doc, a scanned PDF with no text layer, or an
 * empty file. Download and parse errors are thrown for the caller to log.
 */
export async function extractCvText(objectPath: string): Promise<string | null> {
  const ext = objectPath.split('.').pop()?.toLowerCase();
  if (ext !== 'pdf' && ext !== 'docx') return null;

  const { data, error } = await getSupabaseAdmin().storage.from(CV_BUCKET).download(objectPath);
  if (error) throw error;
  const buffer = Buffer.from(await data.arrayBuffer());

  const raw = ext === 'pdf' ? await pdfText(new Uint8Array(buffer)) : await docxText(buffer);
  if (raw === null) return null;
  const text = normalizeText(raw).slice(0, MAX_CV_TEXT_CHARS);
  return text || null;
}
