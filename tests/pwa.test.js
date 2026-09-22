import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { access, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { runInNewContext } from "node:vm";

const manifest = JSON.parse(await readFile(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
const indexHTML = await readFile(new URL("../index.html", import.meta.url), "utf8");
const serviceWorkerSource = await readFile(new URL("../service-worker.js", import.meta.url), "utf8");

test("manifest contains the required installability metadata", async () => {
  assert.equal(manifest.name, "Visual Division Tutor");
  assert.equal(manifest.short_name, "Division Tutor");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.theme_color, "#2d63d7");
  assert.equal(manifest.background_color, "#f5f8ff");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));

  for (const icon of manifest.icons) {
    await access(new URL(`../${icon.src}`, import.meta.url), constants.R_OK);
    const iconPath = new URL(`../${icon.src}`, import.meta.url);
    assert.ok((await stat(iconPath)).size > 0);
  }
});

test("index.html includes PWA metadata and registration", () => {
  assert.match(indexHTML, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(indexHTML, /name="theme-color" content="#2d63d7"/);
  assert.match(indexHTML, /src="\.\/pwa\.js"/);
});

test("error messages are announced to screen readers", () => {
  assert.match(indexHTML, /id="error-message"[^>]*role="alert"[^>]*aria-atomic="true"/);
  assert.match(indexHTML, /id="validation-message"[^>]*role="alert"[^>]*aria-atomic="true"/);
});

test("service worker precaches only local app resources", () => {
  assert.match(serviceWorkerSource, /visual-division-tutor-v6/);
  const shellMatches = serviceWorkerSource.match(/"\.\/[^\"]+"/g) ?? [];
  assert.ok(shellMatches.includes('"./index.html"'));
  assert.ok(shellMatches.includes('"./styles.css"'));
  assert.ok(shellMatches.includes('"./app.js"'));
  assert.ok(shellMatches.includes('"./division.js"'));
  assert.ok(shellMatches.includes('"./pwa.js"'));
  assert.ok(shellMatches.includes('"./manifest.webmanifest"'));
  assert.ok(!serviceWorkerSource.includes("https://"));
  assert.match(serviceWorkerSource, /requestURL\.origin !== self\.location\.origin/);
});

test("service worker caches the app shell during installation", async () => {
  const listeners = {};
  const storedRequests = [];
  const cache = {
    async addAll(requests) {
      storedRequests.push(...requests);
    },
    async put() {},
  };
  const fakeCaches = {
    async open() {
      return cache;
    },
    async keys() {
      return [];
    },
    async match() {
      return undefined;
    },
  };

  runInNewContext(serviceWorkerSource, {
    URL,
    caches: fakeCaches,
    console,
    Response,
    self: {
      location: { origin: "https://example.test" },
      clients: { claim() {} },
      skipWaiting() {},
      addEventListener(name, callback) {
        listeners[name] = callback;
      },
    },
  });

  let installPromise;
  listeners.install({ waitUntil(promise) { installPromise = promise; } });
  await installPromise;

  assert.ok(storedRequests.includes("./index.html"));
  assert.ok(storedRequests.includes("./division.js"));
  assert.ok(storedRequests.includes("./icons/icon-512.png"));
});

test("offline navigation falls back to the cached index page", async () => {
  const listeners = {};
  const cachedIndex = new Response("cached index page", { status: 200 });
  const fakeCache = {
    async match(request) {
      return request === "./index.html" || request.url === "https://example.test/"
        ? cachedIndex
        : undefined;
    },
    async put() {},
  };
  const fakeCaches = {
    async open() {
      return fakeCache;
    },
    async keys() {
      return [];
    },
    async match(request) {
      return fakeCache.match(request);
    },
  };

  runInNewContext(serviceWorkerSource, {
    URL,
    caches: fakeCaches,
    console,
    Response,
    fetch: async () => { throw new Error("offline"); },
    self: {
      location: { origin: "https://example.test" },
      clients: { claim() {} },
      skipWaiting() {},
      addEventListener(name, callback) {
        listeners[name] = callback;
      },
    },
  });

  let responsePromise;
  listeners.fetch({
    request: { method: "GET", mode: "navigate", url: "https://example.test/" },
    respondWith(promise) { responsePromise = promise; },
  });

  const response = await responsePromise;
  assert.equal(await response.text(), "cached index page");
});
