/* ============================================================================
   WMS (3PL) — GOODS RECEPTION SEED / REFERENCE DATA
   Companion to: 02_goods_reception_schema.sql  (run the schema FIRST).
   Run order   : 01_master_data_schema.sql -> 01_master_data_seed.sql ->
                 02_goods_reception_schema.sql -> THIS FILE.
   ----------------------------------------------------------------------------
   Target engine : Microsoft SQL Server 2014  (hard constraint)
   Scope of file : Canonical REFERENCE rows the Goods-Reception screens CONSUME
                   (rather than data a user authors on screen). Schema lives in
                   02_goods_reception_schema.sql; this file only INSERTs rows.

   WHY this file exists
   --------------------
   Three reason-code domains are read live by the receiving screens but are NOT
   seeded by 01_master_data_seed.sql (which seeds status/adjust/correct/return/
   dispatch only). Without them the dropdowns are empty and the screens are unusable:

     * 'receipt'    — CONDITION reasons on erp-gr-receipt.html / pwa-gr-receive.html.
                      A lot received as Hold/Damaged needs a reason; the dropdown is
                      reasonsFor('receipt', 'hold' | 'damaged'). groupedBy='Condition'.
     * 'refuse'     — refusal reasons on the "Refuse delivery" modal (erp-gr-asn.html
                      + erp-gr-receipt.html + pwa-gr-receive.html): reasonsFor('refuse').
                      Stored on wmsrefusal.reasonid. Single shared list.
     * 'discrepancy'— over/short reasons when received qty <> the ASN line's
                      outstanding remainder (mandatory per BLOCKING_RULES). The mock
                      keeps these as a SCREEN-LOCAL array (REASONS in erp-gr-receipt
                      .html); production promotes them to master data so the FK
                      wmsreceiptline.discrepancyreasonid -> wmsreason resolves. Single list.

   These three domains ALSO appear in DB.reasonDomains in wms/mockups/assets/data.js
   (pushed alongside 'dispose'/'rtv'); erp-md-reasons.html renders them generically,
   so they ARE master data — they are seeded here only because Goods Reception is the
   section that first consumes them. (The 'dispose'/'rtv' domains belong to the
   Inventory-Ops / Stock-Out seeds and are intentionally NOT seeded here.)

   Source of truth for the values:
     * 'receipt' / 'refuse'  -> DB.reasonDomains in data.js (the edge-case seed block).
     * 'discrepancy'         -> the REASONS array in erp-gr-receipt.html.

   NOT seeded here (minted by the operational flow, never pre-seeded):
     wmsasn / wmsasnline, wmsreceipt / wmsreceiptline, wmslpn / wmslpnserial,
     wmspallet*, wmsinspection, wmsgrn / wmsgrnline, wmsrefusal, wmstxn,
     wmsattachment — these are created by Receive / Inspect / Refuse at runtime.

   CONVENTIONS (identical to 01_master_data_seed.sql)
   --------------------------------------------------
   * Idempotent: every INSERT is guarded by NOT EXISTS on the business unique key
     (domain.code · group(domainid,groupkey) · reason(groupid,reasontext)), so the
     file is safe to re-run.
   * The mock's empty-string groupedBy:'' normalises to NULL here (per schema).
   * Table variables are scoped per batch — do NOT add GO between a DECLARE and its use.

   HOW TO RUN
   ----------
   Select your WMS database first (e.g.  USE [WMS];  or the per-agency DMS_<n>),
   then run the files in the order listed at the top.
   ============================================================================ */

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ============================================================================
   wmsreasondomain / wmsreasongroup / wmsreason — Goods-Reception reason vocabulary
   (adds the 'receipt', 'refuse', 'discrepancy' domains on top of 01's base set)
   ============================================================================ */

/* --- Domains (code | label | groupedby) --- */
DECLARE @dom TABLE (code VARCHAR(20), label NVARCHAR(80), groupedby NVARCHAR(40) NULL);
INSERT INTO @dom (code, label, groupedby) VALUES
    ('receipt',     N'Receipt condition',        N'Condition'),   -- Hold/Damaged at receipt
    ('refuse',      N'Delivery refusal',         NULL),           -- refused at the door (no stock)
    ('discrepancy', N'Receipt discrepancy',      NULL);           -- over/short vs ASN outstanding

INSERT INTO dbo.wmsreasondomain (code, label, groupedby)
SELECT s.code, s.label, s.groupedby
FROM @dom s
WHERE NOT EXISTS (SELECT 1 FROM dbo.wmsreasondomain d WHERE d.code = s.code);
GO

/* --- Groups (domain code | groupkey | label | seq) ---
   'receipt' is grouped by the receipt condition (key MUST match the receive screen's
   condReasonKey: 'hold' | 'damaged'); 'refuse'/'discrepancy' are single shared lists. */
DECLARE @grp TABLE (domaincode VARCHAR(20), groupkey VARCHAR(40), label NVARCHAR(80), seq INT);
INSERT INTO @grp (domaincode, groupkey, label, seq) VALUES
    ('receipt',     'hold',    N'Hold for inspection', 1),
    ('receipt',     'damaged', N'Damaged at receipt',  2),
    ('refuse',      'all',     N'All refusals',         1),
    ('discrepancy', 'all',     N'All discrepancies',    1);

INSERT INTO dbo.wmsreasongroup (domainid, groupkey, label, seq)
SELECT d.id, s.groupkey, s.label, s.seq
FROM @grp s
JOIN dbo.wmsreasondomain d ON d.code = s.domaincode
WHERE NOT EXISTS (SELECT 1 FROM dbo.wmsreasongroup g WHERE g.domainid = d.id AND g.groupkey = s.groupkey);
GO

/* --- Starter reasons (domain code | groupkey | reasontext | seq) — user-editable on screen --- */
DECLARE @rsn TABLE (domaincode VARCHAR(20), groupkey VARCHAR(40), reasontext NVARCHAR(200), seq INT);
INSERT INTO @rsn (domaincode, groupkey, reasontext, seq) VALUES
    -- receipt / hold  (reasonsFor('receipt','hold') — lots set to Hold for inspection)
    ('receipt','hold',N'Near-expiry — check',1),
    ('receipt','hold',N'Visual defect — verify',2),
    ('receipt','hold',N'Documentation pending',3),
    ('receipt','hold',N'Awaiting QA sample',4),
    -- receipt / damaged  (reasonsFor('receipt','damaged') — lots set to Damaged -> quarantine)
    ('receipt','damaged',N'Crushed / broken',1),
    ('receipt','damaged',N'Temperature excursion',2),
    ('receipt','damaged',N'Seal broken / tampered',3),
    ('receipt','damaged',N'Wet / water damage',4),
    ('receipt','damaged',N'Contaminated / spoiled',5),
    -- refuse / all  (reasonsFor('refuse') — goods kept OUTSIDE the warehouse, no stock minted)
    ('refuse','all',N'Expired on arrival',1),
    ('refuse','all',N'Damaged / unsafe load',2),
    ('refuse','all',N'Wrong goods delivered',3),
    ('refuse','all',N'Temperature excursion',4),
    ('refuse','all',N'Seal broken / tampered',5),
    ('refuse','all',N'No / wrong paperwork',6),
    ('refuse','all',N'Not ordered — no ASN',7),
    ('refuse','all',N'Client instruction to refuse',8),
    -- discrepancy / all  (mandatory when received qty <> ASN line outstanding remainder)
    ('discrepancy','all',N'Short / under-delivered',1),
    ('discrepancy','all',N'Over / extra delivered',2),
    ('discrepancy','all',N'Damaged in transit',3),
    ('discrepancy','all',N'Expired / near expiry',4),
    ('discrepancy','all',N'Count discrepancy',5),
    ('discrepancy','all',N'Contamination / spoilage',6),
    ('discrepancy','all',N'Labelling / barcode error',7),
    ('discrepancy','all',N'Other',8);

INSERT INTO dbo.wmsreason (groupid, reasontext, seq, status)
SELECT g.id, s.reasontext, s.seq, 'active'
FROM @rsn s
JOIN dbo.wmsreasondomain d ON d.code = s.domaincode
JOIN dbo.wmsreasongroup  g ON g.domainid = d.id AND g.groupkey = s.groupkey
WHERE NOT EXISTS (SELECT 1 FROM dbo.wmsreason x WHERE x.groupid = g.id AND x.reasontext = s.reasontext);
GO

/* ============================================================================
   END OF GOODS RECEPTION SEED
   ----------------------------------------------------------------------------
   Seeded: Reason codes consumed by the Goods-Reception screens
     wmsreasondomain — 3  : receipt, refuse, discrepancy
     wmsreasongroup  — 4  : receipt{hold,damaged}, refuse{all}, discrepancy{all}
     wmsreason       — 22 : receipt(4+5), refuse(8), discrepancy(8)
   Re-runnable: each INSERT is guarded by NOT EXISTS on the business unique key
     (domain.code · group(domainid,groupkey) · reason(groupid,reasontext)).

   No operational rows are seeded — ASNs, receipts, LPNs, pallets, inspections,
   GRNs, refusals, txns and attachments are all minted by the receiving flow.
   ============================================================================ */
