import type { StockItem } from '../types';

// Stock data from skladove_karty (Sheet1.csv)
export const STOCK_ITEMS: StockItem[] = [
  { code: 'NOR NMC25S303C-AD', name: 'VT Tryska D0.25 Antidrip AK FS', additionalText: 'NOR NMC25S303C-AD', price: 1.23, group: 'Trysky', supplier: 'NORMIST' },
  { code: 'NOR 0311018', name: 'Rura D10x1.5-3000 AK', additionalText: 'NOR 0311018', price: 8.32, group: '10mm trubky', supplier: 'NORMIST' },
  { code: 'NOR 0311017', name: 'Rura D10x1.5-2500 AK', additionalText: 'NOR 0311017', price: 7.36, group: '10mm trubky', supplier: 'NORMIST' },
  { code: 'ATC GOGO SPG-M02 1.5mm', name: 'SPG-M02 1.5mm Ventil EM - solenoid G1/4"F 0-90bar Orifice 1,5mm', additionalText: 'ATC GOGO SPG-M02 1.5mm', price: 15.22, group: 'Drain magnet' },
  { code: 'NOR 311015', name: 'Rura D10x1.5-1500 AK', additionalText: 'NOR 311015', price: 5.44, group: '10mm trubky', supplier: 'NORMIST' },
  { code: 'GRNHVMRD10X15X500AKNS', name: 'Rura D10x1.5-500 AK', additionalText: '', price: 3.52, group: '10mm trubky', supplier: 'NORMIST' },
  { code: 'NMC30SS303C-AD', name: 'NOR NMC30SS303C-AD VT Tryska D0.3 AK NS', additionalText: 'NMC30SS303C-AD', price: 1.23, group: 'Trysky', supplier: 'NORMIST' },
  { code: 'SVX 201143', name: 'EU SELECT Oceľové lano DIN 3055 6x7+FC 3mm', additionalText: 'SVX 201143', price: 0.099, group: 'lano' },
  { code: 'NOR 0301033N', name: 'VT Drziak trysky 1 Tryska koncovy R3/8F NI FM', additionalText: 'NOR 0301033N', price: 1.67, group: 'Trysky' },
  { code: 'NORMIST 201142M', name: 'NOR 201142M Zavesny diel pre stred rur D10 AK NS', additionalText: 'NORMIST 201142M', price: 0.12, group: 'Závesne diely', supplier: 'NORMIST' },
  { code: 'NORMIST 201142', name: 'NOR 201142 Zavesny diel pre drziak trysky D10 AK NS', additionalText: 'NORMIST 201142', price: 0.15, group: 'Závesne diely', supplier: 'NORMIST' },
  { code: 'NORMIST HANGER 40cm', name: 'MVUZTLN400MMAKNS Zavesny diel pre lano 400mm AK NS', additionalText: 'NORMIST HANGER 40cm cena odhad', price: 0.23, group: 'Závesne diely', supplier: 'NORMIST' },
  { code: 'MVUZTLN400MMAKNS', name: 'Závesný diel 400mm AK NS', additionalText: 'NORMIST HANGER 40cm', price: 0.23, group: 'Závesne diely', supplier: 'NORMIST' },
  { code: 'NOR 0104003-KIT', name: 'Spinac tlaku G1/4M 10bar Ak NO KIT', additionalText: 'NOR 0104003-KIT', price: 48.0, group: 'NORMIST Komponenty', supplier: 'NORMIST' },
  { code: '0104003-kit', name: 'Pressure Switch Kit G1/4M 10bar', additionalText: 'NOR 0104003-KIT', price: 48.0, group: 'NORMIST Komponenty', supplier: 'NORMIST' },
  { code: '204091', name: 'Keller Pressure Transmitter 0/160 Bar G1/4M', additionalText: 'NORMIST 204091', price: 71.55, group: 'NORMIST Komponenty', supplier: 'NORMIST' },
  { code: '0204013A', name: 'Solenoid Valve Kit G1/2F 3-100bar 70bar Kit', additionalText: 'NORMIST 0204013A', price: 157.44, group: 'NORMIST Komponenty', supplier: 'NORMIST' },
  { code: '183022000', name: 'VT Spojka P22F AK', additionalText: '183022000', price: 2.836, group: 'Napájacie potrubie komponenty 22mm' },
  { code: 'RACMET 182022000', name: 'VT T-kus P22F AK', additionalText: 'RACMET 182022000', price: 6.81, group: 'Napájacie potrubie 22mm komponenty' },
  { code: 'ITALINOX', name: 'TRUBKA A304 TIG EN 10217-7 22x1,5', additionalText: 'ITALINOX', price: 3.0, group: 'Napájacie potrubie 22mm' },
  { code: 'NOR 0311016', name: 'Rura D10x1.5-2000 AK', additionalText: 'NOR 0311016', price: 6.4, group: '10mm trubky', supplier: 'NORMIST' },
  { code: 'NOR 0311019', name: 'Rura D10x1.5-4000 AK', additionalText: 'NOR 0311019', price: 10.24, group: '10mm trubky', supplier: 'NORMIST' },
  { code: 'NOR 0311012', name: 'Rura D10x1.5-750 AK', additionalText: 'NOR 0311012', price: 4.0, group: '10mm trubky', supplier: 'NORMIST' },
  { code: 'NORMIST 0311033SS', name: 'VT Drziak trysky koncovy 1 Tryska R10F AK', additionalText: 'NOR 0311033SS', price: 2.97, group: '10mm komponenty', supplier: 'NORMIST' },
  { code: 'NORMIST 0311001SS', name: 'VT Drziak trysky 1 Tryska R10F AK', additionalText: 'NOR 0311001SS', price: 3.78, group: '10mm komponenty', supplier: 'NORMIST' },
  { code: 'NORMIST 0311001', name: 'NOR 0311001 VT Drziak trysky 1 Tryska R10F NI', additionalText: 'NORMIST 0311001', price: 2.18, group: '10mm komponenty', supplier: 'NORMIST' },
  { code: 'NORMIST 0311002-180', name: 'NOR 0311002-180 VT Drziak trysky 2 Trysky R10F 180s NI', additionalText: 'NORMIST 0311002-180', price: 2.4, group: '10mm komponenty', supplier: 'NORMIST' },
  { code: 'NORMIST 0311002SS-180', name: 'NOR 0311002SS-180 VT Drziak trysky 2 Trysky R10F 180s SS', additionalText: 'NORMIST 0311002SS-180', price: 2.4, group: '10mm komponenty', supplier: 'NORMIST' },
  { code: 'NORMIST 0311008', name: '10mm konocová záslepka do držiaka trysky', additionalText: 'NORMIST 0311008', price: 0.73, group: '10mm komponenty', supplier: 'NORMIST' },
  { code: 'NORMIST 0311008SS', name: 'NOR 0311008SS 10mm 303 SS konocová záslepka do držiaka trysky', additionalText: 'NORMIST 0311008SS', price: 0.73, group: '10mm komponenty', supplier: 'NORMIST' },
  { code: 'Gripple Plus Medium', name: '14149 Spojka drôtov - stredná, GRIPPLE (2.00-3,25mm)', additionalText: 'Gripple Plus Medium 400kg', price: 1.18, group: 'Gripple komponenty' },
  { code: 'NORMIST 201141', name: 'MVUOGRTOOL GRIPPLE Nastroj', additionalText: 'NORMIST 201141', price: 96.0, group: 'Gripple komponenty' },
  { code: 'AS109R', name: 'Snímač teploty a vlhkosti RS485', additionalText: 'AS109R', price: 70.31, group: 'Snímač RHC' },
  { code: 'NORMIST 204090', name: 'NOR 204090 Snimac tlaku G1/4M 10bar Ak KELLER', additionalText: 'NORMIST 204090', price: 71.55, group: 'NORMIST Komponenty', supplier: 'NORMIST' },
  { code: 'NORMIST 204091', name: 'NOR 204091 Snimac tlaku G1/4M 160bar Ak KELLER', additionalText: 'NORMIST 204091', price: 71.55, group: 'NORMIST Komponenty', supplier: 'NORMIST' },
  { code: 'NORMIST 0204013A', name: 'NOR 0204013A Ventil EM - G1/2F 3-100bar 240V Kit Mo', additionalText: 'NORMIST 0204013A', price: 157.44, group: 'NORMIST Komponenty', supplier: 'NORMIST' },
  { code: 'KOH000000606', name: 'Kábel ohybný H05VV-F 2x1 pvc biely', additionalText: '', price: 0.3672, group: 'Elektro' },
  { code: 'MVEMKCS2X1PVCW', name: 'CYSY 2×1 PVC Biely', additionalText: 'KOH000000606', price: 0.3672, group: 'Elektro' },
  { code: 'EKR000001481', name: 'Krabica rozbočovacia A1 80x42x40mm bezvývodiek sivá', additionalText: '', price: 0.48, group: 'Elektro' },
  { code: 'ESV000001631', name: 'Svorka krabicová 221-412 WAGO 2-pólová', additionalText: 'ESV000001631', price: 0.3326, group: 'Elektro' },
  { code: 'ESV000001630', name: 'WAGO svorky 221-413', additionalText: 'ESV000001630', price: 0.38, group: 'Elektro' },
  { code: 'KDP000003519', name: 'Kábel na snímač teploty a vlhkosti', additionalText: 'Hagard KECCTVS25LSOH', price: 0.352, group: 'Elektro' },
  { code: 'snfg.05.0001', name: 'Dilatacia hydraulicka DN 25 dlzka 1m', additionalText: 'snfg.05.0001', price: 35.468, group: 'Dilatácia' },
  { code: 'snfg.05.0002', name: 'Dilatacia hydraulicka DN 25 dlzka 2m', additionalText: 'snfg.05.0002', price: 37.328, group: 'Dilatácia' },
  { code: 'snfg.05.0003', name: 'Dilatacia hydraulicka DN 25 dlzka 3m', additionalText: 'snfg.05.0003', price: 39.728, group: 'Dilatácia' },
  { code: 'snfg.05.0004', name: 'Drziak na kratovnicu pre 1 vedenie', additionalText: 'snfg.05.0004', price: 10.9121, group: 'Držiak na kratovnicu' },
  { code: 'snfg.05.0005', name: 'Drziak na kratovnicu pre 2 vedenia', additionalText: 'snfg.05.0005', price: 11.6595, group: 'Držiak na kratovnicu' },
  { code: 'snfg.05.0006', name: 'Drziak na kratovnicu pre 4 vedenia', additionalText: 'snfg.05.0006', price: 11.6595, group: 'Držiak na kratovnicu' },
  { code: 'snfg.05.0018', name: 'Drziak na kratovnicu pre 6 vedení', additionalText: 'snfg.05.0018', price: 11.6595, group: 'Držiak na kratovnicu' },
  { code: 'snfg.05.0007', name: 'Zabetónovaný držiak s RACMET profilom, 7cmX65cm - pre jednu trubku', additionalText: 'snfg.05.0007', price: 13.5846, group: 'Zabetónovaný držiak' },
  { code: 'snfg.05.0008', name: 'Zabetónovaný držiak s RACMET profilom, 7cmX65cm - pre dve trubky', additionalText: 'snfg.05.0008', price: 13.5846, group: 'Zabetónovaný držiak' },
  { code: 'snfg.05.0009', name: 'Zabetónovaný držiak s RACMET profilom, 7cmX65cm - pre tri trubky', additionalText: 'snfg.05.0009', price: 13.5846, group: 'Zabetónovaný držiak' },
  { code: 'snfg.05.0010', name: 'Zabetónovaný držiak s RACMET profilom, 7cmX65cm - pre štyri trubky', additionalText: 'snfg.05.0010', price: 13.5846, group: 'Zabetónovaný držiak' },
  { code: 'snfg.05.0011', name: 'Zabetónovaný držiak s RACMET profilom, 7cmX65cm - pre päť trubiek', additionalText: 'snfg.05.0011', price: 13.5846, group: 'Zabetónovaný držiak' },
  { code: 'snfg.05.0012', name: 'Zabetónovaný držiak s RACMET profilom, 7cmX65cm - pre šesť trubiek', additionalText: 'snfg.05.0012', price: 13.5846, group: 'Zabetónovaný držiak' },
  { code: 'snfg.05.0014', name: 'Zostava vyprázdňovanie 0-90bar, 1,5mm orifice AK na 22mm press', additionalText: 'snfg.05.0014', price: 34.4654, group: 'Drain magnet' },
  { code: 'snfg.06.0001', name: 'Prepoj medzi cerpadlom a hlavnym vedenim hydraulika DN 25 dlzka 3m', additionalText: 'snfg.06.0001', price: 39.728, group: 'Prepoj medzi čerpadlom a hlavnym vedenim' },
  { code: 'snfg.004.0017', name: 'Hydraulicka hadica 1m DN25, 12Mpa', additionalText: 'snfg.004.0017', price: 2.68, group: 'Hydraulika' },
  { code: 'snfg.004.00016', name: 'Prepoj hydraulická hadica DN25', additionalText: '', price: 21.38, group: 'Hydraulika' },
  { code: 'MVVMVGG1.2FG1.2FAK', name: 'Ventil ihlový G1/2F', additionalText: 'MVVMVGG1.2FAK', price: 15.0, group: 'Vodárenské komponenty' },
  { code: 'SVX_SS_NEREZ', name: 'EU SELECT Nerezové lano 3mm', additionalText: 'SVX nerez', price: 0.15, group: 'lano' },
  { code: 'snfg.001.0021', name: 'HF KI-ST 32/2-30 (25m3 25m), komplet nerez so zabudovaným frekvenčným meničom', additionalText: 'snfg.001.0021', price: 1.0, group: 'ETNA' },
  { code: 'ETNA_HF_KIST_SS', name: 'ETNA HF KI-ST 32/2-30 SS variant', additionalText: '', price: 1.0, group: 'ETNA' },
  { code: 'ETNA 0881690000CX', name: 'HF KI-ST 32/4-75 (35m3 30m), komplet nerez so zabudovanym frekvencnym menicom', additionalText: 'ETNA 0881690000CX', price: 2.0, group: 'ETNA' },
  { code: 'MAXTRA_300_STANDARD', name: 'MAXIVAREM LS 300 V PN10 6/4" tlakova nadoba ŠTANDARD', additionalText: '', price: 305.02, group: 'Tlaková nádoba' },
  { code: 'MAXTRA_300_SS', name: 'MAXIVAREM LS 300 V PN10 SS variant', additionalText: '', price: 380.0, group: 'Tlaková nádoba' },
  { code: 'MAXTRA CONTROL s.r.o.', name: 'MAXIVAREM LS 300 V PN10 6/4" tlakova nadoba', additionalText: 'MAXTRA CONTROL s.r.o.', price: 305.02, group: 'Tlaková nádoba' },
  { code: 'SNFG.00001', name: 'Balné', additionalText: 'SNFG.00001', price: 350.0, group: 'SANFOG' },
  { code: '4072000024', name: 'Bypass ventil VRT100 - 100LPM @170bar, IN G1/2" F - OUT G1/2" F', additionalText: '4072000024 TECNOMEC', price: 76.43, group: 'Hydraulika' },
  { code: '60.0525.00', name: 'Poistny ventil VS220 G3/8F, IN 2 × 3/8" Npt F', additionalText: '60.0525.00 TECNOMEC', price: 29.25, group: 'Hydraulika' },
  { code: 'GIMEX_HU_DN25', name: 'Hydraulicka hadica 2SC DN25 / EN 857 SAE 100R16', additionalText: 'GIMEX HU', price: 9.0, group: 'Hydraulika' },
  { code: 'NOR 301188', name: 'VT Klb Trysky UNC 10/24 Ni NF', additionalText: 'NOR 301188', price: 1.5, group: 'Trysky (swivel adaptor)' },
  { code: 'NORMIST_UV_4LAMPS', name: 'UV System with 4 Lamps', additionalText: 'NORMIST', price: 1.0, group: 'UV Lampy' },
  { code: 'NORMIST_UV_6OUTLETS', name: 'UV System with 6 Outlets', additionalText: 'NORMIST', price: 1.0, group: 'UV Lampy' },
  { code: 'NORMIST_30SS_FILTER', name: "MVVUAG2F51MHSSNS Filter antikor 30' G2F 36m3/h", additionalText: "NORMIST - 30'' SS Filter Unit with 6 Outlets", price: 1.0, group: 'Filtre' },
  { code: 'Eftech_5mic', name: 'Rukavovy filter 5 μm, priemer 180mm', additionalText: 'Eftech s.r.o.', price: 4.7, group: 'Filtre' },
  { code: 'NORMIST_PUMP_AR42', name: 'NORMIST Čerpadlo AR42 with Control Unit PLC TOUCH SCREEN', additionalText: 'NORMIST', price: 14.0, group: 'NORMIST čerpadlá' },
  { code: 'NORMIST_PUMP_AR55', name: 'NORMIST Čerpadlo AR55 with Control Unit PLC TOUCH SCREEN', additionalText: 'NORMIST', price: 12.0, group: 'NORMIST čerpadlá' },
  { code: 'NORMIST_PUMP_AR65', name: 'NORMIST Čerpadlo AR65 with Control Unit PLC TOUCH SCREEN', additionalText: 'NORMIST', price: 12.0, group: 'NORMIST čerpadlá' },
  { code: 'NORMIST_PUMP_AR70', name: 'NORMIST Čerpadlo AR70 with Control Unit PLC TOUCH SCREEN', additionalText: 'NORMIST', price: 6.0, group: 'NORMIST čerpadlá' },
  { code: 'NORMIST_DANFOSS', name: 'Danfoss HVAC Basic drive frekvenčný menič', additionalText: 'NORMIST TR', price: 954.0, group: 'Čerpadlo diely' },
  { code: 'TELTONIKA_GSM', name: 'Teltonika GSM brána', additionalText: '', price: 200.0, group: 'Elektro' },
  { code: 'SNFG.TLK.001', name: 'Trojcestná armatúra ETNA', additionalText: 'SNFG.TLK.001', price: 150.0, group: 'ETNA' },
  { code: 'NMC15SS303C-AD', name: 'VT Tryska D0.15 AK NS', additionalText: 'NOR NMC15SS303C-AD', price: 1.23, group: 'Trysky', supplier: 'NORMIST' },
  { code: 'NMC20SS303C-AD', name: 'VT Tryska D0.20 AK NS', additionalText: 'NOR NMC20SS303C-AD', price: 1.23, group: 'Trysky', supplier: 'NORMIST' },
  { code: 'NMC25S303C-AD', name: 'VT Tryska D0.25 AK NS', additionalText: 'NOR NMC25S303C-AD', price: 1.23, group: 'Trysky', supplier: 'NORMIST' },
  { code: 'NMC30SS303C-AD', name: 'VT Tryska D0.30 AK NS', additionalText: 'NOR NMC30SS303C-AD', price: 1.23, group: 'Trysky', supplier: 'NORMIST' },
];

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
