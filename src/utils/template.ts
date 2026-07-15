import type { CalendarEvent } from "../types";

export interface ScheduleTemplate {
  title: string;
  events: CalendarEvent[];
}

export function exportAsTemplate(
  events: CalendarEvent[],
  title: string,
  filename?: string,
) {
  const template: ScheduleTemplate = { title, events };
  const blob = new Blob([JSON.stringify(template, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? "schedule-template.json";
  link.click();
  URL.revokeObjectURL(url);
}

export function parseTemplateFile(file: File): Promise<ScheduleTemplate> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!Array.isArray(data.events)) {
          reject(new Error("Invalid template: missing events array"));
          return;
        }
        resolve(data as ScheduleTemplate);
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
