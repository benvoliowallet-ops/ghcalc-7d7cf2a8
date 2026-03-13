import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { ProjectState } from '../../types';
import { PUMP_TABLE, fmtN, calcETNACapacity, NOZZLE_BY_ORIFICE } from '../../utils/calculations';
import { getPipe10mmForSpacing } from '../../data/stockItems';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsiH0C4n.woff', fontWeight: 400 },
  ],
});

const navy = '#002a4c';
const teal = '#00adc6';
const orange = '#f38f00';
const lightGray = '#f4f6f8';
const borderGray = '#dde3ea';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: navy,
    padding: '24 32 24 32',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: teal,
  },
  logoPlaceholder: {
    fontSize: 14,
    fontWeight: 'bold',
    color: navy,
    letterSpacing: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: navy,
    letterSpacing: 1,
  },
  docSub: {
    fontSize: 8,
    color: teal,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: navy,
    padding: '4 8',
    marginBottom: 0,
    marginTop: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  infoGrid: {
    flexDirection: 'row',
    backgroundColor: lightGray,
    borderWidth: 1,
    borderColor: borderGray,
    marginBottom: 0,
  },
  infoCell: {
    flex: 1,
    padding: '6 8',
    borderRightWidth: 1,
    borderRightColor: borderGray,
  },
  infoCellLast: {
    flex: 1,
    padding: '6 8',
  },
  infoLabel: {
    fontSize: 7,
    color: teal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: navy,
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 12,
    marginTop: 2,
  },
  kpi: {
    flex: 1,
    backgroundColor: lightGray,
    borderWidth: 1,
    borderColor: borderGray,
    padding: '6 8',
    marginRight: 4,
    alignItems: 'center',
  },
  kpiLast: {
    flex: 1,
    backgroundColor: lightGray,
    borderWidth: 1,
    borderColor: borderGray,
    padding: '6 8',
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: teal,
  },
  kpiLbl: {
    fontSize: 7,
    color: '#666',
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: navy,
    padding: '4 0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: borderGray,
    minHeight: 18,
    alignItems: 'center',
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: borderGray,
    minHeight: 18,
    alignItems: 'center',
    backgroundColor: lightGray,
  },
  th: {
    fontSize: 7,
    color: '#ffffff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    padding: '0 6',
  },
  td: {
    fontSize: 8,
    color: navy,
    padding: '2 6',
  },
  tdMono: {
    fontSize: 7,
    color: '#666',
    padding: '2 6',
    fontFamily: 'Helvetica',
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: borderGray,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: '#999',
  },
  accentLine: {
    height: 2,
    backgroundColor: orange,
    marginBottom: 0,
  },
  zoneSectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: teal,
    padding: '3 8',
    marginTop: 8,
  },
  zoneSectionTitleText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});

interface ProjectPDFProps {
  snapshot: ProjectState;
  quoteNumber: string;
  customerName: string;
  projectAddress: string;
  country: string;
  contactPerson?: string;
}

export function ProjectPDF({ snapshot, quoteNumber, customerName, projectAddress, country, contactPerson }: ProjectPDFProps) {
  const { zones, zoneCalcs, globalParams } = snapshot;

  const totalArea = zoneCalcs.reduce((s, c) => s + (c?.area ?? 0), 0);
  const totalFlowMlH = zoneCalcs.reduce((s, c) => s + (c?.zoneFlow ?? 0), 0);
  const etnaCapacity = totalFlowMlH / 1e6;
  const totalNozzles = zoneCalcs.reduce((s, c) => s + (c?.numNozzles ?? 0), 0);

  const today = new Date().toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoPlaceholder}>SANFOG</Text>
            <Text style={{ fontSize: 7, color: teal, marginTop: 2 }}>s.r.o.</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>PREHĽAD PROJEKTU</Text>
            <Text style={styles.docSub}>Technická špecifikácia · GreenHouse Calc</Text>
          </View>
        </View>
        <View style={styles.accentLine} />

        {/* Project info */}
        <View style={styles.sectionTitle}><Text>Informácie o projekte</Text></View>
        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Číslo ponuky</Text>
            <Text style={styles.infoValue}>{quoteNumber}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Zákazník</Text>
            <Text style={styles.infoValue}>{customerName || '—'}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Adresa</Text>
            <Text style={styles.infoValue}>{projectAddress || '—'}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Krajina</Text>
            <Text style={styles.infoValue}>{country}</Text>
          </View>
          <View style={styles.infoCellLast}>
            <Text style={styles.infoLabel}>Dátum</Text>
            <Text style={styles.infoValue}>{snapshot.project.quoteDate || today}</Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <View style={styles.kpi}>
            <Text style={styles.kpiVal}>{fmtN(totalArea, 1)} m²</Text>
            <Text style={styles.kpiLbl}>Celková plocha</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiVal}>{totalNozzles} ks</Text>
            <Text style={styles.kpiLbl}>Trysky celkom</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiVal}>{globalParams.numberOfZones}</Text>
            <Text style={styles.kpiLbl}>Počet zón</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiVal}>{fmtN(etnaCapacity, 2)} m³/h</Text>
            <Text style={styles.kpiLbl}>ETNA kapacita</Text>
          </View>
          <View style={styles.kpiLast}>
            <Text style={styles.kpiVal}>{globalParams.systemPressure} bar</Text>
            <Text style={styles.kpiLbl}>Tlak systému</Text>
          </View>
        </View>

        {/* Zone overview */}
        <View style={styles.sectionTitle}><Text>Prehľad zón</Text></View>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>Zóna</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Plocha m²</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Trysky ks</Text>
          <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>Prietok ml/h</Text>
          <Text style={[styles.th, { flex: 2 }]}>Čerpadlo</Text>
        </View>
        {zones.map((zone, i) => {
          const calc = zoneCalcs[i];
          const flowLpm = (calc?.zoneFlow ?? 0) / 1000 / 60;
          const pump = PUMP_TABLE.find(p => p.maxFlow >= flowLpm);
          return (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.td, { flex: 2, fontWeight: 'bold' }]}>{zone.name}</Text>
              <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{fmtN(calc?.area ?? 0, 1)}</Text>
              <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{calc?.numNozzles ?? 0}</Text>
              <Text style={[styles.td, { flex: 1.5, textAlign: 'right' }]}>{fmtN(calc?.zoneFlow ?? 0, 0)}</Text>
              <Text style={[styles.tdMono, { flex: 2 }]}>{pump?.name ?? '—'}</Text>
            </View>
          );
        })}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Sanfog s.r.o. · GreenHouse Calc · Technická špecifikácia bez cien</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Strana ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* BOM pages per zone */}
      {zones.map((zone, zoneIdx) => {
        const calc = zoneCalcs[zoneIdx];
        if (!calc) return null;

        const items: { code: string; name: string; qty: number; unit: string }[] = [];
        const add = (code: string, name: string, qty: number, unit: string) => {
          if (qty > 0) items.push({ code, name, qty, unit });
        };
        const nCode = NOZZLE_BY_ORIFICE[zone.nozzleOrifice];
        add(nCode, `Tryska D${zone.nozzleOrifice}mm AK SS`, calc.numNozzles, 'ks');
        add('NOR 301188', 'Swivel adaptér', calc.numSwivel, 'ks');
        const pipe10mm = getPipe10mmForSpacing(zone.nozzleSpacing);
        add(pipe10mm.code, pipe10mm.name, calc.numPipes10mmTotal, 'ks');
        add('NORMIST 0311002SS-180', 'Fitting SS 180°', calc.numFitting180, 'ks');
        add('NORMIST 0311008SS', 'End plug 10mm SS', calc.numEndPlug, 'ks');
        add('NORMIST 0311001SS', 'Drziak trysky 1 tryska SS', calc.numHolders - calc.numFitting180, 'ks');
        add('ITALINOX', 'Trubka A304 TIG 22×1,5 [SS]', Math.ceil(calc.inoxPipeLength), 'm');
        add('183022000', 'VT Spojka P22F AK [SS]', calc.numInoxConnectors, 'ks');
        add('RACMET 182022000', 'VT T-kus P22F AK [SS]', calc.numTJunctions, 'ks');
        add('snfg.05.0002', 'Dilatácia hydraulická DN25 2m [SS]', calc.numDilations, 'ks');
        add('snfg.05.0014', 'Zostava vyprázdňovania 0-90bar', calc.numDrainAssemblies, 'ks');
        add('MVVMVGG1.2FG1.2FAK', 'Ventil ihlový G1/2F [SS]', calc.numNeedleValves, 'ks');
        add('MVEMKCS2X1PVCW', 'CYSY 2×1 PVC Biely', Math.ceil(calc.cysyLength), 'm');
        add('EKR000001481', 'Rozbočovacia krabica A1', calc.numJunctionBoxes, 'ks');
        add('ESV000001630', 'WAGO svorky 221-413', calc.numWago, 'ks');

        if (items.length === 0) return null;

        return (
          <Page key={zoneIdx} size="A4" style={styles.page}>
            <View style={styles.header}>
              <Text style={styles.logoPlaceholder}>SANFOG</Text>
              <View style={styles.headerRight}>
                <Text style={styles.docTitle}>BOM – {quoteNumber}</Text>
                <Text style={styles.docSub}>Technický zoznam materiálu</Text>
              </View>
            </View>
            <View style={styles.accentLine} />

            <View style={styles.zoneSectionTitle}>
              <Text style={styles.zoneSectionTitleText}>
                ZÓNA {zoneIdx + 1}: {zone.name.toUpperCase()} · {fmtN(calc.area, 1)} m² · {calc.numNozzles} trysky
              </Text>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 2 }]}>Kód</Text>
              <Text style={[styles.th, { flex: 3 }]}>Popis</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Qty</Text>
              <Text style={[styles.th, { flex: 1 }]}>MJ</Text>
            </View>
            {items.map((item, idx) => (
              <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tdMono, { flex: 2 }]}>{item.code}</Text>
                <Text style={[styles.td, { flex: 3 }]}>{item.name}</Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>{fmtN(item.qty, 1)}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{item.unit}</Text>
              </View>
            ))}

            <View style={styles.footer} fixed>
              <Text style={styles.footerText}>Sanfog s.r.o. · GreenHouse Calc · Technická špecifikácia bez cien</Text>
              <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Strana ${pageNumber} / ${totalPages}`} />
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
