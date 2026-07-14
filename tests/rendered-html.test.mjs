import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders product metadata without starter markers", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /买不买/);
  assert.match(html, /不荐股/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Starter Project/i);
});

test("finished app keeps the V1 privacy and deployment boundaries in source", async () => {
  const [app, domain, layout, hosting, packageJson] = await Promise.all([
    readFile(new URL("../app/quiz-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/domain.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(app, /localStorage/);
  assert.match(app, /1080/);
  assert.match(app, /1350/);
  assert.match(app, /navigator\.clipboard/);
  assert.match(app, /decodeSharedResult/);
  assert.match(app, /https:\/\/x\.com\/vigorX777/);
  assert.match(app, /https:\/\/github\.com\/vigorX777\/mai-bu-mai/);
  assert.match(app, /懂点儿AI/);
  assert.match(app, /不构成投资建议/);
  assert.match(domain, /const question/g);
  assert.match(layout, /lang="zh-CN"/);
  assert.deepEqual(JSON.parse(hosting), { d1: null, r2: null });
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(app, /fetch\(["'`]https?:\/\//);
});
