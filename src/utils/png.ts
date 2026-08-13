const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const SCHEDULE_KEYWORD = "Schedule";

interface Chunk {
  type: string;
  data: Uint8Array<ArrayBuffer>;
}

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let i = start; i < end; i++) {
    crc ^= bytes[i];
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function parseChunks(bytes: Uint8Array<ArrayBuffer>): Chunk[] {
  const chunks: Chunk[] = [];
  let offset = PNG_SIGNATURE.length;
  while (offset + 8 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
    const length = view.getUint32(0);
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 12 + length;
  }
  return chunks;
}

function buildChunk(type: string, data: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  const crc = crc32(out, 4, 8 + data.length);
  view.setUint32(8 + data.length, crc);
  return out;
}

function buildPng(chunks: Chunk[]): Uint8Array {
  let size = PNG_SIGNATURE.length;
  for (const chunk of chunks) size += 12 + chunk.data.length;
  const out = new Uint8Array(size);
  out.set(PNG_SIGNATURE);
  let offset = PNG_SIGNATURE.length;
  for (const chunk of chunks) {
    const built = buildChunk(chunk.type, chunk.data);
    out.set(built, offset);
    offset += built.length;
  }
  return out;
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function buildITxtChunk(keyword: string, text: string): Chunk {
  const keywordBytes = textEncoder.encode(keyword);
  const languageTag = textEncoder.encode("en");
  const translatedKeyword = textEncoder.encode(keyword);
  const textBytes = textEncoder.encode(text);
  const data = new Uint8Array(keywordBytes.length + 1 + 2 + languageTag.length + 1 + translatedKeyword.length + 1 + textBytes.length);
  let offset = 0;
  data.set(keywordBytes, offset);
  offset += keywordBytes.length + 1;
  data[offset - 1] = 0;
  data[offset] = 0;
  data[offset + 1] = 0;
  offset += 2;
  data.set(languageTag, offset);
  offset += languageTag.length + 1;
  data[offset - 1] = 0;
  data.set(translatedKeyword, offset);
  offset += translatedKeyword.length + 1;
  data[offset - 1] = 0;
  data.set(textBytes, offset);
  return { type: "iTXt", data };
}

export function embedSchedule(pngDataUrl: string, payload: string): string {
  const comma = pngDataUrl.indexOf(",");
  const prefix = pngDataUrl.slice(0, comma + 1);
  const chunks = parseChunks(base64ToBytes(pngDataUrl.slice(comma + 1)));
  const beforeIend = chunks.filter((c) => c.type !== "IEND");
  const iend = chunks.find((c) => c.type === "IEND");
  const rebuilt: Chunk[] = [...beforeIend, buildITxtChunk(SCHEDULE_KEYWORD, payload)];
  if (iend) rebuilt.push(iend);
  return prefix + bytesToBase64(buildPng(rebuilt));
}

function inflate(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const decompressor = new DecompressionStream("deflate");
  const stream = new Blob([bytes]).stream().pipeThrough(decompressor);
  return new Response(stream).arrayBuffer().then((buffer) => new Uint8Array(buffer));
}

async function findScheduleText(chunks: Chunk[]): Promise<string | null> {
  for (const chunk of chunks) {
    if (chunk.type !== "iTXt") continue;
    let offset = 0;
    while (chunk.data[offset] !== 0) offset++;
    const keyword = textDecoder.decode(chunk.data.subarray(0, offset));
    if (keyword !== SCHEDULE_KEYWORD) continue;
    offset++;
    const compressionFlag = chunk.data[offset];
    offset += 2;
    while (chunk.data[offset] !== 0) offset++;
    offset++;
    while (chunk.data[offset] !== 0) offset++;
    offset++;
    const textBytes = chunk.data.subarray(offset);
    return textDecoder.decode(compressionFlag === 1 ? await inflate(textBytes) : textBytes);
  }
  return null;
}

export async function extractSchedule(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const text = await findScheduleText(parseChunks(bytes));
  if (text === null) throw new Error("No embedded schedule found in image");
  return text;
}
