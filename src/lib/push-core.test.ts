import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReminderPayload, buildTestPayload, isAllowedPushEndpoint, parseSubscription, urlBase64ToUint8Array } from './push-core';

const KEYS = { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', auth: 'tBHItJI5svbpez7KI4CCXg' };

test('dovoljeni so samo znani push strežniki prek HTTPS', () => {
  assert.ok(isAllowedPushEndpoint('https://fcm.googleapis.com/fcm/send/abc'));
  assert.ok(isAllowedPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abc'));
  assert.ok(isAllowedPushEndpoint('https://web.push.apple.com/QWxs'));
  assert.ok(isAllowedPushEndpoint('https://wns2-par02p.notify.windows.com/w/?token=x'));
  assert.ok(!isAllowedPushEndpoint('http://fcm.googleapis.com/fcm/send/abc'));
  assert.ok(!isAllowedPushEndpoint('https://evil.example.com/fcm.googleapis.com'));
  assert.ok(!isAllowedPushEndpoint('https://fcm.googleapis.com.evil.com/x'));
  assert.ok(!isAllowedPushEndpoint('https://127.0.0.1/x'));
  assert.ok(!isAllowedPushEndpoint('https://user:pw@fcm.googleapis.com/x'));
  assert.ok(!isAllowedPushEndpoint('https://fcm.googleapis.com:8443/x'));
  assert.ok(!isAllowedPushEndpoint('not a url'));
  assert.ok(isAllowedPushEndpoint('https://push.moj.si/x', 'push.moj.si'));
});

test('parseSubscription sprejme veljavno in zavrne neveljavno obliko', () => {
  const ok = parseSubscription({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: KEYS });
  assert.deepEqual(ok, { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', ...KEYS });
  assert.equal(parseSubscription(null), null);
  assert.equal(parseSubscription({ endpoint: 'https://fcm.googleapis.com/x', keys: { p256dh: '<script>', auth: KEYS.auth } }), null);
  assert.equal(parseSubscription({ endpoint: 'https://evil.com/x', keys: KEYS }), null);
  assert.equal(parseSubscription({ endpoint: 'https://fcm.googleapis.com/x' }), null);
});

test('besedilo obvestila', () => {
  const p = buildReminderPayload({ dateStr: '2026-10-12', types: ['mesani'], note: null, villageLabel: 'Smokuč', daysBefore: 1 });
  assert.equal(p.title, 'Jutri je odvoz — Smokuč');
  assert.match(p.body, /ponedeljek, 12\. oktober 2026/);
  assert.match(p.body, /6\. ure/);
  const q = buildReminderPayload({ dateStr: '2026-10-13', types: ['embalaza'], note: 'Prestavljen odvoz (praznik)', villageLabel: 'Breg', daysBefore: 0 });
  assert.match(q.title, /^Danes je odvoz/);
  assert.match(q.body, /Prestavljen odvoz/);
  assert.match(buildTestPayload('Vrba').body, /Vrba/);
});

test('urlBase64ToUint8Array pretvori VAPID ključ (65 bajtov)', () => {
  const arr = urlBase64ToUint8Array(KEYS.p256dh);
  assert.equal(arr.length, 65);
  assert.equal(arr[0], 0x04);
});
