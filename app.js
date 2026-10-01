/* Vanilla JavaScript, intentionally dependency-free. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const STORAGE_KEY = 'momsoft.factory.v2';
  const icons = {
    factory: '<path d="M3 21V9l6 3V7l6 4V3h4l2 18Z"/><path d="M7 17h1m4 0h1m4 0h1"/>',
    machine: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 5V3m8 2V3M8 10h8M8 14h4M8 20v2m8-2v2"/><circle cx="16" cy="15" r="1"/>',
    waves: '<path d="M3 7c3-4 6 4 9 0s6 4 9 0M3 12c3-4 6 4 9 0s6 4 9 0M3 17c3-4 6 4 9 0s6 4 9 0"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
    sliders: '<path d="M4 6h4m4 0h8M4 12h10m4 0h2M4 18h2m4 0h10"/><circle cx="10" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
    chart: '<path d="M4 3v17h17M7 14l4-5 4 3 5-7"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    file: '<path d="M14 3H5v18h14V8Z"/><path d="M14 3v5h5M8 12h8m-8 4h6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h2m4 0h2m-8 4h2"/>',
    layers: '<path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01"/>',
    panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m6-12-3 4 3 4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    filter: '<path d="M4 5h16l-6 7v6l-4 2v-8Z"/>',
    arrow: '<path d="M4 12h16m-5-5 5 5-5 5"/>',
    left: '<path d="m14 6-6 6 6 6"/>',
    right: '<path d="m10 6 6 6-6 6"/>',
    sort: '<path d="m8 9 4-4 4 4m-8 6 4 4 4-4"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="m15 4 5 5-11 11H4v-5Z"/><path d="m12 7 5 5"/>',
    trash: '<path d="M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    alert: '<path d="m12 3 10 18H2ZM12 9v5m0 3h.01"/>',
    connection: '<path d="m8 8 3-3a5 5 0 0 1 7 7l-3 3M9 9l-3 3a5 5 0 0 0 7 7l3-3m-7-1 6-6"/>',
    disconnect: '<path d="m3 3 18 18M8 8l3-3a5 5 0 0 1 8 6M6 13a5 5 0 0 0 7 7l3-3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    app: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
  };
  const icon = name => '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + (icons[name] || icons.machine) + '</svg>';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const number = n => n === null || n === undefined ? '—' : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(n);
  const dateText = value => new Date(value).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const normalize = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const uid = () => globalThis.crypto?.randomUUID?.() || 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  const cloneSeed = () => JSON.parse(JSON.stringify(window.MOMSOFT_SEED));
  let storageAvailable = true;
  let storageWarning = '';
  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneSeed();
      const saved = JSON.parse(raw);
      if (!validState(saved)) throw new Error('Invalid local data');
      return saved;
    } catch {
      storageWarning = 'Les données locales sont illisibles ou indisponibles. Les exemples ont été chargés.';
      return cloneSeed();
    }
  }
  function validState(s) {
    if (s?.version !== 1 || !['machines', 'criteria', 'measurements', 'rules', 'notifications'].every(k => Array.isArray(s[k]))) return false;
    if (!['machines', 'criteria', 'measurements', 'rules', 'notifications'].every(k => s[k].every(r => typeof r.id === 'string') && new Set(s[k].map(r => r.id)).size === s[k].length)) return false;
    const text = v => typeof v === 'string';
    const numeric = v => typeof v === 'number' && Number.isFinite(v);
    const optional = v => v === null || numeric(v);
    return s.machines.every(m => [m.code, m.name, m.workshop, m.address, m.access].every(text) && ['MQTT', 'OPC UA', 'Modbus TCP'].includes(m.protocol) && numeric(m.frequency) && m.frequency > 0 && typeof m.connected === 'boolean')
      && s.criteria.every(c => s.machines.some(m => m.id === c.machineId) && [c.parameter, c.unit, c.tolerance].every(text) && [c.min, c.target, c.max].every(optional) && typeof c.active === 'boolean')
      && s.measurements.every(v => s.criteria.some(c => c.id === v.criterionId) && numeric(v.value) && text(v.date) && Number.isFinite(Date.parse(v.date)))
      && s.rules.every(r => s.criteria.some(c => c.id === r.criterionId) && ['warn', 'err'].includes(r.condition) && ['email', 'sms', 'application'].includes(r.channel) && text(r.recipient) && typeof r.active === 'boolean')
      && s.notifications.every(n => s.machines.some(m => m.id === n.machineId) && [n.date, n.message].every(text) && Number.isFinite(Date.parse(n.date)) && ['email', 'sms', 'application'].includes(n.channel) && typeof n.read === 'boolean');
  }
  let state = readState();
  const pages = {
    machines: { label: 'Machines', title: 'Paramétrage des machines', subtitle: 'Vos équipements, leurs connexions et protocoles. Tout commence ici.', add: 'Ajouter une machine', kind: 'machines', index: '01' },
    criteres: { label: 'Critères de contrôle', title: 'Critères de contrôle', subtitle: 'Définissez les seuils qui garantissent une production maîtrisée.', add: 'Ajouter un critère', kind: 'criteria', index: '02' },
    visualisation: { label: 'Visualisation', title: 'Visualisation des données', subtitle: 'Lisez les tendances. Repérez les écarts. Gardez une longueur d’avance.', index: '03' },
    notifications: { label: 'Notifications', title: 'Notifications & alertes', subtitle: 'Les bonnes informations, aux bonnes personnes, au bon moment.', add: 'Ajouter une règle', kind: 'rules', index: '04' }
  };
  let page = 'machines';
  const filters = Object.fromEntries(Object.keys(pages).map(p => [p, { query: '', workshop: '', status: '', protocol: '', date: p === 'visualisation' ? '2026-03-04' : '', index: 1, size: 10, sort: '', direction: 1, expanded: false }]));
  let chartCriterion = 'c1';
  let toastTimer;
  let dialogReturnFocus = null;
  const machine = id => state.machines.find(m => m.id === id);
  const criterion = id => state.criteria.find(c => c.id === id);
  const unread = () => state.notifications.filter(n => !n.read).length;
  const workshops = () => [...new Set(state.machines.map(m => m.workshop))].sort((a, b) => a.localeCompare(b, 'fr'));
  const protocols = ['MQTT', 'OPC UA', 'Modbus TCP'];
  const channelName = { email: 'Email', sms: 'SMS', application: 'Application' };
  const statusName = { ok: 'Conforme', warn: 'Alerte', err: 'Hors tolérance', off: 'Non évaluée' };
  const badge = (label, type) => '<span class="badge ' + type + '">' + esc(label) + '</span>';
  function measurementStatus(v) {
    const c = criterion(v.criterionId);
    if (!c?.active) return 'off';
    if ((c.min !== null && v.value < c.min) || (c.max !== null && v.value > c.max)) return 'err';
    const parsed = Number(c.tolerance.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    const tolerance = c.tolerance.includes('%') ? Math.abs(c.target ?? v.value) * parsed / 100 : parsed;
    const span = c.min !== null && c.max !== null ? c.max - c.min : Math.abs(c.max ?? c.min ?? v.value);
    // The amber zone starts one tolerance (or 10% of the range) inside a bound.
    const margin = Math.min(Math.max(tolerance, span * .1), span > 0 ? span / 2 : tolerance);
    return ((c.max !== null && v.value >= c.max - margin) || (c.min !== null && v.value <= c.min + margin)) ? 'warn' : 'ok';
  }
  function toast(message, error = false) {
    clearTimeout(toastTimer);
    $('#toast-region').innerHTML = '<div class="toast' + (error ? ' error' : '') + '">' + icon(error ? 'alert' : 'check') + '<span>' + esc(message) + '</span></div>';
    toastTimer = setTimeout(() => { $('#toast-region').innerHTML = ''; }, error ? 9000 : 4500);
  }
  function persist(message) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageAvailable = true;
      toast(message);
    } catch {
      storageAvailable = false;
      toast('Modification appliquée pour cette session. Le navigateur bloque la sauvegarde locale.', true);
    }
    render();
  }
  function options(values, selected, placeholder) {
    return (placeholder ? '<option value="">' + esc(placeholder) + '</option>' : '') + values.map(value => {
      const [id, label] = Array.isArray(value) ? value : [value, value];
      return '<option value="' + esc(id) + '"' + (id === selected ? ' selected' : '') + '>' + esc(label) + '</option>';
    }).join('');
  }
  function selectFilter(key, label, values) {
    return '<select class="select" id="filter-' + key + '" data-filter="' + key + '" aria-label="' + esc(label) + '">' + options(values, filters[page][key], label) + '</select>';
  }
  function toolbar() {
    const f = filters[page];
    const search = '<label class="search">' + icon('search') + '<input id="search" type="search" autocomplete="off" aria-label="Rechercher dans cette liste" placeholder="' + (page === 'machines' ? 'Rechercher une machine, un code…' : 'Rechercher un paramètre, une machine…') + '" value="' + esc(f.query) + '"><kbd class="shortcut">/</kbd></label>';
    let extra = selectFilter('workshop', 'Tous les ateliers', workshops());
    if (page === 'machines') extra += '<span class="toolbar-spacer"></span><button class="button' + (f.expanded || f.status || f.protocol ? ' active-filter' : '') + '" data-action="filters" aria-expanded="' + f.expanded + '" aria-controls="extra-filters">' + icon('filter') + 'Filtres' + ((f.status || f.protocol) ? '<span class="count-label">' + (Number(!!f.status) + Number(!!f.protocol)) + '</span>' : '') + '</button>';
    if (page === 'criteres') extra += selectFilter('status', 'Tous les statuts', [['active', 'Actifs'], ['inactive', 'Inactifs']]);
    if (page === 'visualisation') extra += '<input class="select" id="filter-date" type="date" data-filter="date" aria-label="Date des mesures" value="' + esc(f.date) + '">' + selectFilter('status', 'Tous les statuts', Object.entries(statusName));
    if (page === 'notifications') extra += selectFilter('status', 'Toutes les règles', [['active', 'Actives'], ['inactive', 'Inactives']]);
    return '<div class="toolbar">' + search + extra + '</div>' + (page === 'machines' ? '<div class="filter-row" id="extra-filters"' + (f.expanded ? '' : ' hidden') + '><label>Connexion ' + selectFilter('status', 'Toutes les connexions', [['connected', 'Connectées'], ['disconnected', 'Déconnectées']]) + '</label><label>Protocole ' + selectFilter('protocol', 'Tous les protocoles', protocols) + '</label><button class="text-button" data-action="reset-filters">Réinitialiser</button></div>' : '');
  }
  function filteredRows() {
    const f = filters[page];
    let rows = page === 'machines' ? state.machines : page === 'criteres' ? state.criteria : page === 'notifications' ? state.rules : state.measurements;
    rows = rows.filter(r => {
      const c = page === 'machines' ? null : page === 'criteres' ? r : criterion(r.criterionId);
      const m = page === 'machines' ? r : machine(c?.machineId);
      if (f.workshop && m?.workshop !== f.workshop) return false;
      const text = [m?.name, m?.code, m?.workshop, m?.protocol, m?.address, c?.parameter, c?.unit, r.recipient, r.channel].join(' ');
      if (f.query && !normalize(text).includes(normalize(f.query))) return false;
      if (page === 'machines') return (!f.protocol || r.protocol === f.protocol) && (!f.status || r.connected === (f.status === 'connected'));
      if (page === 'visualisation') return (!f.date || r.date.startsWith(f.date)) && (!f.status || measurementStatus(r) === f.status);
      return !f.status || r.active === (f.status === 'active');
    });
    return rows.slice().sort((a, b) => {
      if (page === 'visualisation') return b.date.localeCompare(a.date);
      if (!f.sort) return 0;
      return String(a[f.sort]).localeCompare(String(b[f.sort]), 'fr', { numeric: true }) * f.direction;
    });
  }
  function metric(label, value, note, glyph, color = '') {
    return '<div class="metric"><p class="metric-label">' + icon(glyph) + esc(label) + '</p><strong class="metric-value">' + number(value) + '</strong><p class="metric-note ' + color + '">' + esc(note) + '</p></div>';
  }
  function metrics() {
    const active = state.criteria.filter(c => c.active);
    if (page === 'machines') {
      const connected = state.machines.filter(m => m.connected).length;
      return metric('Machines paramétrées', state.machines.length, workshops().length + ' ateliers de production', 'machine')
        + metric('Connectées', connected, 'Statuts de démonstration', 'connection', 'good')
        + metric('Déconnectées', state.machines.length - connected, 'Équipements à vérifier', 'disconnect', state.machines.length - connected ? 'warning' : '')
        + metric('Protocoles utilisés', new Set(state.machines.map(m => m.protocol)).size, 'MQTT · OPC UA · Modbus', 'layers');
    }
    if (page === 'criteres') return metric('Paramètres surveillés', state.criteria.length, 'Configurés dans cet espace', 'sliders') + metric('Critères actifs', active.length, 'Contrôles activés', 'shield', 'good') + metric('Critères inactifs', state.criteria.length - active.length, 'Contrôles en pause', 'panel') + metric('Machines couvertes', new Set(state.criteria.map(c => c.machineId)).size, 'Au moins un critère', 'machine');
    if (page === 'notifications') return metric('Règles actives', state.rules.filter(r => r.active).length, 'Sur ' + state.rules.length + ' règles configurées', 'bell', 'good') + metric('Notifications', state.notifications.length, 'Historique de démonstration', 'layers') + metric('Non lues', unread(), 'Dans votre historique', 'mail', unread() ? 'warning' : 'good') + metric('Canaux configurés', new Set(state.rules.map(r => r.channel)).size, 'Email · SMS · Application', 'connection');
    const rows = filteredRows();
    return metric('Mesures conformes', rows.filter(v => measurementStatus(v) === 'ok').length, 'Dans la sélection', 'shield', 'good') + metric('En alerte', rows.filter(v => measurementStatus(v) === 'warn').length, 'Proches d’un seuil', 'alert', 'warning') + metric('Hors tolérance', rows.filter(v => measurementStatus(v) === 'err').length, 'Seuil dépassé', 'disconnect', 'warning') + metric('Mesures disponibles', rows.length, rows.filter(v => measurementStatus(v) === 'off').length + ' non évaluées · critères inactifs', 'chart');
  }
  function actionButton(action, id, label, glyph, kind) {
    return '<button class="icon-button ' + (action === 'delete' ? 'delete' : '') + '" data-action="' + action + '" data-id="' + esc(id) + '" data-kind="' + esc(kind) + '" aria-label="' + esc(label) + '" title="' + esc(label) + '">' + icon(glyph) + '</button>';
  }
  function rowActions(r, kind, canView = false) {
    return '<div class="actions">' + (canView ? actionButton('view-machine', r.id, 'Voir ' + r.name, 'eye', kind) : '') + actionButton('edit', r.id, 'Modifier ' + (r.name || r.parameter || 'la règle'), 'edit', kind) + actionButton('delete', r.id, 'Supprimer ' + (r.name || r.parameter || 'la règle'), 'trash', kind) + '</div>';
  }
  function heading(label, key) {
    const f = filters[page];
    return '<th scope="col"' + (key ? ' aria-sort="' + (f.sort === key ? f.direction === 1 ? 'ascending' : 'descending' : 'none') + '"' : '') + '>' + (key ? '<button data-action="sort" data-key="' + key + '">' + label + icon('sort') + '</button>' : label) + '</th>';
  }
  function tableHeaders() {
    if (page === 'machines') return heading('Machine', 'name') + heading('Atelier', 'workshop') + heading('Protocole', 'protocol') + heading('Point d’accès') + heading('Lecture', 'frequency') + heading('Connexion', 'connected') + heading('Actions');
    if (page === 'criteres') return ['Machine / Paramètre', 'Unité', 'Min.', 'Cible', 'Max.', 'Tolérance', 'Statut', 'Actions'].map(h => heading(h)).join('');
    if (page === 'notifications') return ['Machine / Paramètre', 'Déclenchement', 'Canal', 'Destinataire', 'Statut', 'Actions'].map(h => heading(h)).join('');
    return ['Machine / Paramètre', 'Valeur', 'Plage attendue', 'Horodatage', 'Statut', 'Détail'].map(h => heading(h)).join('');
  }
  const parameterCell = c => '<span class="cell-title">' + esc(c.parameter) + '</span><span class="cell-subtitle machine-code">' + esc(machine(c.machineId)?.code) + '</span>';
  const range = c => c.min !== null && c.max !== null ? number(c.min) + ' – ' + number(c.max) : c.max !== null ? '≤ ' + number(c.max) : c.min !== null ? '≥ ' + number(c.min) : '—';
  const channel = ch => '<span class="channel">' + icon({ email: 'mail', sms: 'phone', application: 'app' }[ch]) + channelName[ch] + '</span>';
  function rowHTML(r) {
    if (page === 'machines') return '<tr><td><div class="machine-cell"><span class="machine-glyph">' + icon('machine') + '</span><span><span class="cell-title">' + esc(r.name) + '</span><span class="cell-subtitle machine-code">' + esc(r.code) + '</span></span></div></td><td class="workshop">' + esc(r.workshop) + '</td><td><span class="protocol">' + esc(r.protocol) + '</span></td><td class="endpoint">' + esc(r.address) + '<span class="cell-subtitle" title="' + esc(r.access) + '">' + esc(r.access || '—') + '</span></td><td class="numeric">' + number(r.frequency) + '<span class="cell-subtitle">secondes</span></td><td>' + badge(r.connected ? 'Connectée' : 'Déconnectée', r.connected ? 'ok' : 'warn') + '</td><td>' + rowActions(r, 'machines', true) + '</td></tr>';
    if (page === 'criteres') return '<tr><td>' + parameterCell(r) + '</td><td>' + esc(r.unit) + '</td><td class="numeric">' + number(r.min) + '</td><td class="numeric target">' + number(r.target) + '</td><td class="numeric">' + number(r.max) + '</td><td>' + esc(r.tolerance || '—') + '</td><td>' + badge(r.active ? 'Actif' : 'Inactif', r.active ? 'ok' : 'off') + '</td><td>' + rowActions(r, 'criteria') + '</td></tr>';
    const c = criterion(r.criterionId);
    if (page === 'notifications') return '<tr><td>' + parameterCell(c) + '</td><td>' + badge(statusName[r.condition], r.condition) + '</td><td>' + channel(r.channel) + '</td><td>' + esc(r.recipient) + '</td><td>' + badge(r.active ? 'Active' : 'Inactive', r.active ? 'ok' : 'off') + '</td><td>' + rowActions(r, 'rules') + '</td></tr>';
    const status = measurementStatus(r);
    return '<tr><td>' + parameterCell(c) + '</td><td class="numeric target">' + number(r.value) + ' ' + esc(c.unit) + '</td><td>' + range(c) + ' ' + esc(c.unit) + '</td><td class="numeric">' + dateText(r.date) + '</td><td>' + badge(statusName[status], status) + '</td><td>' + actionButton('view-measurement', r.id, 'Voir la mesure de ' + c.parameter + ' du ' + dateText(r.date), 'eye', 'measurements') + '</td></tr>';
  }
  function empty(title = 'Aucun résultat', description = 'Essayez une autre recherche ou ajustez vos filtres.', reset = true) {
    return '<div class="empty-state">' + icon('search') + '<strong>' + esc(title) + '</strong><p>' + esc(description) + '</p>' + (reset ? '<button class="button small" data-action="reset-filters">Réinitialiser les filtres</button>' : '') + '</div>';
  }
  function paginatedTable(rows) {
    const f = filters[page];
    const count = Math.max(1, Math.ceil(rows.length / f.size));
    f.index = Math.min(f.index, count);
    const start = (f.index - 1) * f.size;
    return '<p class="table-hint">' + icon('arrow') + 'Faites défiler le tableau pour voir toutes les colonnes.</p><div class="table-wrap"><table aria-label="' + esc(pages[page].label) + '"><thead><tr>' + tableHeaders() + '</tr></thead><tbody>' + rows.slice(start, start + f.size).map(rowHTML).join('') + '</tbody></table></div>' + (!rows.length ? empty() : '') + '<div class="table-foot"><span>' + (rows.length ? start + 1 : 0) + '–' + Math.min(start + f.size, rows.length) + ' sur ' + rows.length + ' résultats</span><div class="pagination"><label for="page-size">Par page</label><select id="page-size" data-filter="size">' + options([5, 10, 25].map(n => [String(n), String(n)]), String(f.size)) + '</select><button class="icon-button" data-action="previous"' + (f.index === 1 ? ' disabled' : '') + ' aria-label="Page précédente">' + icon('left') + '</button><span>' + f.index + ' / ' + count + '</span><button class="icon-button" data-action="next"' + (f.index === count ? ' disabled' : '') + ' aria-label="Page suivante">' + icon('right') + '</button></div></div>';
  }
  function alertStrip() {
    if (page !== 'machines') return '';
    const offline = state.machines.filter(m => !m.connected);
    if (!offline.length) return '';
    return '<div class="alert-strip">' + icon('alert') + '<span><strong>' + offline.length + ' machine' + (offline.length > 1 ? 's' : '') + ' déconnectée' + (offline.length > 1 ? 's' : '') + '.</strong> ' + (offline.length === 1 ? esc(offline[0].name) + ' nécessite une vérification.' : 'Vérifiez les équipements et leur configuration.') + '</span><button class="text-button" data-action="show-offline">Voir les machines' + icon('arrow') + '</button></div>';
  }
  function chartHTML() {
    const available = filteredRows();
    const ids = [...new Set(available.map(v => v.criterionId))];
    if (!ids.length) return '<div class="card">' + empty('Aucune mesure à visualiser', 'Aucune donnée ne correspond à cette sélection.') + '</div>';
    if (!ids.includes(chartCriterion)) chartCriterion = ids[0];
    const c = criterion(chartCriterion);
    const values = available.filter(v => v.criterionId === chartCriterion).sort((a, b) => a.date.localeCompare(b.date));
    const last = values.at(-1);
    const points = values.map(v => v.value);
    const bounds = c.active ? [c.min, c.max].filter(n => n !== null) : [];
    const rawMin = Math.min(...points, ...bounds);
    const rawMax = Math.max(...points, ...bounds);
    const pad = Math.max((rawMax - rawMin) * .25, Math.abs(rawMax) * .02, .02);
    const lo = rawMin - pad, hi = rawMax + pad;
    const x = i => values.length === 1 ? 320 : 48 + i * 568 / (values.length - 1);
    const y = v => 185 - (v - lo) / (hi - lo) * 155;
    const polyline = values.map((v, i) => x(i) + ',' + y(v.value)).join(' ');
    const statusColor = { ok: '#5d8f99', warn: '#c19654', err: '#c56363', off: '#a1adb6' };
    let svg = '<svg class="chart-svg" viewBox="0 0 650 220" role="group" aria-label="' + esc(c.parameter + ' : ' + values.length + ' mesures, de ' + number(rawMin) + ' à ' + number(rawMax) + ' ' + c.unit) + '"><title>' + esc(c.parameter) + '</title>';
    for (let i = 0; i < 5; i++) {
      const value = lo + (hi - lo) * i / 4, yy = y(value);
      svg += '<line class="chart-grid" x1="48" x2="616" y1="' + yy + '" y2="' + yy + '"/><text class="chart-tick" x="36" y="' + (yy + 3) + '" text-anchor="end">' + number(Number(value.toPrecision(3))) + '</text>';
    }
    if (c.active) {
      if (c.min !== null && c.max !== null) svg += '<rect x="48" y="' + y(c.max) + '" width="568" height="' + (y(c.min) - y(c.max)) + '" fill="#edf5f3" opacity=".65"/>';
      bounds.forEach(bound => { svg += '<line x1="48" x2="616" y1="' + y(bound) + '" y2="' + y(bound) + '" stroke="#b8a688" stroke-dasharray="4 5" stroke-width="1"/>'; });
    }
    if (values.length > 1) svg += '<polygon points="48,185 ' + polyline + ' 616,185" fill="#678b9d" opacity=".045"/><polyline points="' + polyline + '" fill="none" stroke="#648ba0" stroke-width="2" stroke-linejoin="round"/>';
    values.forEach((v, i) => {
      const label = dateText(v.date) + ' · ' + number(v.value) + ' ' + c.unit + ' · ' + statusName[measurementStatus(v)];
      svg += '<g class="chart-point" tabindex="0" role="button" data-action="chart-point" data-id="' + esc(v.id) + '" aria-label="' + esc(label) + '"><title>' + esc(label) + '</title><circle cx="' + x(i) + '" cy="' + y(v.value) + '" r="3.5" fill="' + statusColor[measurementStatus(v)] + '"/></g>';
      if (i === 0 || i === values.length - 1 || values.length <= 8 || i % Math.ceil(values.length / 8) === 0) svg += '<text class="chart-tick" x="' + x(i) + '" y="210" text-anchor="middle">' + esc(v.date.slice(11)) + '</text>';
    });
    svg += '</svg>';
    const parameterOptions = ids.map(id => [id, criterion(id).parameter + ' · ' + machine(criterion(id).machineId).code]);
    return '<section class="card chart-card" aria-label="Tendance du paramètre"><div class="card-heading"><div><h2>Tendance du paramètre</h2><p>' + esc(machine(c.machineId).name) + ' · ' + values.length + ' mesures disponibles</p></div><select class="select chart-select" id="chart-parameter" aria-label="Paramètre du graphique">' + options(parameterOptions, chartCriterion) + '</select></div><div class="chart-layout"><div class="chart-main">' + svg + '<div class="chart-legend"><span><i class="legend-line"></i>Mesures (' + esc(c.unit) + ')</span>' + (c.active ? '<span><i class="legend-line dashed"></i>Seuils de contrôle</span>' : '<span>Critère inactif</span>') + '</div><div class="chart-tooltip" id="chart-tooltip">Survolez un point ou sélectionnez-le pour consulter la mesure.</div></div><aside class="chart-side"><p class="overline">Dernière mesure sélectionnée</p><p class="chart-current">' + number(last.value) + ' <small>' + esc(c.unit) + '</small></p>' + badge(statusName[measurementStatus(last)], measurementStatus(last)) + '<dl><div><dt>Valeur cible</dt><dd>' + number(c.target) + ' ' + esc(c.unit) + '</dd></div><div><dt>Seuil minimum</dt><dd>' + number(c.min) + '</dd></div><div><dt>Seuil maximum</dt><dd>' + number(c.max) + '</dd></div><div><dt>Dernier relevé</dt><dd>' + esc(last.date.slice(11)) + '</dd></div></dl></aside></div></section>';
  }
  function notificationHistory() {
    const rows = state.notifications.slice().sort((a, b) => b.date.localeCompare(a.date));
    return '<section class="card"><div class="card-heading"><div><h2>Historique des notifications <span class="count-label">' + rows.length + '</span></h2><p>Messages d’exemple du 4 mars 2026</p></div><button class="button small" data-action="read-all"' + (!unread() ? ' disabled' : '') + '>' + icon('check') + 'Tout marquer comme lu</button></div><div class="table-wrap"><table aria-label="Historique des notifications"><thead><tr>' + ['Horodatage', 'Machine', 'Message', 'Canal', 'Lecture'].map(h => heading(h)).join('') + '</tr></thead><tbody>' + rows.map(n => '<tr' + (!n.read ? ' class="unread-row"' : '') + '><td class="numeric">' + dateText(n.date) + '</td><td class="machine-code">' + esc(machine(n.machineId)?.code) + '</td><td class="notification-message">' + esc(n.message) + '</td><td>' + channel(n.channel) + '</td><td>' + (n.read ? badge('Lue', 'off') : '<button class="button small" data-action="read" data-id="' + esc(n.id) + '" aria-label="Marquer la notification du ' + dateText(n.date) + ' comme lue">' + icon('check') + 'Marquer lue</button>') + '</td></tr>').join('') + '</tbody></table></div>' + (!rows.length ? empty('Aucune notification', 'Votre historique est vide.', false) : '') + '</section>';
  }
  function render() {
    const focused = document.activeElement;
    const focusId = focused?.id;
    const selection = focused?.type === 'search' ? [focused.selectionStart, focused.selectionEnd] : null;
    const config = pages[page];
    const rows = filteredRows();
    $('#current-section').textContent = config.label;
    document.title = config.label + ' · MOMSOFT Smart Factory';
    document.querySelectorAll('[data-page]').forEach(a => {
      a.classList.toggle('active', a.dataset.page === page);
      a.setAttribute('aria-label', a.textContent.trim());
      if (a.dataset.page === page) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    $('#machine-count').textContent = state.machines.length;
    $('#unread-count').textContent = unread();
    $('#unread-count').hidden = !unread();
    $('#bell-dot').hidden = !unread();
    $('.notification-button').setAttribute('aria-label', 'Notifications : ' + unread() + ' non lues');
    $('.page-footer span:last-child').innerHTML = 'Site de Sfax <span class="footer-dot">·</span> ' + (storageAvailable ? 'Enregistrement local' : 'Sauvegarde indisponible');
    const titles = { machines: ['Parc machines', 'Configuration des équipements et des points d’accès'], criteres: ['Critères configurés', 'Seuils et tolérances par paramètre machine'], notifications: ['Règles de notification', 'Configurez les conditions, canaux et destinataires'], visualisation: ['Historique des mesures', 'Données archivées · statuts évalués avec les critères actuels'] };
    $('#content').innerHTML = '<div class="page-head"><div><p class="eyebrow">ESPACE DE PRODUCTION <span>/ ' + config.index + '</span></p><h1>' + config.title + '</h1><p class="subtitle">' + config.subtitle + '</p></div><div class="head-actions"><button class="button" data-action="export" aria-label="Exporter la liste filtrée en CSV">' + icon('download') + '<span class="export-label">Exporter</span></button>' + (config.add ? '<button class="button primary" data-action="add" data-kind="' + config.kind + '">' + icon('plus') + config.add + '</button>' : '') + '</div></div><div class="metrics" aria-label="Indicateurs de ' + esc(config.label) + '">' + metrics() + '</div>' + alertStrip() + (page === 'visualisation' ? '<section class="card"><div class="card-heading"><h2>Explorer les mesures</h2><button class="text-button" data-action="reset-filters">Réinitialiser</button></div>' + toolbar() + '</section>' + chartHTML() : '') + '<section class="card"><div class="card-heading"><div><h2>' + titles[page][0] + ' <span class="count-label">' + rows.length + '</span></h2><p>' + titles[page][1] + '</p></div>' + (page === 'machines' ? '<span class="channel">' + icon('factory') + 'Sfax</span>' : '') + '</div>' + (page !== 'visualisation' ? toolbar() : '') + paginatedTable(rows) + '</section>' + (page === 'notifications' ? notificationHistory() : '');
    if (focusId && $('#' + focusId, $('#content'))) {
      const next = $('#' + focusId);
      next.focus({ preventScroll: true });
      if (selection) next.setSelectionRange(...selection);
    }
  }
  function closeMenu() {
    document.body.classList.remove('sidebar-open');
    $('#sidebar-backdrop').hidden = true;
    $('#mobile-menu').setAttribute('aria-expanded', 'false');
    $('.main-shell').inert = false;
    syncSidebar();
  }
  function syncSidebar() {
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    $('.sidebar').inert = mobile && !document.body.classList.contains('sidebar-open');
    if (!mobile) {
      document.body.classList.remove('sidebar-open');
      $('#sidebar-backdrop').hidden = true;
      $('#mobile-menu').setAttribute('aria-expanded', 'false');
      $('.main-shell').inert = false;
    }
  }
  function route() {
    const next = location.hash.slice(1);
    if (next === 'content' && $('#content').children.length) { $('#content').focus(); return; }
    page = pages[next] ? next : 'machines';
    closeMenu();
    render();
    $('#content').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  function showDialog(title, description, body, footer, form = false) {
    const d = $('#editor-dialog');
    dialogReturnFocus = document.activeElement;
    $('#dialog-content').innerHTML = (form ? '<form id="editor-form">' : '') + '<div class="dialog-head"><div><h2 id="dialog-title">' + esc(title) + '</h2><p>' + esc(description) + '</p></div><button type="button" class="icon-button" data-action="close-dialog" aria-label="Fermer">' + icon('close') + '</button></div><div class="dialog-body">' + body + (form ? '<p class="form-error" id="form-error" role="alert" hidden></p>' : '') + '</div><div class="dialog-foot">' + footer + '</div>' + (form ? '</form>' : '');
    if (!d.open) d.showModal();
    const first = $('input:not([type=checkbox]), select', d);
    if (first) first.focus();
  }
  const cancelButton = () => '<button class="button" type="button" data-action="close-dialog">Annuler</button>';
  const closeButton = () => '<button class="button" type="button" data-action="close-dialog">Fermer</button>';
  function field(name, label, value, type = 'text', extra = '', full = false) {
    return '<label class="field' + (full ? ' full' : '') + '" for="field-' + name + '">' + esc(label) + '<input id="field-' + name + '" name="' + name + '" type="' + type + '" value="' + esc(value) + '" ' + extra + '></label>';
  }
  function selectField(name, label, values, value, full = false) {
    return '<label class="field' + (full ? ' full' : '') + '" for="field-' + name + '">' + esc(label) + '<select name="' + name + '" id="field-' + name + '" required>' + options(values, value) + '</select></label>';
  }
  function openEditor(kind, id) {
    const existing = state[kind].find(r => r.id === id);
    if (kind === 'criteria' && !state.machines.length) return toast('Ajoutez d’abord une machine pour configurer un critère.', true);
    if (kind === 'rules' && !state.criteria.length) return toast('Ajoutez d’abord un critère pour configurer une règle.', true);
    const r = existing || {};
    let body, title;
    if (kind === 'machines') {
      title = existing ? 'Modifier la machine' : 'Ajouter une machine';
      body = field('code', 'Code machine *', r.code, 'text', 'required maxlength="30" placeholder="MCH-XXX-01"')
        + field('name', 'Nom machine *', r.name, 'text', 'required maxlength="120" placeholder="Nom de l’équipement"')
        + selectField('workshop', 'Atelier *', ['Atelier production solides', 'Atelier conditionnement'], r.workshop)
        + selectField('protocol', 'Protocole *', protocols, r.protocol || 'MQTT')
        + field('address', 'Adresse / endpoint *', r.address, 'text', 'required maxlength="150" placeholder="mqtt://10.10.2.14:1883"', true)
        + field('access', 'Topic / nœud / registre', r.access, 'text', 'maxlength="150"')
        + field('frequency', 'Fréquence de lecture (secondes) *', r.frequency ?? 5, 'number', 'required min="1" max="86400" step="1"')
        + '<label class="checkbox-field"><input name="connected" type="checkbox"' + (r.connected ? ' checked' : '') + '>Statut connecté dans les données de démonstration</label>';
    } else if (kind === 'criteria') {
      title = existing ? 'Modifier le critère' : 'Ajouter un critère';
      body = selectField('machineId', 'Machine *', state.machines.map(m => [m.id, m.name + ' · ' + m.code]), r.machineId, true)
        + field('parameter', 'Paramètre *', r.parameter, 'text', 'required maxlength="100"')
        + field('unit', 'Unité *', r.unit, 'text', 'required maxlength="20" placeholder="°C, bar, mm/s…"')
        + field('min', 'Seuil minimum', r.min, 'number', 'step="any"')
        + field('max', 'Seuil maximum', r.max, 'number', 'step="any"')
        + field('target', 'Valeur cible', r.target, 'number', 'step="any"')
        + field('tolerance', 'Tolérance', r.tolerance, 'text', 'maxlength="20" placeholder="± 2 % ou ± 0,3"')
        + '<label class="checkbox-field"><input name="active" type="checkbox"' + (r.active !== false ? ' checked' : '') + '>Activer ce critère de contrôle</label>';
    } else {
      title = existing ? 'Modifier la règle' : 'Ajouter une règle';
      body = selectField('criterionId', 'Machine / Paramètre *', state.criteria.map(c => [c.id, machine(c.machineId).code + ' · ' + c.parameter]), r.criterionId, true)
        + selectField('condition', 'Condition de déclenchement *', [['err', 'Hors tolérance'], ['warn', 'Alerte']], r.condition || 'err')
        + selectField('channel', 'Canal *', Object.entries(channelName), r.channel || 'email')
        + field('recipient', 'Destinataire *', r.recipient, 'text', 'required maxlength="150" placeholder="Adresse email, téléphone ou équipe"', true)
        + '<label class="checkbox-field"><input name="active" type="checkbox"' + (r.active !== false ? ' checked' : '') + '>Activer cette règle</label>';
    }
    showDialog(title, kind === 'rules' ? 'Configuration locale. L’envoi réel nécessite un service de notification.' : 'Les modifications sont enregistrées dans ce navigateur.', '<div class="form-grid">' + body + '</div>', cancelButton() + '<button type="submit" class="button primary">' + icon('check') + 'Enregistrer</button>', true);
    $('#editor-form').dataset.kind = kind;
    $('#editor-form').dataset.id = id || '';
    if (kind === 'machines') updateAddressPlaceholder();
    if (kind === 'rules') updateRecipientInput();
  }
  function updateAddressPlaceholder() {
    $('#field-address').placeholder = { MQTT: 'mqtt://10.10.2.14:1883', 'OPC UA': 'opc.tcp://10.10.2.21:4840', 'Modbus TCP': '10.10.3.5:502' }[$('#field-protocol').value];
  }
  function updateRecipientInput() {
    const type = $('#field-channel').value;
    const input = $('#field-recipient');
    input.type = type === 'email' ? 'email' : type === 'sms' ? 'tel' : 'text';
    input.placeholder = type === 'email' ? 'responsable@usine.tn' : type === 'sms' ? '+216 22 000 000' : 'Équipe maintenance';
  }
  function saveEditor(form) {
    const kind = form.dataset.kind, id = form.dataset.id;
    const data = new FormData(form);
    const text = name => String(data.get(name) || '').trim();
    const decimal = name => text(name) === '' ? null : Number(text(name));
    let r = { id: id || uid() }, error = '';
    if (kind === 'machines') {
      Object.assign(r, { code: text('code').toUpperCase(), name: text('name'), workshop: text('workshop'), protocol: text('protocol'), address: text('address'), access: text('access'), frequency: Number(text('frequency')), connected: data.has('connected') });
      if (!r.name || !r.code || !r.address) error = 'Renseignez le code, le nom et l’adresse de la machine.';
      else if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(r.code)) error = 'Le code doit contenir uniquement des lettres, chiffres, tirets ou traits de soulignement.';
      else if (state.machines.some(m => m.id !== id && normalize(m.code) === normalize(r.code))) error = 'Ce code machine existe déjà.';
      else if (!Number.isInteger(r.frequency) || r.frequency < 1 || r.frequency > 86400) error = 'La fréquence doit être un entier entre 1 et 86 400 secondes.';
      else {
        try {
          const endpoint = new URL(r.protocol === 'Modbus TCP' ? 'tcp://' + r.address : r.address);
          const allowed = { MQTT: ['mqtt:', 'mqtts:'], 'OPC UA': ['opc.tcp:', 'https:'], 'Modbus TCP': ['tcp:'] }[r.protocol];
          if (!endpoint.hostname || !allowed.includes(endpoint.protocol) || endpoint.username || endpoint.password || /\s/.test(r.address) || (r.protocol === 'Modbus TCP' && (!endpoint.port || endpoint.pathname || endpoint.search || endpoint.hash))) throw new Error();
        } catch { error = 'Adresse invalide. Utilisez le format indiqué pour ce protocole, sans identifiants.'; }
      }
    } else if (kind === 'criteria') {
      Object.assign(r, { machineId: text('machineId'), parameter: text('parameter'), unit: text('unit'), min: decimal('min'), max: decimal('max'), target: decimal('target'), tolerance: text('tolerance'), active: data.has('active') });
      if (!r.parameter || !r.unit || !machine(r.machineId)) error = 'Choisissez une machine et renseignez le paramètre et son unité.';
      else if (state.criteria.some(c => c.id !== id && c.machineId === r.machineId && normalize(c.parameter) === normalize(r.parameter))) error = 'Ce paramètre est déjà configuré pour cette machine.';
      else if (r.min === null && r.max === null) error = 'Renseignez au moins un seuil minimum ou maximum.';
      else if ([r.min, r.max, r.target].some(v => v !== null && !Number.isFinite(v))) error = 'Les seuils et la cible doivent être des nombres.';
      else if (r.min !== null && r.max !== null && r.min >= r.max) error = 'Le seuil minimum doit être inférieur au seuil maximum.';
      else if (r.target !== null && ((r.min !== null && r.target < r.min) || (r.max !== null && r.target > r.max))) error = 'La valeur cible doit être comprise entre les seuils.';
      else if (r.tolerance && !/^(?:±\s*)?\d+(?:[.,]\d+)?\s*%?$/.test(r.tolerance)) error = 'Utilisez une tolérance positive : « ± 2 % » ou « ± 0,3 ».';
    } else {
      Object.assign(r, { criterionId: text('criterionId'), condition: text('condition'), channel: text('channel'), recipient: text('recipient'), active: data.has('active') });
      if (!criterion(r.criterionId) || !r.recipient) error = 'Choisissez un critère et renseignez un destinataire.';
      else if (r.channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.recipient)) error = 'Renseignez une adresse email valide.';
      else if (r.channel === 'sms' && (!/^\+?[\d\s().-]{7,25}$/.test(r.recipient) || r.recipient.replace(/\D/g, '').length < 7 || r.recipient.replace(/\D/g, '').length > 15)) error = 'Renseignez un numéro de téléphone valide.';
    }
    if (error) {
      $('#form-error').textContent = error;
      $('#form-error').hidden = false;
      return;
    }
    if (id) state[kind] = state[kind].map(old => old.id === id ? r : old);
    else state[kind].push(r);
    $('#editor-dialog').close();
    filters[page].index = 1;
    persist(id ? 'Modifications enregistrées.' : kind === 'machines' ? 'Machine ajoutée au parc.' : kind === 'criteria' ? 'Critère de contrôle ajouté.' : 'Règle de notification ajoutée.');
  }
  function confirmDelete(kind, id) {
    const r = state[kind].find(item => item.id === id);
    if (!r) return;
    let description = 'Cette suppression est définitive dans les données de ce navigateur.';
    if (kind === 'machines') {
      const ids = state.criteria.filter(c => c.machineId === id).map(c => c.id);
      description = 'La machine, ses ' + ids.length + ' critères, ses mesures, ses règles et ses notifications locales seront supprimés.';
    }
    if (kind === 'criteria') description = 'Ce critère, ses mesures et ses règles locales seront supprimés. Les notifications historiques sont conservées.';
    showDialog('Supprimer ' + (kind === 'machines' ? 'la machine' : kind === 'criteria' ? 'le critère' : 'la règle') + ' ?', description, '<p class="detail-caption">' + esc(r.name || r.parameter || criterion(r.criterionId)?.parameter) + '</p>', cancelButton() + '<button class="button danger" data-action="confirm-delete" data-kind="' + kind + '" data-id="' + esc(id) + '">' + icon('trash') + 'Supprimer</button>');
  }
  function deleteRecord(kind, id) {
    if (kind === 'machines' || kind === 'criteria') {
      const ids = kind === 'criteria' ? [id] : state.criteria.filter(c => c.machineId === id).map(c => c.id);
      state.criteria = state.criteria.filter(c => !ids.includes(c.id));
      state.measurements = state.measurements.filter(v => !ids.includes(v.criterionId));
      state.rules = state.rules.filter(r => !ids.includes(r.criterionId));
    }
    if (kind === 'machines') state.notifications = state.notifications.filter(n => n.machineId !== id);
    state[kind] = state[kind].filter(r => r.id !== id);
    $('#editor-dialog').close();
    persist('Suppression enregistrée.');
  }
  function details(items) {
    return '<dl class="detail-list">' + items.map(([label, value]) => '<div><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>').join('') + '</dl>';
  }
  function viewMachine(id) {
    const m = machine(id);
    showDialog(m.name, m.code, details([['Atelier', m.workshop], ['Protocole', m.protocol], ['Adresse', m.address], ['Point d’accès', m.access || '—'], ['Fréquence de lecture', m.frequency + ' s'], ['Connexion (exemple)', m.connected ? 'Connectée' : 'Déconnectée'], ['Critères configurés', state.criteria.filter(c => c.machineId === m.id).length]]) + '<p class="detail-caption">Le statut provient des données locales. Aucune connexion réseau à la machine n’est effectuée par cette interface.</p>', closeButton() + '<button class="button primary" data-action="edit" data-kind="machines" data-id="' + esc(id) + '">' + icon('edit') + 'Modifier</button>');
  }
  function viewMeasurement(id) {
    const v = state.measurements.find(item => item.id === id);
    const c = criterion(v.criterionId);
    showDialog(c.parameter, machine(c.machineId).code, details([['Valeur mesurée', number(v.value) + ' ' + c.unit], ['Horodatage', dateText(v.date)], ['Plage attendue', range(c) + ' ' + c.unit], ['Valeur cible', number(c.target) + ' ' + c.unit], ['Tolérance', c.tolerance || '—'], ['Statut actuel', statusName[measurementStatus(v)]]]) + '<p class="detail-caption">La mesure est archivée. Son statut est calculé avec les critères actuels ; une alerte indique la proximité d’un seuil, une mesure hors tolérance son dépassement.</p>', closeButton() + '<button class="button primary" data-action="show-trend" data-id="' + esc(id) + '">' + icon('chart') + 'Voir la tendance</button>');
  }
  function help() {
    showDialog('Votre espace Smart Factory', 'Configurez, observez et agissez depuis un seul espace.', '<div class="help-content"><h3>Un parcours en quatre étapes</h3><p>Ajoutez vos machines, définissez leurs critères de contrôle, explorez les mesures et configurez les règles de notification. La recherche, les filtres et l’export CSV utilisent votre sélection.</p><h3>Des exemples, des interactions réelles</h3><p>Les équipements et relevés du 4 mars 2026 sont des données de démonstration. Vos modifications et vos lectures de notifications sont enregistrées localement dans ce navigateur. Aucun appareil, serveur MySQL, email ou SMS n’est connecté.</p><h3>Comprendre les statuts</h3><p>Un seuil dépassé donne « Hors tolérance ». La zone d’alerte commence à une tolérance, ou 10 % de la plage, avant le seuil. Un critère inactif produit une mesure « Non évaluée ». Les statuts historiques sont recalculés après modification des critères.</p><h3>Raccourcis et données</h3><p>Appuyez sur / pour rechercher, Échap pour fermer une fenêtre. Utilisez Exporter pour conserver une copie CSV avant de réinitialiser les exemples. La suppression de données de navigation efface les modifications locales.</p></div>', '<button class="button" data-action="reset-demo">' + icon('layers') + 'Réinitialiser les exemples</button>' + closeButton());
  }
  function exportCSV() {
    const rows = filteredRows();
    if (!rows.length) return toast('Aucune donnée à exporter avec ces filtres.', true);
    let headers, data;
    if (page === 'machines') {
      headers = ['Code', 'Nom', 'Atelier', 'Protocole', 'Adresse', 'Point d’accès', 'Fréquence (s)', 'Connexion'];
      data = rows.map(m => [m.code, m.name, m.workshop, m.protocol, m.address, m.access, m.frequency, m.connected ? 'Connectée' : 'Déconnectée']);
    } else if (page === 'criteres') {
      headers = ['Machine', 'Paramètre', 'Unité', 'Minimum', 'Cible', 'Maximum', 'Tolérance', 'Actif'];
      data = rows.map(c => [machine(c.machineId).code, c.parameter, c.unit, c.min, c.target, c.max, c.tolerance, c.active]);
    } else if (page === 'notifications') {
      headers = ['Machine', 'Paramètre', 'Condition', 'Canal', 'Destinataire', 'Active'];
      data = rows.map(r => [machine(criterion(r.criterionId).machineId).code, criterion(r.criterionId).parameter, statusName[r.condition], channelName[r.channel], r.recipient, r.active]);
    } else {
      headers = ['Machine', 'Paramètre', 'Valeur', 'Unité', 'Minimum', 'Maximum', 'Horodatage', 'Statut'];
      data = rows.map(v => { const c = criterion(v.criterionId); return [machine(c.machineId).code, c.parameter, v.value, c.unit, c.min, c.max, v.date, statusName[measurementStatus(v)]]; });
    }
    // Quote cells and neutralize spreadsheet formula prefixes in user-controlled text.
    const cell = value => {
      let s = String(value ?? '');
      if (typeof value === 'string' && /^[\s]*[=+\-@\t\r]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const csv = '\uFEFF' + [headers, ...data].map(row => row.map(cell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'momsoft-' + page + '.csv';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(rows.length + ' lignes exportées en CSV.');
  }
  function resetFilters() {
    Object.assign(filters[page], { query: '', workshop: '', status: '', protocol: '', date: '', index: 1 });
    render();
  }
  function chartTooltip(id) {
    const v = state.measurements.find(r => r.id === id);
    const c = criterion(v.criterionId);
    $('#chart-tooltip').textContent = dateText(v.date) + ' · ' + number(v.value) + ' ' + c.unit + ' · ' + statusName[measurementStatus(v)];
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target || target.disabled) return;
    const { action, id, kind } = target.dataset;
    const f = filters[page];
    if (action === 'export') exportCSV();
    else if (action === 'add') openEditor(kind);
    else if (action === 'edit') openEditor(kind, id);
    else if (action === 'delete') confirmDelete(kind, id);
    else if (action === 'confirm-delete') deleteRecord(kind, id);
    else if (action === 'view-machine') viewMachine(id);
    else if (action === 'view-measurement') viewMeasurement(id);
    else if (action === 'close-dialog') $('#editor-dialog').close();
    else if (action === 'filters') { f.expanded = !f.expanded; render(); $('[data-action=filters]').focus(); }
    else if (action === 'reset-filters') resetFilters();
    else if (action === 'show-offline') { f.status = 'disconnected'; f.expanded = true; f.query = ''; f.workshop = ''; f.protocol = ''; f.index = 1; render(); }
    else if (action === 'sort') { f.direction = f.sort === target.dataset.key ? -f.direction : 1; f.sort = target.dataset.key; render(); }
    else if (action === 'previous' || action === 'next') { f.index += action === 'next' ? 1 : -1; render(); }
    else if (action === 'open-notifications') { if (page === 'notifications') $('#content').focus(); else location.hash = 'notifications'; }
    else if (action === 'read') { state.notifications.find(n => n.id === id).read = true; persist('Notification marquée comme lue.'); }
    else if (action === 'read-all') { state.notifications.forEach(n => { n.read = true; }); persist('Toutes les notifications sont marquées comme lues.'); }
    else if (action === 'chart-point') chartTooltip(id);
    else if (action === 'show-trend') {
      const v = state.measurements.find(r => r.id === id);
      chartCriterion = v.criterionId;
      Object.assign(filters.visualisation, { query: '', workshop: '', status: '', date: v.date.slice(0, 10), index: 1 });
      $('#editor-dialog').close();
      if (page !== 'visualisation') location.hash = 'visualisation'; else render();
      $('.chart-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    else if (action === 'help') help();
    else if (action === 'profile') showDialog('Jean Dupont', 'Profil de démonstration · Site de Sfax', details([['Rôle', 'Responsable production'], ['Site', 'Sfax'], ['Espace', 'Suivi paramètres machine']]) + '<p class="detail-caption">Ce prototype ne comporte pas d’authentification. Les données et modifications restent dans ce navigateur.</p>', closeButton());
    else if (action === 'reset-demo') showDialog('Réinitialiser les exemples ?', 'Toutes les modifications locales seront remplacées par les données initiales.', '<p class="detail-caption">Exportez vos listes en CSV si vous souhaitez conserver vos configurations.</p>', cancelButton() + '<button class="button danger" data-action="confirm-reset">Réinitialiser</button>');
    else if (action === 'confirm-reset') { state = cloneSeed(); Object.keys(filters).forEach(p => { Object.assign(filters[p], { query: '', workshop: '', status: '', protocol: '', date: p === 'visualisation' ? '2026-03-04' : '', index: 1 }); }); $('#editor-dialog').close(); persist('Les données de démonstration ont été restaurées.'); }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'search') { filters[page].query = event.target.value; filters[page].index = 1; render(); }
  });
  document.addEventListener('change', event => {
    const target = event.target;
    if (target.dataset.filter) { const key = target.dataset.filter; filters[page][key] = key === 'size' ? Number(target.value) : target.value; filters[page].index = 1; render(); }
    if (target.id === 'chart-parameter') { chartCriterion = target.value; render(); }
    if (target.id === 'field-protocol') updateAddressPlaceholder();
    if (target.id === 'field-channel') updateRecipientInput();
  });
  document.addEventListener('submit', event => {
    if (event.target.id === 'editor-form') { event.preventDefault(); saveEditor(event.target); }
  });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !$('#editor-dialog').open && !/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) { event.preventDefault(); $('#search')?.focus(); }
    if (event.key === 'Escape' && document.body.classList.contains('sidebar-open')) { closeMenu(); $('#mobile-menu').focus(); }
    if (event.key === 'Tab' && document.body.classList.contains('sidebar-open')) {
      const elements = [...$('.sidebar').querySelectorAll('a, button')].filter(el => el.getClientRects().length);
      if (event.shiftKey && event.target === elements[0]) { event.preventDefault(); elements.at(-1).focus(); }
      else if (!event.shiftKey && event.target === elements.at(-1)) { event.preventDefault(); elements[0].focus(); }
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.chart-point')) { event.preventDefault(); chartTooltip(event.target.dataset.id); }
  });
  document.addEventListener('pointerover', event => {
    const point = event.target.closest('.chart-point');
    if (point) chartTooltip(point.dataset.id);
  });
  document.addEventListener('focusin', event => {
    if (event.target.matches('.chart-point')) chartTooltip(event.target.dataset.id);
  });
  $('#editor-dialog').addEventListener('click', event => {
    if (event.target === $('#editor-dialog')) {
      const box = event.target.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) event.target.close();
    }
  });
  $('#editor-dialog').addEventListener('close', () => {
    if (dialogReturnFocus?.isConnected) dialogReturnFocus.focus({ preventScroll: true });
    else $('.head-actions .primary')?.focus({ preventScroll: true });
  });
  $('#mobile-menu').addEventListener('click', () => {
    const open = !document.body.classList.contains('sidebar-open');
    document.body.classList.toggle('sidebar-open', open);
    document.body.classList.remove('sidebar-collapsed');
    $('#collapse-sidebar').setAttribute('aria-expanded', 'true');
    $('#sidebar-backdrop').hidden = !open;
    $('#mobile-menu').setAttribute('aria-expanded', String(open));
    $('.main-shell').inert = open;
    syncSidebar();
    if (open) $('.nav-item.active').focus();
  });
  $('#sidebar-backdrop').addEventListener('click', () => { closeMenu(); $('#mobile-menu').focus(); });
  $('#collapse-sidebar').addEventListener('click', () => {
    const collapsed = document.body.classList.toggle('sidebar-collapsed');
    $('#collapse-sidebar').setAttribute('aria-expanded', String(!collapsed));
    $('#collapse-sidebar').setAttribute('aria-label', collapsed ? 'Développer la navigation' : 'Réduire la navigation');
  });
  window.addEventListener('hashchange', route);
  window.matchMedia('(max-width: 760px)').addEventListener('change', syncSidebar);
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) { state = readState(); $('#editor-dialog').close(); render(); toast('Données actualisées depuis un autre onglet.'); }
  });
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  route();
  if (storageWarning) toast(storageWarning, true);
})();
