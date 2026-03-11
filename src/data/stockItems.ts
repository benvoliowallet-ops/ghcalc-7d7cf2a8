// ─── StockItem interface ───────────────────────────────────────────────────
export interface StockItem {
  code: string;
  nameEn: string;
  nameSk: string;
  unit: string;
  unitSk: string;
  price: number | null;
  warehouse: 'ATTI' | 'NORMIST';
}

// ─── Legacy code migration map ─────────────────────────────────────────────
export const LEGACY_CODE_MAP: Record<string, string> = {
  'NORMIST 0311008': '0311008',
  'NORMIST 0311001': 'NOR 0311001',
  'NORMIST 0311001SS': 'NOR 0311001SS',
  'NORMIST 0311002-180': 'NOR 0311002-180',
  'NORMIST 0311002SS-180': 'NOR 0311002SS-180',
  'NORMIST 0311008SS': 'NOR 0311008SS',
  'NORMIST 0311033SS': 'NOR 0311033SS',
  'NORMIST_DANFOSS': 'DNFS22KW',
  'NORMIST_30SS_FILTER': 'MVVUAG2F51MHSSNS',
  'NORMIST 0204013A': 'NOR 0204013A',
  '0204013A': 'NOR 0204013A',
  '204091': 'NOR 204091',
  'NORMIST 204091': 'NOR 204091',
  'NORMIST 204090': 'NOR 204090',
  '0104003-kit': 'NOR 0104003-KIT',
  'NORMIST 201142': 'NOR 201142',
  'NORMIST 201142M': 'NOR 201142M',
  'snfg.0013910012.02': '0013910012.02',
  'NORMIST_UV_4LAMPS': 'snfg.001.0016',
  'NORMIST_UV_6OUTLETS': 'snfg.001.0017',
};

export function migrateStockCode(code: string): string {
  return LEGACY_CODE_MAP[code] ?? code;
}

// ─── Stock items array (ATTI — Part 1/3, items 1–100) ──────────────────────
export const stockItems: StockItem[] = [
  { code: `ORFS214008049`, nameEn: `1″ hydraulic hose ends with stainless steel fittings1 meter in lengthHydraulic hose inner diameter is 13mm1 layer steel wireWorking pressure: 12mpa`, nameSk: `1" hydraulická hadica, rovne koncovky, 1m, nerezove koncovky`, unit: `pcs`, unitSk: `ks`, price: 11.11, warehouse: 'ATTI' },
  { code: `ORFS214008045`, nameEn: `1″ hydraulic hose ends with stainless steel fittings2 meter in lengthHydraulic hose inner diameter is 13mm1 layer steel wireWorking pressure: 12mpa`, nameSk: `1" hydraulická hadica, rovne koncovky, 2m dlzka, nerezove koncovky DN25`, unit: `pcs`, unitSk: `ks`, price: 12.97, warehouse: 'ATTI' },
  { code: `ORFS214008046`, nameEn: `1″ hydraulic hose ends with stainless steel fittings3 meter in lengthHydraulic hose inner diameter is 13mm1 layer steel wireWorking pressure: 12mpa`, nameSk: `1" hydraulická hadica, rovne koncovky, 3m dlzka, nerezove koncovky DN25`, unit: `pcs`, unitSk: `ks`, price: 15.37, warehouse: 'ATTI' },
  { code: `ORFS214008048`, nameEn: `1" Hydraulic hose fittings - stainless steel`, nameSk: `1" srobenie pre hydraulicke hadice - nerez ORFS`, unit: `pcs`, unitSk: `ks`, price: 3.32, warehouse: 'ATTI' },
  { code: `snfg.004.002`, nameEn: `1/2" BSP Female High Pressure Stainless Steel 304 Shut Off Needle Globe Valve J13W-320P Crane Flow Control`, nameSk: `1/2" BSP vnútorný závit, vysokotlakový uzatvárací ihlový ventil z nehrdzavejúcej ocele 304, typ J13W-320P, regulácia prietoku`, unit: `pcs`, unitSk: `ks`, price: 13.93, warehouse: 'ATTI' },
  { code: `ORFS214008044`, nameEn: `1/2 hydraulic hose ends with stainless steel fittings0.6 meter in lengthHydraulic hose inner diameter is 13mm1 layer steel wireWorking pressure: 23mpa`, nameSk: `1/2" hydraulická hadica, rovna koncovka + 90°druha strana, 0,6m dlzka, nerezove koncovky DN12`, unit: `pcs`, unitSk: `ks`, price: 6.61, warehouse: 'ATTI' },
  { code: `ORFS214008043`, nameEn: `1/2 hydraulic hose ends with stainless steel fittings0.7 meter in lengthHydraulic hose inner diameter is 13mm1 layer steel wireWorking pressure: 23mpa`, nameSk: `1/2" hydraulická hadica, rovne koncovky, 0,7m dlzka, nerezove koncovky DN12`, unit: `pcs`, unitSk: `ks`, price: 5.8, warehouse: 'ATTI' },
  { code: `ORFS214008042`, nameEn: `1/2 hydraulic hose ends with stainless steel fittings1 meter in lengthHydraulic hose inner diameter is 13mm1 layer steel wireWorking pressure: 23mpa`, nameSk: `1/2" hydraulická hadica, rovne koncovky, 1m dlzka, nerezove koncovky DN12`, unit: `pcs`, unitSk: `ks`, price: 6.29, warehouse: 'ATTI' },
  { code: `ORFS214008047`, nameEn: `1/2" Hydraulic hose fittingsMaterial: stainless steel - ORFS`, nameSk: `1/2" srobenie pre hydraulicke hadice - nerez ORFS`, unit: `pcs`, unitSk: `ks`, price: 2.5, warehouse: 'ATTI' },
  { code: `V170100`, nameEn: `100 LT 10 BAR EXPANSION VESSEL`, nameSk: `100 lt pn10 tlakova nadoba`, unit: `pcs`, unitSk: `ks`, price: 75.0, warehouse: 'ATTI' },
  { code: `V170200`, nameEn: `200 LT 10 BAR EXPANSION VESSEL`, nameSk: `200 lt pn10 tlaková nádoba`, unit: `pcs`, unitSk: `ks`, price: 130.0, warehouse: 'ATTI' },
  { code: `PT-06.`, nameEn: `3/8" brine tube`, nameSk: `3/8" nizkotlakova hadica`, unit: `m`, unitSk: `m`, price: 0.94, warehouse: 'ATTI' },
  { code: `V170750`, nameEn: `750 lt pn10 Expansion vessel`, nameSk: `750 lt pn10 tlaková nádoba`, unit: `pcs`, unitSk: `ks`, price: 238.813, warehouse: 'ATTI' },
  { code: `SNFG.00001`, nameEn: `Packaging`, nameSk: `Balné`, unit: `pcs`, unitSk: `ks`, price: 5.9765, warehouse: 'ATTI' },
  { code: `snfg.04.0008`, nameEn: `Concrete`, nameSk: `Betón`, unit: `m3`, unitSk: `m3`, price: 60.0, warehouse: 'ATTI' },
  { code: `4072000024`, nameEn: `UNLOADER VALVE VRT100 G1/2F - 19MPa WITH KNOB 170 BAR - 100LPM, IN G1/2" F - OUT G1/2" F`, nameSk: `Bypass ventil VRT100 - 100LPM @170bar, IN G1/2" F - OUT G1/2" F`, unit: `pcs`, unitSk: `ks`, price: 76.43, warehouse: 'ATTI' },
  { code: `SANFOG_COLNICA`, nameEn: `Colné poplatky`, nameSk: `Colné poplatky`, unit: `pcs`, unitSk: `ks`, price: 1400.0, warehouse: 'ATTI' },
  { code: `BS-2162PA/75`, nameEn: `Time controlled Pyrolox charged iron and manganese remove filter`, nameSk: `Časom riadený PYROLOX filter - in-out::2", 2.2 – 4.4 m³/h`, unit: `pcs`, unitSk: `ks`, price: null, warehouse: 'ATTI' },
  { code: `BS-2472PA/75`, nameEn: `Time controlled Pyrolox charged iron and manganese remove filter`, nameSk: `Časovačom riadený PYROLOX filter - in-out:2", 2.8 – 5.6 m³/h,`, unit: `pcs`, unitSk: `ks`, price: null, warehouse: 'ATTI' },
  { code: `BS-3672PA/111`, nameEn: `Time controlled Pyrolox charged iron and manganese remove filter`, nameSk: `Časovo riadený filter s náplňou Pyrolox na odstránenie železa a mangánu`, unit: `pcs`, unitSk: `ks`, price: null, warehouse: 'ATTI' },
  { code: `SANFOG_DIETA`, nameEn: `Diéty`, nameSk: `Diéty`, unit: `deň`, unitSk: `deň`, price: 35.0, warehouse: 'ATTI' },
  { code: `snfg.05.0001`, nameEn: `Expansion hydraulic DN 25 length 1m`, nameSk: `Dilatacia hydraulicka DN 25 dlzka 1m`, unit: `pcs`, unitSk: `ks`, price: 35.4684, warehouse: 'ATTI' },
  { code: `snfg.05.0002`, nameEn: `Expansion hydraulic DN 25 length 2m`, nameSk: `Dilatacia hydraulicka DN 25 dlzka 2m`, unit: `pcs`, unitSk: `ks`, price: 37.3284, warehouse: 'ATTI' },
  { code: `snfg.05.0003`, nameEn: `Expansion hydraulic DN 25 length 3m`, nameSk: `Dilatacia hydraulicka DN 25 dlzka 3m`, unit: `pcs`, unitSk: `ks`, price: 39.7284, warehouse: 'ATTI' },
  { code: `SANFOG_DOPRAVA`, nameEn: `Doprava výjazdy`, nameSk: `Doprava výjazdy`, unit: `pcs`, unitSk: `ks`, price: 150.0, warehouse: 'ATTI' },
  { code: `snfg.05.0004`, nameEn: `Bracket for 1 main line`, nameSk: `Drziak na kratovnicu pre 1 vedenie`, unit: `pcs`, unitSk: `ks`, price: 10.9121, warehouse: 'ATTI' },
  { code: `snfg.05.0005`, nameEn: `Bracket for 2 main lines`, nameSk: `Drziak na kratovnicu pre 2 vedenia`, unit: `pcs`, unitSk: `ks`, price: 11.6595, warehouse: 'ATTI' },
  { code: `snfg.05.0006`, nameEn: `Bracket for a steel truss for 4 lines`, nameSk: `Drziak na kratovnicu pre 4 vedenia`, unit: `pcs`, unitSk: `ks`, price: 13.7276, warehouse: 'ATTI' },
  { code: `snfg.05.0018`, nameEn: `Bracket for a steel truss for 6 lines`, nameSk: `Drziak na kratovnicu pre 6 vedení`, unit: `pcs`, unitSk: `ks`, price: 14.2239, warehouse: 'ATTI' },
  { code: `250038`, nameEn: `Bracket`, nameSk: `Držiak na kratovnicu`, unit: `pcs`, unitSk: `ks`, price: 8.73, warehouse: 'ATTI' },
  { code: `snfg.krat.05.0006`, nameEn: `Bracket`, nameSk: `Držiak na kratovnicu 6 dierok`, unit: `pcs`, unitSk: `ks`, price: 9.57, warehouse: 'ATTI' },
  { code: `BS-2800D2/112`, nameEn: `Duplex, quantity-controlled water softener with RX resin (HE)`, nameSk: `Duplexný dvojstĺpcový, množstvom riadený zmäkčovač vody s náplňou RX (HE)`, unit: `pcs`, unitSk: `ks`, price: 6769.1, warehouse: 'ATTI' },
  { code: `BS-500D1/92`, nameEn: `Twin volume controlled watersoftener with RX contro`, nameSk: `Dvojstlpovy zmakcovac, prietokom riadeny`, unit: `pcs`, unitSk: `ks`, price: 1079.93, warehouse: 'ATTI' },
  { code: `BS-400D1/63`, nameEn: `Twin volume controlled water softener with RX control valve`, nameSk: `Dvojstlpovy zmakcovac, prietokom riadeny`, unit: `pcs`, unitSk: `ks`, price: null, warehouse: 'ATTI' },
  { code: `SVX 201143`, nameEn: `3mm galvanized rope`, nameSk: `EU SELECT Oceľové lano DIN 3055 6x7+FC 3mm`, unit: `m`, unitSk: `m`, price: 0.099, warehouse: 'ATTI' },
  { code: `SVX 84070703`, nameEn: `3mm stainless steel rope`, nameSk: `EU SELECT Nerezové lanko AISI 316 7x7 3mm`, unit: `m`, unitSk: `m`, price: 0.396, warehouse: 'ATTI' },
  { code: `193308070`, nameEn: `EU SELECT Screw DIN 933 8.8 zn M8x70`, nameSk: `EU SELECT Skrutka DIN 933 8.8 zn M8x70`, unit: `pcs`, unitSk: `ks`, price: 0.1642, warehouse: 'ATTI' },
  { code: `214008040`, nameEn: `HAMMER HEAD BOLT WITH CLIP, NUT AND WASHER M 8`, nameSk: `FIXAČNÝ ČAP DO UPEVŇOVACEJ LIŠTY F M8`, unit: `pcs`, unitSk: `ks`, price: 1.5148, warehouse: 'ATTI' },
  { code: `0013910003`, nameEn: `1 1/4" CONNECTION FLEX`, nameSk: `Flexibilná hadica 1 1/4" k tlakovej nádobe`, unit: `pcs`, unitSk: `ks`, price: 17.0, warehouse: 'ATTI' },
  { code: `0013910004`, nameEn: `1" CONNECTION FLEX`, nameSk: `Flexibilná hadica 1" k tlakovej nádobe`, unit: `pcs`, unitSk: `ks`, price: 9.0, warehouse: 'ATTI' },
  { code: `0013910012.`, nameEn: `Connection flex 2" hose`, nameSk: `Flexibilná hadica 2" k tlakovej nadobe`, unit: `pcs`, unitSk: `ks`, price: 24.29, warehouse: 'ATTI' },
  { code: `ORFS12.24294`, nameEn: `Press collar for DN12 hose`, nameSk: `Golier na lisovanie DN12 hadicu`, unit: `pcs`, unitSk: `ks`, price: 1.21, warehouse: 'ATTI' },
  { code: `ORFS19.24295`, nameEn: `Press collar for DN19 hose`, nameSk: `Golier na lisovanie DN19 hadicu`, unit: `pcs`, unitSk: `ks`, price: 1.26, warehouse: 'ATTI' },
  { code: `snfg.004.0014`, nameEn: `Collar for crimping a DN25 hose`, nameSk: `Golier na lisovanie DN25 hadicu`, unit: `pcs`, unitSk: `ks`, price: 1.28, warehouse: 'ATTI' },
  { code: `0881490000B`, nameEn: `1 HF KI-ST 16/3-30 (15m3 30m), all stainless steel pump with inverter`, nameSk: `HF KI-ST 16/3-30 (15m3 30m), kompet nerez so zabudovanym frekvencnym menicom`, unit: `pcs`, unitSk: `ks`, price: 1275.0, warehouse: 'ATTI' },
  { code: `snfg.001.0021`, nameEn: `HF KI-ST 32/2-30 (25 m³/h, 25 m) – complete stainless steel pump set with built-in frequency inverter.`, nameSk: `HF KI-ST 32/2-30 (25m3 25m), komplet nerez so zabudovaným frekvenčným meničom`, unit: `pcs`, unitSk: `ks`, price: 1900.0, warehouse: 'ATTI' },
  { code: `0881690000CX`, nameEn: `HF KI-ST 32/4-75 (35m3 30m)`, nameSk: `HF KI-ST 32/4-75 (35m3 30m), komplet nerez so zabudovanym frekvencnym menicom`, unit: `pcs`, unitSk: `ks`, price: 2275.0, warehouse: 'ATTI' },
  { code: `0801490000.`, nameEn: `HF KO 35/3-55 – complete pump set with built-in frequency inverter, 35 m³/h`, nameSk: `HF KO 35/3-55 so zabudovanýmfrekvenčným meničom 35m3/hod`, unit: `pcs`, unitSk: `ks`, price: 1069.65, warehouse: 'ATTI' },
  { code: `HIDR.002`, nameEn: `Complete hydraulic hose with stainless steel fitting at the end 1"`, nameSk: `Hotova hydraulicka hadica s nerezovym srobenim na konci 1"`, unit: `pcs`, unitSk: `ks`, price: null, warehouse: 'ATTI' },
  { code: `ORFS12.24295`, nameEn: `Hydraulic hose 1 m DN12, 23 MPa`, nameSk: `Hydraulicka hadica 1m DN12 23mpa`, unit: `m`, unitSk: `m`, price: 2.05, warehouse: 'ATTI' },
  { code: `ORFS19.24296`, nameEn: `Hydraulic hose 1 m DN19, 15 MPa`, nameSk: `Hydraulicka hadica 1m DN19 15mpa`, unit: `m`, unitSk: `m`, price: 2.54, warehouse: 'ATTI' },
  { code: `snfg.004.0017`, nameEn: `Hydraulic hose 1 m DN25, 12 MPa`, nameSk: `Hydraulicka hadica 1m DN25, 12Mpa`, unit: `m`, unitSk: `m`, price: 2.68, warehouse: 'ATTI' },
  { code: `HIDR.001`, nameEn: `Hydraulic hose 2SC DN25 / EN 857 SAE 100R16 TURBO BRITOFLEX`, nameSk: `Hydraulicka hadica 2SC DN25 / EN 857 SAE 100R16 TURBO BRITOFLEX`, unit: `m`, unitSk: `m`, price: 9.0, warehouse: 'ATTI' },
  { code: `snfg.001.0003`, nameEn: `Hydraulic press maschine 2"`, nameSk: `Hydraulický lisovací stroj 2"`, unit: `pcs`, unitSk: `ks`, price: 831.0, warehouse: 'ATTI' },
  { code: `KTR000000909`, nameEn: `Chránička káblová RAUTEC 110mm 450N HDPE`, nameSk: `Chránička káblová RAUTEC 110mm 450N HDPE`, unit: `m`, unitSk: `m`, price: 1.562, warehouse: 'ATTI' },
  { code: `KDP000003519`, nameEn: `Cable for temperature and humidity sensor`, nameSk: `Kábel na snímač teploty a vlhkosti`, unit: `m`, unitSk: `m`, price: 0.352, warehouse: 'ATTI' },
  { code: `KOH000000606`, nameEn: `Kábel ohybný H05VV-F 2x1 pvc biely`, nameSk: `Kábel ohybný H05VV-F 2x1 pvc biely`, unit: `m`, unitSk: `m`, price: 0.3672, warehouse: 'ATTI' },
  { code: `KOH000000624`, nameEn: `Kábel ohybný H05VV-F 3G1 pvc biely`, nameSk: `Kábel ohybný H05VV-F 3G1 pvc biely`, unit: `m`, unitSk: `m`, price: 0.4494, warehouse: 'ATTI' },
  { code: `KOH000000603`, nameEn: `Flexible cable H05VV-F 3G1.5 pvc white`, nameSk: `Kábel ohybný H05VV-F 3G1,5 pvc biely`, unit: `m`, unitSk: `m`, price: 0.6419, warehouse: 'ATTI' },
  { code: `KOH000000602`, nameEn: `Kábel ohybný H05VV-F 4G1 pvc biely`, nameSk: `Kábel ohybný H05VV-F 4G1 pvc biely`, unit: `m`, unitSk: `m`, price: 0.5992, warehouse: 'ATTI' },
  { code: `KOH000001237`, nameEn: `Flexible cable YSLY-OZ 2x1 pvc gray`, nameSk: `Kábel ohybný YSLY-OZ 2x1 pvc sivý`, unit: `m`, unitSk: `m`, price: 0.3404, warehouse: 'ATTI' },
  { code: `KOH000001516`, nameEn: `Flexible cable YSLY-OZ 3x1 pvc gray`, nameSk: `Kábel ohybný YSLY-OZ 3x1 pvc sivý`, unit: `m`, unitSk: `m`, price: 0.4797, warehouse: 'ATTI' },
  { code: `357000001`, nameEn: `KIT SUPPORT FOR SUSPENSION BAND`, nameSk: `KIT SUPPORT FOR SUSPENSION BAND`, unit: `pcs`, unitSk: `ks`, price: 1.9012, warehouse: 'ATTI' },
  { code: `231625000`, nameEn: `Wall bracket prof. 41 L=600 mm`, nameSk: `Konzola na stenu prof. 41 L=600 mm`, unit: `pcs`, unitSk: `ks`, price: 13.8, warehouse: 'ATTI' },
  { code: `EKR000001481`, nameEn: `Krabica rozbočovacia A1 80x42x40mm bezvývodiek sivá`, nameSk: `Krabica rozbočovacia A1 80x42x40mm bezvývodiek sivá`, unit: `pcs`, unitSk: `ks`, price: 0.48, warehouse: 'ATTI' },
  { code: `snfg.001.0002`, nameEn: `Hydraulic Hose Manual Stripping Machine`, nameSk: `Manuálny stroj na odizolovanie hydraulických hadíc`, unit: `pcs`, unitSk: `ks`, price: 97.17, warehouse: 'ATTI' },
  { code: `73181692`, nameEn: `Nut with toothed collar Din 6923 type M8`, nameSk: `Matica s ozubeným límcom Din 6923 zn M8`, unit: `pcs`, unitSk: `ks`, price: 0.0341, warehouse: 'ATTI' },
  { code: `4271051`, nameEn: `Vertical pressure vessel with bladder, model MAXIVAREM LS 300 V, PN10, connection 6/4″ (1½″)`, nameSk: `MAXIVAREM LS 300 V PN10 6/4" tlakova nadoba`, unit: `pcs`, unitSk: `ks`, price: 305.02, warehouse: 'ATTI' },
  { code: `OIL 412`, nameEn: `Metabond RACE&CLASSIC 15W50 5 L`, nameSk: `Metabond RACE&CLASSIC 15W50 5 L`, unit: `pcs`, unitSk: `ks`, price: 42.08, warehouse: 'ATTI' },
  { code: `MET 115`, nameEn: `Metabond Universal 250 ml`, nameSk: `Metabond Universal 250 ml`, unit: `pcs`, unitSk: `ks`, price: 24.75, warehouse: 'ATTI' },
  { code: `SANFOG_MAT_1`, nameEn: `Montážny materiál - rezerva A`, nameSk: `Montážny materiál - rezerva A`, unit: `pcs`, unitSk: `ks`, price: 500.0, warehouse: 'ATTI' },
  { code: `SANFOG_MAT_2`, nameEn: `Montážny materiál - rezerva B`, nameSk: `Montážny materiál - rezerva B`, unit: `pcs`, unitSk: `ks`, price: 750.0, warehouse: 'ATTI' },
  { code: `SANFOG_MAT_3`, nameEn: `Montážny materiál - rezerva C`, nameSk: `Montážny materiál - rezerva C`, unit: `pcs`, unitSk: `ks`, price: 1000.0, warehouse: 'ATTI' },
  { code: `SANFOG_MAT_4`, nameEn: `Montážny materiál - rezerva D`, nameSk: `Montážny materiál - rezerva D`, unit: `pcs`, unitSk: `ks`, price: 1500.0, warehouse: 'ATTI' },
  { code: `SANFOG_MAT_5`, nameEn: `Montážny materiál pri stanici A`, nameSk: `Montážny materiál pri stanici A`, unit: `pcs`, unitSk: `ks`, price: 500.0, warehouse: 'ATTI' },
  { code: `SANFOG_MAT_6`, nameEn: `Montážny materiál pri stanici B`, nameSk: `Montážny materiál pri stanici B`, unit: `pcs`, unitSk: `ks`, price: 750.0, warehouse: 'ATTI' },
  { code: `SANFOG_MAT_7`, nameEn: `Montážny materiál pri stanici C`, nameSk: `Montážny materiál pri stanici C`, unit: `pcs`, unitSk: `ks`, price: 1000.0, warehouse: 'ATTI' },
  { code: `SANFOG_MAT_8`, nameEn: `Montážny materiál pri stanici D`, nameSk: `Montážny materiál pri stanici D`, unit: `pcs`, unitSk: `ks`, price: 1500.0, warehouse: 'ATTI' },
  { code: `WFC-2M-100`, nameEn: `Spare filter insert for 2 "filter`, nameSk: `Náhradná filtračná vložka na filter WF-2A-100M`, unit: `pcs`, unitSk: `ks`, price: 34.12, warehouse: 'ATTI' },
  { code: `WFC-3M-100`, nameEn: `Spare filter insert for filter with DN80 connection`, nameSk: `Náhradná filtračná vložka na filter WF-3A-100M`, unit: `pcs`, unitSk: `ks`, price: 44.19, warehouse: 'ATTI' },
  { code: `WFC-5/4-130`, nameEn: `Spare filter insert for 5/4 "filter`, nameSk: `Náhradná filtračná vložka na filter WF-5/4-130M`, unit: `pcs`, unitSk: `ks`, price: 2.86, warehouse: 'ATTI' },
  { code: `WFC-6/4-130`, nameEn: `Spare filter insert for 6/4 "filter`, nameSk: `Náhradná filtračná vložka na filter WF-6/4-130M`, unit: `pcs`, unitSk: `ks`, price: 2.86, warehouse: 'ATTI' },
  { code: `BPONG-001-P2PWE`, nameEn: `Náhradný rukávový filter 1 mic`, nameSk: `Náhradný rukávový filter 1 mic`, unit: `pcs`, unitSk: `ks`, price: 4.67, warehouse: 'ATTI' },
  { code: `BPONG-025-P2PWE`, nameEn: `Náhradný rukávový filter 25 mic`, nameSk: `Náhradný rukávový filter 25 mic`, unit: `pcs`, unitSk: `ks`, price: 4.37, warehouse: 'ATTI' },
  { code: `BPONG-005-P2PWE`, nameEn: `Náhradný rukávový filter 5 mic`, nameSk: `Náhradný rukávový filter 5 mic`, unit: `pcs`, unitSk: `ks`, price: 4.57, warehouse: 'ATTI' },
  { code: `268100304`, nameEn: `Socket S.S. 1" AISI304L`, nameSk: `Nátrubok, nerez 1"`, unit: `pcs`, unitSk: `ks`, price: 3.6512, warehouse: 'ATTI' },
  { code: `268102304`, nameEn: `Socket S.S. 1/2" AISI304L`, nameSk: `Nátrubok, nerez 1/2"`, unit: `pcs`, unitSk: `ks`, price: 1.848, warehouse: 'ATTI' },
  { code: `HPC439`, nameEn: `Tee stainless steel internal thread 3 x 1/2 inch`, nameSk: `Nerezová rozdvojka závit 3 x 1/2 palca - T-kus`, unit: `pcs`, unitSk: `ks`, price: 2.75, warehouse: 'ATTI' },
  { code: `HIDR.4216212`, nameEn: `Stainless steel fittings, G1'' internal thread, swivel union, 60 degree cone connector`, nameSk: `Nerezové spoje, vnútorné G1''závit, otočný spoj, 60-stupňový kužeľový konektor`, unit: `pcs`, unitSk: `ks`, price: 21.38, warehouse: 'ATTI' },
  { code: `SANFOG_PROJEKTO`, nameEn: `Obhliadka + projektovanie`, nameSk: `Obhliadka + projektovanie`, unit: `pcs`, unitSk: `ks`, price: 400.0, warehouse: 'ATTI' },
  { code: `002 91506`, nameEn: `FRS 108-116 4´ M8/M10 Fischer socket`, nameSk: `objímka FRS 108-116 4´ M8/M10 Fischer`, unit: `pcs`, unitSk: `ks`, price: 1.88, warehouse: 'ATTI' },
  { code: `snfg.004.0013`, nameEn: `ORFS female flat seat interlock fitting DN25`, nameSk: `ORFS female spoj na hydraulicku hadicu na lisovanie DN25`, unit: `pcs`, unitSk: `ks`, price: 2.73, warehouse: 'ATTI' },
  { code: `ORFS12.24293`, nameEn: `ORFS female 90°, flat-seat interlock fitting DN12, SS304`, nameSk: `ORFS samica 90°, ploché tesnenie, interlock fiting DN12, SS304`, unit: `pcs`, unitSk: `ks`, price: 2.58, warehouse: 'ATTI' },
  { code: `ORFS19.24293`, nameEn: `ORFS female 90°, flat-seat interlock fitting DN19, SS304`, nameSk: `ORFS samica 90°, ploché tesnenie, interlock fiting DN19, SS304`, unit: `pcs`, unitSk: `ks`, price: 3.61, warehouse: 'ATTI' },
  { code: `ORFS25.24293`, nameEn: `ORFS female 90°, flat-seat interlock fitting DN25, SS304`, nameSk: `ORFS samica 90°, ploché tesnenie, interlock fiting DN25 SS304`, unit: `pcs`, unitSk: `ks`, price: 4.49, warehouse: 'ATTI' },
  { code: `ORFS12.24213`, nameEn: `ORFS female flat seat interlock fitting DN12, SS304`, nameSk: `ORFS samica, ploché tesnenie, interlock fiting DN12, SS304`, unit: `pcs`, unitSk: `ks`, price: 1.87, warehouse: 'ATTI' },
  { code: `ORFS19.24213`, nameEn: `ORFS female flat seat interlock fitting DN12, SS304`, nameSk: `ORFS samica, ploché tesnenie, interlock fiting DN19, SS304`, unit: `pcs`, unitSk: `ks`, price: 2.24, warehouse: 'ATTI' },
  { code: `c19021008`, nameEn: `Podložka pod nity DIN 9021 M8`, nameSk: `Podložka pod nity DIN 9021 M8`, unit: `pcs`, unitSk: `ks`, price: 0.02, warehouse: 'ATTI' },
  { code: `60.5100.15`, nameEn: `SAFETY VALVE VS200/180  G3/4F byp:G1/2F`, nameSk: `Poistny ventil  VS200/180  G3/4F byp:G1/2F`, unit: `pcs`, unitSk: `ks`, price: 74.875, warehouse: 'ATTI' },
  { code: `60.0525.00`, nameEn: `SAFETY VALVE VS220 G3/8F 220 bar, 24 l/min`, nameSk: `Poistny ventil VS220 G3/8F, IN 2 × 3/8" Npt FByPass 3/8" Npt F`, unit: `pcs`, unitSk: `ks`, price: 29.25, warehouse: 'ATTI' },
];

// Backward-compat alias
export const STOCK_ITEMS = stockItems;

// Map orifice → nozzle code
export const NOZZLE_BY_ORIFICE: Record<number, string> = {
  0.15: 'NMC15SS303C-AD',
  0.20: 'NMC20SS303C-AD',
  0.25: 'NMC25S303C-AD',
  0.30: 'NMC30SS303C-AD',
};

// Nozzle flow rates by orifice at typical pressure (ml/h)
export const NOZZLE_FLOW_BY_ORIFICE: Record<number, number> = {
  0.15: 30600,
  0.20: 54000,
  0.25: 84600,
  0.30: 122400,
};

export function getStockItem(code: string): StockItem | undefined {
  return STOCK_ITEMS.find(i => i.code === code);
}

export function getStockPrice(code: string): number {
  return STOCK_ITEMS.find(i => i.code === code)?.price ?? 0;
}

export function getPipe10mmForSpacing(spacingCm: number): { code: string; name: string; price: number } {
  if (spacingCm <= 200) return { code: 'NOR 0311016', name: 'Rura D10x1.5-2000 AK', price: 6.40 };
  if (spacingCm <= 250) return { code: 'NOR 0311017', name: 'Rura D10x1.5-2500 AK', price: 7.36 };
  if (spacingCm <= 300) return { code: 'NOR 0311018', name: 'Rura D10x1.5-3000 AK', price: 8.32 };
  return { code: 'NOR 0311019', name: 'Rura D10x1.5-4000 AK', price: 10.24 };
}
