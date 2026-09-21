-- ============================================================
-- MOMSOFT Smart Factory — Module Suivi des paramètres machine
-- Script MySQL : création de la base, des tables et des données
-- Exécution :  mysql -u root -p < schema.sql
-- ============================================================

DROP DATABASE IF EXISTS sf_parametres_machine;
CREATE DATABASE sf_parametres_machine CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sf_parametres_machine;

-- ------------------------------------------------------------
-- 1. ATELIER : zone de production regroupant des machines
-- ------------------------------------------------------------
CREATE TABLE atelier (
    id          CHAR(36)     NOT NULL DEFAULT (UUID()),
    code        VARCHAR(20)  NOT NULL UNIQUE,
    nom         VARCHAR(100) NOT NULL,
    site        VARCHAR(50)  NOT NULL,
    statut      ENUM('actif','inactif') NOT NULL DEFAULT 'actif',
    cree_le     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- ------------------------------------------------------------
-- 2. MACHINE : équipement de production suivi par le module
-- ------------------------------------------------------------
CREATE TABLE machine (
    id           CHAR(36)     NOT NULL DEFAULT (UUID()),
    atelier_id   CHAR(36)     NOT NULL,
    code         VARCHAR(30)  NOT NULL UNIQUE,
    nom          VARCHAR(120) NOT NULL,
    type_machine VARCHAR(80)  NULL,
    statut       ENUM('en_service','en_maintenance','hors_service') NOT NULL DEFAULT 'en_service',
    description  VARCHAR(255) NULL,
    cree_le      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_machine_atelier FOREIGN KEY (atelier_id) REFERENCES atelier(id)
);

-- ------------------------------------------------------------
-- 3. CONNEXION_MACHINE : configuration du protocole (1–1 avec machine)
-- ------------------------------------------------------------
CREATE TABLE connexion_machine (
    id                 CHAR(36)    NOT NULL DEFAULT (UUID()),
    machine_id         CHAR(36)    NOT NULL UNIQUE,      -- UNIQUE => relation one-to-one
    protocole          ENUM('MQTT','OPC_UA','MODBUS_TCP') NOT NULL,
    adresse            VARCHAR(150) NOT NULL,            -- URL broker, endpoint OPC UA ou IP:port
    point_acces        VARCHAR(150) NULL,                -- topic MQTT, nœud OPC UA ou registre Modbus
    frequence_lecture_s INT         NOT NULL DEFAULT 5,  -- fréquence de lecture en secondes
    est_connectee      BOOLEAN     NOT NULL DEFAULT FALSE,
    derniere_connexion TIMESTAMP   NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_connexion_machine FOREIGN KEY (machine_id) REFERENCES machine(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 4. PARAMETRE_MACHINE : grandeur physique surveillée sur une machine
-- ------------------------------------------------------------
CREATE TABLE parametre_machine (
    id          CHAR(36)     NOT NULL DEFAULT (UUID()),
    machine_id  CHAR(36)     NOT NULL,
    code        VARCHAR(30)  NOT NULL,
    nom         VARCHAR(100) NOT NULL,
    unite       VARCHAR(20)  NOT NULL,
    type_donnee ENUM('decimal','entier','booleen') NOT NULL DEFAULT 'decimal',
    PRIMARY KEY (id),
    UNIQUE KEY uq_param_machine (machine_id, code),
    CONSTRAINT fk_parametre_machine FOREIGN KEY (machine_id) REFERENCES machine(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 5. CRITERE_CONTROLE : seuils appliqués à un paramètre
-- ------------------------------------------------------------
CREATE TABLE critere_controle (
    id           CHAR(36)      NOT NULL DEFAULT (UUID()),
    parametre_id CHAR(36)      NOT NULL,
    seuil_min    DECIMAL(12,3) NULL,
    valeur_cible DECIMAL(12,3) NULL,
    seuil_max    DECIMAL(12,3) NULL,
    tolerance    VARCHAR(20)   NULL,          -- ex. '± 2 %'
    actif        BOOLEAN       NOT NULL DEFAULT TRUE,
    cree_le      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_critere_parametre FOREIGN KEY (parametre_id) REFERENCES parametre_machine(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 6. MESURE : donnée brute lue sur la machine
--    (stockée dans MySQL conformément à la contrainte du projet)
-- ------------------------------------------------------------
CREATE TABLE mesure (
    id           CHAR(36)      NOT NULL DEFAULT (UUID()),
    parametre_id CHAR(36)      NOT NULL,
    valeur       DECIMAL(12,3) NOT NULL,
    horodatage   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    statut       ENUM('conforme','alerte','hors_tolerance') NOT NULL DEFAULT 'conforme',
    PRIMARY KEY (id),
    KEY idx_mesure_param_date (parametre_id, horodatage),
    CONSTRAINT fk_mesure_parametre FOREIGN KEY (parametre_id) REFERENCES parametre_machine(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 7. REGLE_NOTIFICATION : règle d'alerte attachée à un critère
-- ------------------------------------------------------------
CREATE TABLE regle_notification (
    id           CHAR(36)     NOT NULL DEFAULT (UUID()),
    critere_id   CHAR(36)     NOT NULL,
    condition_declenchement ENUM('alerte','hors_tolerance') NOT NULL DEFAULT 'hors_tolerance',
    canal        ENUM('email','sms','application') NOT NULL,
    destinataire VARCHAR(150) NOT NULL,
    actif        BOOLEAN      NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CONSTRAINT fk_regle_critere FOREIGN KEY (critere_id) REFERENCES critere_controle(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 8. NOTIFICATION : alerte réellement émise
-- ------------------------------------------------------------
CREATE TABLE notification (
    id         CHAR(36)     NOT NULL DEFAULT (UUID()),
    regle_id   CHAR(36)     NOT NULL,
    mesure_id  CHAR(36)     NOT NULL,
    message    VARCHAR(255) NOT NULL,
    envoyee_le TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    statut     ENUM('envoyee','lue','echec') NOT NULL DEFAULT 'envoyee',
    PRIMARY KEY (id),
    CONSTRAINT fk_notification_regle  FOREIGN KEY (regle_id)  REFERENCES regle_notification(id),
    CONSTRAINT fk_notification_mesure FOREIGN KEY (mesure_id) REFERENCES mesure(id)
);

-- ============================================================
-- DONNÉES D'EXEMPLE (cohérentes avec le prototype HTML)
-- ============================================================

INSERT INTO atelier (id, code, nom, site) VALUES
('a1000000-0000-0000-0000-000000000001','ATL-PS','Atelier production solides','Sfax'),
('a1000000-0000-0000-0000-000000000002','ATL-CD','Atelier conditionnement','Sfax');

INSERT INTO machine (id, atelier_id, code, nom, type_machine) VALUES
('m1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','MCH-FET-2090-01','Presse biscuits Fette 2090','Presse à biscuits'),
('m1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','MCH-GEA-MIX-01','Mélangeur GEA PharmaConnect','Mélangeur'),
('m1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000002','MCH-IMA-C80-01','Mise en sachet IMA C80','Machine de blistérisation'),
('m1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000002','MCH-UHLMANN-01','Etuyeuse Uhlmann C2100','Etuyeuse'),
('m1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000001','MCH-BAL-MET-01','Balance Mettler Toledo XPE','Balance de précision'),
('m1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000002','MCH-KOR-01','Encartonneuse Korber Medipak','Encartonneuse');

INSERT INTO connexion_machine (machine_id, protocole, adresse, point_acces, frequence_lecture_s, est_connectee) VALUES
('m1000000-0000-0000-0000-000000000001','MQTT','mqtt://10.10.2.14:1883','usine/l1/presse',5,TRUE),
('m1000000-0000-0000-0000-000000000002','OPC_UA','opc.tcp://10.10.2.21:4840','ns=2;s=Mixer.Motor',2,TRUE),
('m1000000-0000-0000-0000-000000000003','MODBUS_TCP','10.10.3.05:502','registre 4001',10,TRUE),
('m1000000-0000-0000-0000-000000000004','OPC_UA','opc.tcp://10.10.3.12:4840','ns=2;s=Cartoner.Air',5,FALSE),
('m1000000-0000-0000-0000-000000000005','MQTT','mqtt://10.10.2.14:1883','usine/l1/pesage',1,TRUE),
('m1000000-0000-0000-0000-000000000006','MODBUS_TCP','10.10.3.08:502','registre 4010',10,TRUE);

INSERT INTO parametre_machine (id, machine_id, code, nom, unite) VALUES
('p1000000-0000-0000-0000-000000000001','m1000000-0000-0000-0000-000000000001','TEMP-FOUR','Température four','°C'),
('p1000000-0000-0000-0000-000000000002','m1000000-0000-0000-0000-000000000001','VIT-PRESSE','Vitesse presse','trs/min'),
('p1000000-0000-0000-0000-000000000003','m1000000-0000-0000-0000-000000000002','TEMP-MOTEUR','Température moteur','°C'),
('p1000000-0000-0000-0000-000000000004','m1000000-0000-0000-0000-000000000002','VIB-CUVE','Vibration cuve','mm/s'),
('p1000000-0000-0000-0000-000000000005','m1000000-0000-0000-0000-000000000003','TEMP-SCEL','Température scellage','°C'),
('p1000000-0000-0000-0000-000000000006','m1000000-0000-0000-0000-000000000005','DERIVE-PESEE','Dérive pesée','g'),
('p1000000-0000-0000-0000-000000000007','m1000000-0000-0000-0000-000000000004','PRESS-AIR','Pression air comprimé','bar'),
('p1000000-0000-0000-0000-000000000008','m1000000-0000-0000-0000-000000000006','CAD-ENCART','Cadence encartonnage','étuis/min');

INSERT INTO critere_controle (id, parametre_id, seuil_min, valeur_cible, seuil_max, tolerance, actif) VALUES
('c1000000-0000-0000-0000-000000000001','p1000000-0000-0000-0000-000000000001',175,180,185,'± 2 %',TRUE),
('c1000000-0000-0000-0000-000000000002','p1000000-0000-0000-0000-000000000002',55,60,65,'± 5 %',TRUE),
('c1000000-0000-0000-0000-000000000003','p1000000-0000-0000-0000-000000000003',NULL,65,80,'± 3 %',TRUE),
('c1000000-0000-0000-0000-000000000004','p1000000-0000-0000-0000-000000000004',NULL,2.5,4.5,'± 0,3',TRUE),
('c1000000-0000-0000-0000-000000000005','p1000000-0000-0000-0000-000000000005',138,142,146,'± 1 %',TRUE),
('c1000000-0000-0000-0000-000000000006','p1000000-0000-0000-0000-000000000006',-0.05,0,0.05,'± 0,01',TRUE),
('c1000000-0000-0000-0000-000000000007','p1000000-0000-0000-0000-000000000007',5.5,6.0,6.5,'± 2 %',TRUE),
('c1000000-0000-0000-0000-000000000008','p1000000-0000-0000-0000-000000000008',110,120,130,'± 5 %',FALSE);

INSERT INTO mesure (id, parametre_id, valeur, horodatage, statut) VALUES
('e1000000-0000-0000-0000-000000000001','p1000000-0000-0000-0000-000000000001',179.4,'2026-03-04 13:30:00','conforme'),
('e1000000-0000-0000-0000-000000000002','p1000000-0000-0000-0000-000000000001',180.1,'2026-03-04 13:45:00','conforme'),
('e1000000-0000-0000-0000-000000000003','p1000000-0000-0000-0000-000000000001',179.8,'2026-03-04 14:00:00','conforme'),
('e1000000-0000-0000-0000-000000000004','p1000000-0000-0000-0000-000000000001',183.6,'2026-03-04 14:15:00','alerte'),
('e1000000-0000-0000-0000-000000000005','p1000000-0000-0000-0000-000000000001',187.2,'2026-03-04 14:30:00','hors_tolerance'),
('e1000000-0000-0000-0000-000000000006','p1000000-0000-0000-0000-000000000004',4.1,'2026-03-04 14:28:00','alerte'),
('e1000000-0000-0000-0000-000000000007','p1000000-0000-0000-0000-000000000005',142.3,'2026-03-04 14:27:00','conforme'),
('e1000000-0000-0000-0000-000000000008','p1000000-0000-0000-0000-000000000006',0.01,'2026-03-04 14:26:00','conforme'),
('e1000000-0000-0000-0000-000000000009','p1000000-0000-0000-0000-000000000003',76.8,'2026-03-04 14:25:00','alerte'),
('e1000000-0000-0000-0000-000000000010','p1000000-0000-0000-0000-000000000002',60.2,'2026-03-04 14:24:00','conforme');

INSERT INTO regle_notification (id, critere_id, condition_declenchement, canal, destinataire, actif) VALUES
('r1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','hors_tolerance','email','resp.production@usine.tn',TRUE),
('r1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000004','alerte','application','Équipe maintenance',TRUE),
('r1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000005','hors_tolerance','sms','+216 22 000 000',TRUE),
('r1000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000006','hors_tolerance','email','qualite@usine.tn',TRUE),
('r1000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000008','alerte','application','Chef atelier conditionnement',FALSE);

INSERT INTO notification (regle_id, mesure_id, message, envoyee_le, statut) VALUES
('r1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000005',
 'Température four à 187,2 °C — seuil max 185 °C dépassé','2026-03-04 14:30:05','envoyee'),
('r1000000-0000-0000-0000-000000000002','e1000000-0000-0000-0000-000000000006',
 'Vibration cuve à 4,1 mm/s — approche du seuil max 4,5 mm/s','2026-03-04 14:28:03','envoyee');

-- ------------------------------------------------------------
-- Vue pratique : dernières mesures avec machine, seuils et statut
-- ------------------------------------------------------------
CREATE VIEW v_dernieres_mesures AS
SELECT m.code AS machine, p.nom AS parametre, p.unite,
       me.valeur, me.horodatage, me.statut,
       c.seuil_min, c.valeur_cible, c.seuil_max
FROM mesure me
JOIN parametre_machine p ON p.id = me.parametre_id
JOIN machine m           ON m.id = p.machine_id
LEFT JOIN critere_controle c ON c.parametre_id = p.id AND c.actif = TRUE
ORDER BY me.horodatage DESC;

-- Vérification rapide :
-- SELECT * FROM v_dernieres_mesures LIMIT 10;
