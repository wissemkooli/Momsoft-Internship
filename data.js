/* Original factory examples. No equipment connection or delivery is simulated. */
window.MOMSOFT_SEED = {
  version: 1,
  machines: [
    { id: 'm1', code: 'MCH-FET-2090-01', name: 'Presse biscuits Fette 2090', workshop: 'Atelier production solides', protocol: 'MQTT', address: 'mqtt://10.10.2.14:1883', access: 'usine/l1/presse', frequency: 5, connected: true },
    { id: 'm2', code: 'MCH-GEA-MIX-01', name: 'Mélangeur GEA PharmaConnect', workshop: 'Atelier production solides', protocol: 'OPC UA', address: 'opc.tcp://10.10.2.21:4840', access: 'ns=2;s=Mixer.Motor', frequency: 2, connected: true },
    { id: 'm3', code: 'MCH-IMA-C80-01', name: 'Mise en sachet IMA C80', workshop: 'Atelier conditionnement', protocol: 'Modbus TCP', address: '10.10.3.05:502', access: 'registre 4001', frequency: 10, connected: true },
    { id: 'm4', code: 'MCH-UHLMANN-01', name: 'Etuyeuse Uhlmann C2100', workshop: 'Atelier conditionnement', protocol: 'OPC UA', address: 'opc.tcp://10.10.3.12:4840', access: 'ns=2;s=Cartoner.Air', frequency: 5, connected: false },
    { id: 'm5', code: 'MCH-BAL-MET-01', name: 'Balance Mettler Toledo XPE', workshop: 'Atelier production solides', protocol: 'MQTT', address: 'mqtt://10.10.2.14:1883', access: 'usine/l1/pesage', frequency: 1, connected: true },
    { id: 'm6', code: 'MCH-KOR-01', name: 'Encartonneuse Korber Medipak', workshop: 'Atelier conditionnement', protocol: 'Modbus TCP', address: '10.10.3.08:502', access: 'registre 4010', frequency: 10, connected: true }
  ],
  criteria: [
    { id: 'c1', machineId: 'm1', parameter: 'Température four', unit: '°C', min: 175, target: 180, max: 185, tolerance: '± 2 %', active: true },
    { id: 'c2', machineId: 'm1', parameter: 'Vitesse presse', unit: 'trs/min', min: 55, target: 60, max: 65, tolerance: '± 5 %', active: true },
    { id: 'c3', machineId: 'm2', parameter: 'Température moteur', unit: '°C', min: null, target: 65, max: 80, tolerance: '± 3 %', active: true },
    { id: 'c4', machineId: 'm2', parameter: 'Vibration cuve', unit: 'mm/s', min: null, target: 2.5, max: 4.5, tolerance: '± 0,3', active: true },
    { id: 'c5', machineId: 'm3', parameter: 'Température scellage', unit: '°C', min: 138, target: 142, max: 146, tolerance: '± 1 %', active: true },
    { id: 'c6', machineId: 'm5', parameter: 'Dérive pesée', unit: 'g', min: -0.05, target: 0, max: 0.05, tolerance: '± 0,01', active: true },
    { id: 'c7', machineId: 'm4', parameter: 'Pression air comprimé', unit: 'bar', min: 5.5, target: 6, max: 6.5, tolerance: '± 2 %', active: true },
    { id: 'c8', machineId: 'm6', parameter: 'Cadence encartonnage', unit: 'étuis/min', min: 110, target: 120, max: 130, tolerance: '± 5 %', active: false }
  ],
  // Measurements use local factory time. This is a fixed historical dataset.
  measurements: [
    { id: 'v1', criterionId: 'c1', value: 179.4, date: '2026-03-04T13:30' },
    { id: 'v2', criterionId: 'c1', value: 180.1, date: '2026-03-04T13:45' },
    { id: 'v3', criterionId: 'c1', value: 179.8, date: '2026-03-04T14:00' },
    { id: 'v4', criterionId: 'c1', value: 183.6, date: '2026-03-04T14:15' },
    { id: 'v5', criterionId: 'c1', value: 187.2, date: '2026-03-04T14:30' },
    { id: 'v6', criterionId: 'c1', value: 184.1, date: '2026-03-04T14:45' },
    { id: 'v7', criterionId: 'c1', value: 180.4, date: '2026-03-04T15:00' },
    { id: 'v8', criterionId: 'c1', value: 179.6, date: '2026-03-04T15:15' },
    { id: 'v9', criterionId: 'c4', value: 4.1, date: '2026-03-04T14:28' },
    { id: 'v10', criterionId: 'c5', value: 142.3, date: '2026-03-04T14:27' },
    { id: 'v11', criterionId: 'c6', value: 0.01, date: '2026-03-04T14:26' },
    { id: 'v12', criterionId: 'c3', value: 76.8, date: '2026-03-04T14:25' },
    { id: 'v13', criterionId: 'c2', value: 60.2, date: '2026-03-04T14:24' },
    { id: 'v14', criterionId: 'c7', value: 6.1, date: '2026-03-04T14:22' },
    { id: 'v15', criterionId: 'c8', value: 121, date: '2026-03-04T14:20' }
  ],
  rules: [
    { id: 'r1', criterionId: 'c1', condition: 'err', channel: 'email', recipient: 'resp.production@usine.tn', active: true },
    { id: 'r2', criterionId: 'c4', condition: 'warn', channel: 'application', recipient: 'Équipe maintenance', active: true },
    { id: 'r3', criterionId: 'c5', condition: 'err', channel: 'sms', recipient: '+216 22 000 000', active: true },
    { id: 'r4', criterionId: 'c6', condition: 'err', channel: 'email', recipient: 'qualite@usine.tn', active: true },
    { id: 'r5', criterionId: 'c8', condition: 'warn', channel: 'application', recipient: "Chef d’atelier conditionnement", active: false }
  ],
  notifications: [
    { id: 'n1', machineId: 'm1', date: '2026-03-04T14:30', message: 'Température four à 187,2 °C — seuil max 185 °C dépassé', channel: 'email', read: false },
    { id: 'n2', machineId: 'm2', date: '2026-03-04T14:28', message: 'Vibration cuve à 4,1 mm/s — approche du seuil max 4,5 mm/s', channel: 'application', read: false },
    { id: 'n3', machineId: 'm2', date: '2026-03-04T13:12', message: 'Température moteur à 76,8 °C — approche du seuil max 80 °C', channel: 'application', read: false },
    { id: 'n4', machineId: 'm3', date: '2026-03-04T11:47', message: 'Température scellage revenue dans la plage 138 – 146 °C', channel: 'sms', read: true },
    { id: 'n5', machineId: 'm5', date: '2026-03-04T09:05', message: 'Dérive pesée à +0,06 g — tolérance ± 0,05 g dépassée', channel: 'email', read: true }
  ]
};
