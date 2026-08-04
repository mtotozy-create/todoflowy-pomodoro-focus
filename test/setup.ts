import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "https://localhost",
});

// Setup DOM globals for Vitest
globalThis.window = dom.window as never;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLInputElement = dom.window.HTMLInputElement;
globalThis.HTMLSelectElement = dom.window.HTMLSelectElement;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.Event = dom.window.Event;
