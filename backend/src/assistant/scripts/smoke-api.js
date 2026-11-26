/**
 * Live API smoke against local server (admin cookie).
 * Run: node src/assistant/scripts/smoke-api.js
 */
require('dotenv').config();

const BASE = process.env.ASSISTANT_SMOKE_URL || 'http://127.0.0.1:5000/api';

async function login() {
  const response = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || 'admin@gmail.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      rememberMe: true,
    }),
  });
  const setCookie = response.headers.getSetCookie?.() || [];
  const cookie = setCookie.map((value) => value.split(';')[0]).join('; ');
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Login failed: ${response.status} ${body}`);
  }
  if (!cookie) throw new Error('Login did not return auth cookie.');
  return cookie;
}

async function ask(cookie, payload) {
  const started = Date.now();
  const response = await fetch(`${BASE}/assistant/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify(payload),
  });
  const ms = Date.now() - started;
  const data = await response.json();
  return { status: response.status, ms, data };
}

async function main() {
  const cookie = await login();
  const help = await ask(cookie, { message: 'help', language: 'hi-IN' });
  if (help.status !== 200 || !help.data.sessionId) {
    throw new Error(`help failed: ${JSON.stringify(help)}`);
  }
  if (help.ms > 3000) throw new Error(`help too slow: ${help.ms}ms`);

  const follow = await ask(cookie, {
    message: 'organization की email बताओ',
    sessionId: help.data.sessionId,
    language: 'hi-IN',
  });
  if (follow.status !== 200) throw new Error(`follow failed: ${JSON.stringify(follow)}`);
  if (follow.ms > 3000) throw new Error(`follow too slow: ${follow.ms}ms`);

  console.log('API smoke ok');
  console.log(`help ${help.ms}ms · follow ${follow.ms}ms`);
  console.log(`help intent=${help.data.intent} source=${help.data.source}`);
  console.log(`follow intent=${follow.data.intent} reply=${String(follow.data.reply).slice(0, 120)}`);
}

main().catch((error) => {
  console.error(error.cause || error.stack || error.message || error);
  process.exitCode = 1;
});
