const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');
const { createServer } = require('../scripts/serve.cjs');
let browser, server, base;
const failures = [];

before(async () => {
  server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({
    ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
    args: ['--no-sandbox']
  });
});
after(async () => {
  await browser?.close();
  await new Promise(resolve => server?.close(resolve));
  assert.deepEqual(failures, [], 'No uncaught browser errors');
});
async function fresh(t, viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport, locale: 'fr-FR' });
  t.after(() => context.close());
  const page = await context.newPage();
  page.on('pageerror', error => failures.push(error.message));
  await page.goto(base);
  return page;
}
async function navigate(page, route) {
  await page.evaluate(hash => { location.hash = hash; }, route);
  await page.waitForFunction(hash => document.querySelector('[aria-current="page"]')?.getAttribute('href') === '#' + hash, route);
}
async function machineForm(page, code = 'MCH-TEST-01', name = 'Machine de test') {
  await page.getByRole('button', { name: 'Ajouter une machine', exact: true }).click();
  await page.locator('#field-code').fill(code);
  await page.locator('#field-name').fill(name);
  await page.locator('#field-address').fill('mqtt://10.0.0.1:1883');
}
async function stored(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('momsoft.factory.v2')));
}

test('Search, workshop/protocol/connection filters, sorting and pagination', async t => {
  const page = await fresh(t);
  assert.equal(await page.locator('tbody tr').count(), 6);
  await page.locator('#search').fill('melangeur');
  assert.equal(await page.locator('tbody tr').count(), 1);
  assert.match(await page.locator('tbody').innerText(), /GEA/);
  await page.locator('#search').fill('');
  await page.locator('#filter-workshop').selectOption('Atelier conditionnement');
  assert.equal(await page.locator('tbody tr').count(), 3);
  await page.getByRole('button', { name: 'Filtres', exact: true }).click();
  await page.locator('#filter-protocol').selectOption('OPC UA');
  assert.equal(await page.locator('tbody tr').count(), 1);
  await page.locator('#filter-status').selectOption('disconnected');
  assert.match(await page.locator('tbody').innerText(), /Uhlmann/);
  await page.locator('[data-action=reset-filters]').click();
  await page.locator('#page-size').selectOption('5');
  assert.equal(await page.locator('tbody tr').count(), 5);
  await page.getByRole('button', { name: 'Page suivante' }).click();
  assert.equal(await page.locator('tbody tr').count(), 1);
  await page.getByRole('button', { name: 'Page précédente' }).click();
  await page.locator('th [data-key=name]').click();
  const first = await page.locator('tbody tr').first().innerText();
  assert.match(first, /Balance/);
  await page.locator('#search').fill('no-such-machine');
  assert.equal(await page.locator('tbody tr').count(), 0);
  assert.match(await page.locator('.empty-state').innerText(), /Aucun résultat/);
});

test('Machine creation, duplicate/address validation, editing, persistence and safe rendering', async t => {
  const page = await fresh(t);
  await machineForm(page, 'MCH-FET-2090-01');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  assert.match(await page.locator('#form-error').innerText(), /existe déjà/);
  await page.locator('#field-code').fill('MCH-TEST-01');
  await page.locator('#field-address').fill('https://invalid.example');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  assert.match(await page.locator('#form-error').innerText(), /Adresse invalide/);
  await page.locator('#field-address').fill('mqtt://10.0.0.1:1883');
  await page.locator('#field-name').fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  assert.equal((await stored(page)).machines.length, 7);
  assert.equal(await page.locator('tbody img').count(), 0);
  await page.reload();
  assert.match(await page.locator('tbody').innerText(), /<img src=x onerror=alert\(1\)>/);
  const row = page.locator('tbody tr').filter({ hasText: 'MCH-TEST-01' });
  await row.locator('[data-action=edit]').click();
  await page.locator('#field-name').fill('Machine mise à jour');
  await page.locator('#field-protocol').selectOption('Modbus TCP');
  await page.locator('#field-address').fill('10.0.0.1:502');
  await page.locator('[name=connected]').check();
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  assert.match(await row.innerText(), /Machine mise à jour/);
  assert.equal((await stored(page)).machines.at(-1).connected, true);
});

test('Criteria validation, changed thresholds, inactive evaluation and rule configuration', async t => {
  const page = await fresh(t);
  await navigate(page, 'criteres');
  const oven = page.locator('tbody tr').filter({ hasText: 'Température four' });
  await oven.locator('[data-action=edit]').click();
  await page.locator('#field-min').fill('190');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  assert.match(await page.locator('#form-error').innerText(), /minimum/);
  await page.locator('#field-min').fill('175');
  await page.locator('#field-max').fill('190');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await navigate(page, 'visualisation');
  await page.locator('#filter-status').selectOption('err');
  assert.equal(await page.locator('tbody tr').count(), 0, '187.2 is within the new 190 upper bound');
  await navigate(page, 'criteres');
  await oven.locator('[data-action=edit]').click();
  await page.locator('[name=active]').uncheck();
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await navigate(page, 'visualisation');
  await page.locator('#filter-status').selectOption('off');
  assert.equal(await page.locator('tbody tr').count(), 9, 'Eight oven samples and inactive cadence');
  await navigate(page, 'notifications');
  await page.getByRole('button', { name: 'Ajouter une règle', exact: true }).click();
  await page.locator('#field-channel').selectOption('sms');
  await page.locator('#field-recipient').fill('not-a-phone');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  assert.match(await page.locator('#form-error').innerText(), /téléphone/);
  await page.locator('#field-recipient').fill('+216 22 123 456');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  assert.equal((await stored(page)).rules.length, 6);
});

test('Cascade deletion is confirmed and clears dependent records only', async t => {
  const page = await fresh(t);
  const row = page.locator('tbody tr').filter({ hasText: 'MCH-FET-2090-01' });
  await row.locator('[data-action=delete]').click();
  assert.match(await page.locator('dialog').innerText(), /2 critères/);
  await page.getByRole('button', { name: 'Annuler', exact: true }).click();
  assert.equal(await page.locator('tbody tr').count(), 6);
  await row.locator('[data-action=delete]').click();
  await page.locator('[data-action=confirm-delete]').click();
  const state = await stored(page);
  assert.equal(state.machines.length, 5);
  assert.equal(state.criteria.length, 6);
  assert.equal(state.measurements.length, 6);
  assert.equal(state.rules.length, 4);
  assert.equal(state.notifications.length, 4);
  await navigate(page, 'visualisation');
  assert.equal(await page.locator('tbody tr').count(), 6);
  await page.reload();
  assert.equal(await page.locator('tbody tr').count(), 6);
});

test('Historical chart, keyboard tooltip, date/status filters and measurement details', async t => {
  const page = await fresh(t);
  await navigate(page, 'visualisation');
  assert.equal(await page.locator('.chart-point').count(), 8);
  const point = page.locator('.chart-point').nth(4);
  await point.focus();
  await point.press('Enter');
  assert.match(await page.locator('#chart-tooltip').innerText(), /187,2 °C.*Hors tolérance/);
  await page.locator('#chart-parameter').selectOption('c4');
  assert.equal(await page.locator('.chart-point').count(), 1);
  assert.match(await page.locator('.chart-current').innerText(), /4,1/);
  await page.locator('#filter-status').selectOption('err');
  assert.equal(await page.locator('tbody tr').count(), 1);
  await page.locator('[data-action=view-measurement]').click();
  assert.match(await page.locator('dialog').innerText(), /187,2/);
  await page.locator('[data-action=show-trend]').click();
  assert.equal(await page.locator('.chart-point').count(), 8);
  await page.locator('#filter-date').fill('2026-03-05');
  assert.equal(await page.locator('tbody tr').count(), 0);
  assert.match(await page.locator('#content').innerText(), /Aucune mesure à visualiser/);
});

test('Notification reads persist and synchronize between tabs', async t => {
  const page = await fresh(t);
  await page.locator('.notification-button').click();
  await page.waitForURL('**/#notifications');
  assert.equal(await page.locator('[data-action=read]').count(), 3);
  await page.locator('[data-action=read]').first().click();
  assert.equal(await page.locator('#unread-count').innerText(), '2');
  await page.reload();
  assert.equal(await page.locator('#unread-count').innerText(), '2');
  const second = await page.context().newPage();
  await second.goto(base + '/#notifications');
  await second.locator('[data-action=read-all]').click();
  await page.waitForFunction(() => document.querySelector('#unread-count').hidden);
  assert.equal(await page.locator('[data-action=read]').count(), 0);
  assert.equal(await page.locator('#bell-dot').isHidden(), true);
});

test('CSV exports all filtered rows beyond the current page and neutralizes formulas', async t => {
  const page = await fresh(t);
  await machineForm(page, 'MCH-TEST-01', '=2+2');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await page.locator('#page-size').selectOption('5');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-action=export]').click();
  const download = await downloadPromise;
  const csv = await fs.readFile(await download.path(), 'utf8');
  assert.equal(csv.split('\r\n').length, 8, 'Header plus all seven rows');
  assert.ok(csv.includes('"\'=2+2"'), 'Formula is prefixed with an apostrophe');
  await page.locator('#filter-workshop').selectOption('Atelier conditionnement');
  const filteredPromise = page.waitForEvent('download');
  await page.locator('[data-action=export]').click();
  const filtered = await fs.readFile(await (await filteredPromise).path(), 'utf8');
  assert.equal(filtered.split('\r\n').length, 4);
});

test('Mobile layout, navigation focus, all four views and dialogs fit narrow screens', async t => {
  const page = await fresh(t, { width: 390, height: 844 });
  assert.equal(await page.locator('#sidebar').evaluate(el => el.inert), true);
  for (const route of ['machines', 'criteres', 'visualisation', 'notifications']) {
    await page.locator('#mobile-menu').click();
    assert.equal(await page.locator('#mobile-menu').getAttribute('aria-expanded'), 'true');
    await page.locator('[data-page=' + route + ']').click();
    if (route === 'machines') await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.body.classList.contains('sidebar-open'));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, route + ' must not overflow');
  }
  await page.locator('#mobile-menu').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#mobile-menu').evaluate(el => el === document.activeElement), true);
  await page.locator('[data-action=add]').click();
  assert.equal(await page.locator('dialog').isVisible(), true);
  assert.equal(await page.locator('dialog').evaluate(el => el.scrollWidth <= el.clientWidth), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog').isVisible(), false);
});

test('Blocked/corrupt storage remains usable and reports unsaved changes', async t => {
  const page = await fresh(t);
  await page.evaluate(() => localStorage.setItem('momsoft.factory.v2', '{broken'));
  await page.reload();
  assert.equal(await page.locator('tbody tr').count(), 6);
  assert.match(await page.locator('#toast-region').innerText(), /illisibles/);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage blocked'); }; });
  await machineForm(page);
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  assert.equal(await page.locator('tbody tr').count(), 7);
  assert.match(await page.locator('#toast-region').innerText(), /bloque la sauvegarde/);
  assert.match(await page.locator('.page-footer').innerText(), /indisponible/);
});

test('New criteria and rules can be edited/deleted, and demo reset restores the original dataset', async t => {
  const page = await fresh(t);
  await navigate(page, 'criteres');
  await page.locator('[data-action=add]').click();
  await page.locator('#field-parameter').fill('Pression de test');
  await page.locator('#field-unit').fill('bar');
  await page.locator('#field-min').fill('1');
  await page.locator('#field-max').fill('5');
  await page.locator('#field-target').fill('3');
  await page.locator('#field-tolerance').fill('± 0,2');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  assert.equal((await stored(page)).criteria.length, 9);
  const id = (await stored(page)).criteria.at(-1).id;
  await navigate(page, 'notifications');
  await page.locator('[data-action=add]').click();
  await page.locator('#field-criterionId').selectOption(id);
  await page.locator('#field-channel').selectOption('application');
  await page.locator('#field-recipient').fill('Équipe test');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  const row = page.locator('tbody tr').filter({ hasText: 'Équipe test' });
  await row.locator('[data-action=edit]').click();
  await page.locator('[name=active]').uncheck();
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  assert.match(await row.innerText(), /Inactive/);
  await row.locator('[data-action=delete]').click();
  await page.locator('[data-action=confirm-delete]').click();
  assert.equal((await stored(page)).rules.length, 5);
  await navigate(page, 'criteres');
  await page.locator('tbody tr').filter({ hasText: 'Pression de test' }).locator('[data-action=delete]').click();
  await page.locator('[data-action=confirm-delete]').click();
  assert.equal((await stored(page)).criteria.length, 8);
  await page.locator('[data-action=help]').first().click();
  await page.locator('[data-action=reset-demo]').click();
  await page.locator('[data-action=confirm-reset]').click();
  assert.deepEqual(await stored(page), await page.evaluate(() => window.MOMSOFT_SEED));
});
