// ==UserScript==
// @name         GTO Wizard → Discord on/off notifier
// @namespace    poon.login-notifier
// @version      1.1
// @description  Posts "on" to a Discord channel when you open GTO Wizard and "off" when you leave, so two people don't use the shared account at once.
// @match        https://gtowizard.com/*
// @match        https://*.gtowizard.com/*
// @noframes
// @downloadURL  https://raw.githubusercontent.com/bluemoonblublu-art/discord-login-notifier/main/login-notifier.user.js
// @updateURL    https://raw.githubusercontent.com/bluemoonblublu-art/discord-login-notifier/main/login-notifier.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      discord.com
// @connect      discordapp.com
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const HEARTBEAT_MS = 20 * 1000;       // each open tab refreshes "still here" this often
  const LIVE_MS = 90 * 1000;            // a tab silent for longer than this counts as closed (background tabs are throttled)
  const SESSION_GAP_MS = 3 * 60 * 1000; // nothing open on the site for this long = next visit is a new session
  const AUTO_OFF_HOST = 'app.gtowizard.com'; // only the app (a single-page app) unloads on tab close rather than on every click
  const WEBHOOK_RE = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/;

  const tabId = Math.random().toString(36).slice(2);
  const stamp = () => new Date().toLocaleString();

  // ---------- settings (stored by Tampermonkey, never in the file) ----------

  function askSettings() {
    const url = prompt('Discord webhook URL for the on/off channel:', GM_getValue('webhook', ''));
    if (url === null) return false;
    if (!WEBHOOK_RE.test(url.trim())) { alert('That does not look like a Discord webhook URL.'); return false; }
    const who = prompt('Your name (shown in Discord):', GM_getValue('who', ''));
    if (who === null || !who.trim()) return false;
    GM_setValue('webhook', url.trim());
    GM_setValue('who', who.trim());
    return true;
  }

  GM_registerMenuCommand('Set webhook / name', askSettings);

  if (!GM_getValue('webhook') || !GM_getValue('who')) {
    if (!askSettings()) return;
  }
  const webhook = () => GM_getValue('webhook');
  const who = () => GM_getValue('who');

  // ---------- Discord ----------

  function payload(text) {
    return { content: text, username: 'GTO Wizard Monitor', allowed_mentions: { parse: [] } };
  }

  function post(text) {
    GM_xmlhttpRequest({
      method: 'POST',
      url: webhook(),
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(payload(text)),
      onload: (r) => { if (r.status >= 300) console.warn('[login-notifier] Discord replied', r.status, r.responseText); },
      onerror: (e) => console.warn('[login-notifier] network error', e),
    });
  }

  // sendBeacon survives tab close; Discord accepts multipart with a payload_json field.
  function beacon(text) {
    const form = new FormData();
    form.append('payload_json', JSON.stringify(payload(text)));
    navigator.sendBeacon(webhook(), form);
  }

  // ---------- open-tab tracking ----------

  function liveOtherTabs() {
    const now = Date.now();
    const tabs = GM_getValue('tabs', {});
    return Object.keys(tabs).filter((id) => id !== tabId && now - tabs[id] < LIVE_MS);
  }

  function touch() {
    const now = Date.now();
    const tabs = GM_getValue('tabs', {});
    for (const id of Object.keys(tabs)) if (now - tabs[id] > LIVE_MS) delete tabs[id];
    tabs[tabId] = now;
    GM_setValue('tabs', tabs);
    GM_setValue('lastSeen', now);
  }

  function leave() {
    const tabs = GM_getValue('tabs', {});
    delete tabs[tabId];
    GM_setValue('tabs', tabs);
    GM_setValue('lastSeen', Date.now());
  }

  // ---------- on / off ----------

  function setState(s) { GM_setValue('state', s); updateButton(); }

  function sendOn() {
    post(`🟢 **on** — ${who()} opened GTO Wizard (${stamp()})`);
    setState('on');
  }

  function sendOff(reason) {
    post(`🔴 **off** — ${who()} ${reason} (${stamp()})`);
    setState('off');
  }

  function maybeSendOn() {
    const recent = Date.now() - GM_getValue('lastSeen', 0) < SESSION_GAP_MS;
    const alreadyOn = GM_getValue('state', 'off') === 'on';
    // Same session if another tab is open, or this is just a page change / reload.
    if (alreadyOn && (liveOtherTabs().length || recent)) return;
    sendOn();
  }

  // ---------- page button ----------

  const btn = document.createElement('button');
  Object.assign(btn.style, {
    position: 'fixed', right: '12px', bottom: '12px', zIndex: 2147483647,
    padding: '6px 10px', font: '12px sans-serif', color: '#fff',
    border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: '0.85',
  });
  function updateButton() {
    const on = GM_getValue('state', 'off') === 'on';
    btn.textContent = on ? 'Send OFF' : 'Send ON';
    btn.title = on ? 'Tell the Discord group you are done with the account' : 'Tell the Discord group you are using the account';
    btn.style.background = on ? '#c0392b' : '#27ae60';
  }
  btn.addEventListener('click', () => {
    if (GM_getValue('state', 'off') === 'on') sendOff('is done with GTO Wizard');
    else sendOn();
  });
  document.body.appendChild(btn);

  GM_registerMenuCommand('Send "off" to Discord', () => sendOff('is done with GTO Wizard'));

  // ---------- run ----------

  maybeSendOn(); // before touch(), so it sees when the site was last open
  touch();
  updateButton();
  setInterval(() => { touch(); updateButton(); }, HEARTBEAT_MS);

  window.addEventListener('pagehide', () => {
    leave();
    if (location.hostname !== AUTO_OFF_HOST) return;
    if (GM_getValue('state', 'off') !== 'on' || liveOtherTabs().length) return;
    beacon(`🔴 **off** — ${who()} closed GTO Wizard (${stamp()})`);
    GM_setValue('state', 'off');
  });

  // Coming back via the browser's back/forward cache doesn't re-run the script.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    maybeSendOn();
    touch();
    updateButton();
  });
})();
