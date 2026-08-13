import { DAYS } from "../types";
import type { CalendarEvent, Day } from "../types";
import { THEMES } from "../components/ThemeDropdown";
import type { ThemeFamily, ThemeMode } from "../components/ThemeDropdown";
import { LIGHT_PALETTE } from "./colors";
import { parseTime } from "./time";
import { parseTemplate } from "./template";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toUrlSafe(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(urlSafe: string): string {
  const base64 = urlSafe.replace(/-/g, "+").replace(/_/g, "/");
  return base64 + "=".repeat((4 - (base64.length % 4)) % 4);
}

async function deflate(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function inflate(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function encodeShareData(payload: string): Promise<string> {
  const bytes = textEncoder.encode(payload);
  if (typeof CompressionStream !== "undefined") {
    const compressed = await deflate(bytes);
    if (compressed.length < bytes.length) {
      return "z" + toUrlSafe(bytesToBase64(compressed));
    }
  }
  return "r" + toUrlSafe(bytesToBase64(bytes));
}

export async function decodeShareData(encoded: string): Promise<string> {
  const kind = encoded.charAt(0);
  const bytes = base64ToBytes(fromUrlSafe(encoded.slice(1)));
  if (kind === "z") {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("DecompressionStream is not supported in this browser");
    }
    return textDecoder.decode(await inflate(bytes));
  }
  return textDecoder.decode(bytes);
}

export async function buildShareUrl(payload: string): Promise<string> {
  const base = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  return `${base}#d=${await encodeShareData(payload)}`;
}

export function extractShareHash(hash: string): string | null {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const value = params.get("d");
  return value && (value.startsWith("z") || value.startsWith("r")) ? value : null;
}

export interface SharePayload {
  title: string;
  events: CalendarEvent[];
  themeFamily?: string;
  themeMode?: string;
}

export interface ShareInput {
  title: string;
  events: CalendarEvent[];
  themeFamily: ThemeFamily;
  themeMode: ThemeMode;
}

function toMinutes(time: string): number {
  return parseTime(time);
}

function fromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function encodeSharePayload({ title, events, themeFamily, themeMode }: ShareInput): string {
  const families = Object.keys(THEMES) as ThemeFamily[];
  const modes = Object.keys(THEMES[themeFamily]) as ThemeMode[];
  const payload: {
    v: 2;
    t?: string;
    e: unknown[];
    f: number;
    m: number;
  } = {
    v: 2,
    e: events.map((event) => {
      const colorIndex = LIGHT_PALETTE.indexOf(event.color);
      const encoded: unknown[] = [
        event.name,
        colorIndex !== -1 ? colorIndex : event.color,
        event.slots.map((slot) => [
          toMinutes(slot.startTime),
          toMinutes(slot.endTime),
          slot.days.map((day) => DAYS.indexOf(day)),
        ]),
      ];
      if (event.professor) encoded.push(event.professor);
      return encoded;
    }),
    f: families.indexOf(themeFamily),
    m: modes.indexOf(themeMode),
  };
  if (title) payload.t = title;
  return JSON.stringify(payload);
}

function parseCompactPayload(data: { t?: string; e?: unknown; f?: unknown; m?: unknown }): SharePayload {
  if (!Array.isArray(data.e)) {
    throw new Error("Invalid share payload: missing events");
  }
  const events: CalendarEvent[] = data.e.map((raw) => {
    if (!Array.isArray(raw) || raw.length < 3) {
      throw new Error("Invalid share payload: bad event");
    }
    const [nameValue, colorValue, rawSlots, professorValue] = raw;
    if (typeof nameValue !== "string") {
      throw new Error("Invalid share payload: bad event name");
    }
    let color: string;
    if (typeof colorValue === "number") {
      color = LIGHT_PALETTE[colorValue];
    } else if (typeof colorValue === "string") {
      color = colorValue;
    } else {
      throw new Error("Invalid share payload: bad event color");
    }
    if (!color) {
      throw new Error("Invalid share payload: bad event color");
    }
    if (!Array.isArray(rawSlots)) {
      throw new Error("Invalid share payload: bad event slots");
    }
    const slots = rawSlots.map((rawSlot) => {
      if (!Array.isArray(rawSlot) || rawSlot.length < 3) {
        throw new Error("Invalid share payload: bad slot");
      }
      const [startValue, endValue, rawDays] = rawSlot;
      if (typeof startValue !== "number" || typeof endValue !== "number" || !Array.isArray(rawDays)) {
        throw new Error("Invalid share payload: bad slot data");
      }
      const days: Day[] = [];
      for (const dayValue of rawDays) {
        const day = DAYS[dayValue as number];
        if (day === undefined) {
          throw new Error("Invalid share payload: bad slot day");
        }
        days.push(day);
      }
      return { startTime: fromMinutes(startValue), endTime: fromMinutes(endValue), days };
    });
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      name: nameValue,
      color,
      slots,
    };
    if (typeof professorValue === "string" && professorValue) {
      event.professor = professorValue;
    }
    return event;
  });
  const result: SharePayload = { title: typeof data.t === "string" ? data.t : "", events };
  if (typeof data.f === "number" && typeof data.m === "number") {
    const families = Object.keys(THEMES) as ThemeFamily[];
    const family = families[data.f];
    if (family) {
      const mode = Object.keys(THEMES[family])[data.m] as ThemeMode | undefined;
      if (mode) {
        result.themeFamily = family;
        result.themeMode = mode;
      }
    }
  }
  return result;
}

export function parseSharePayload(text: string): SharePayload {
  const data = JSON.parse(text) as { v?: unknown; themeFamily?: unknown; themeMode?: unknown };
  if (data.v === 2) {
    return parseCompactPayload(data as { t?: string; e?: unknown; f?: unknown; m?: unknown });
  }
  const template = parseTemplate(text);
  return {
    title: template.title,
    events: template.events,
    themeFamily: typeof data.themeFamily === "string" ? data.themeFamily : undefined,
    themeMode: typeof data.themeMode === "string" ? data.themeMode : undefined,
  };
}