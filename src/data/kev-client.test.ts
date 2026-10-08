import { parseKevCatalog, parseKevEntry } from '@/data/kev-client';
import snapshot from '@/data/kev-snapshot.json';

const row = {
  cveID: 'CVE-2015-5477',
  vendorProject: 'ISC',
  product: 'BIND',
  vulnerabilityName: ' ISC BIND Data Processing Errors Vulnerability',
  dateAdded: '2026-10-08',
  shortDescription: 'ISC BIND contains a data processing errors vulnerability.',
  requiredAction: 'Apply mitigations per vendor instructions.',
  dueDate: '2026-10-11',
  knownRansomwareCampaignUse: 'Unknown',
  notes: 'https://kb.isc.org/article/AA-01272',
  cwes: ['CWE-19'],
};

describe('parseKevEntry', () => {
  it('normalizes a well-formed row', () => {
    expect(parseKevEntry(row)).toEqual({
      cveId: 'CVE-2015-5477',
      vendor: 'ISC',
      product: 'BIND',
      name: 'ISC BIND Data Processing Errors Vulnerability',
      dateAdded: '2026-10-08',
      dueDate: '2026-10-11',
      description: 'ISC BIND contains a data processing errors vulnerability.',
      requiredAction: 'Apply mitigations per vendor instructions.',
      knownRansomware: false,
      notes: 'https://kb.isc.org/article/AA-01272',
      cwes: ['CWE-19'],
    });
  });

  it('reads the ransomware flag case-insensitively', () => {
    expect(parseKevEntry({ ...row, knownRansomwareCampaignUse: 'Known' })?.knownRansomware).toBe(true);
    expect(parseKevEntry({ ...row, knownRansomwareCampaignUse: 'KNOWN' })?.knownRansomware).toBe(true);
  });

  it.each([
    ['a missing CVE id', { ...row, cveID: undefined }],
    ['a malformed CVE id', { ...row, cveID: 'CVE-15-1' }],
    ['a non-ISO due date', { ...row, dueDate: '10/11/2026' }],
    ['a numeric date', { ...row, dateAdded: 20261008 }],
    ['a non-object row', 'CVE-2015-5477'],
    ['null', null],
  ])('rejects %s', (_label, bad) => {
    expect(parseKevEntry(bad)).toBeNull();
  });

  it('keeps only valid CWE ids', () => {
    expect(parseKevEntry({ ...row, cwes: ['CWE-79', 'NVD-CWE-noinfo', 42, 'cwe-20'] })?.cwes).toEqual([
      'CWE-79',
      'CWE-20',
    ]);
  });

  it('strips control characters and caps long fields', () => {
    const entry = parseKevEntry({
      ...row,
      vendorProject: 'Evil\u0000\u001bCorp',
      shortDescription: 'x'.repeat(10_000),
    });
    expect(entry?.vendor).toBe('EvilCorp');
    expect(entry?.description).toHaveLength(4000);
  });

  it('keeps markup as inert text (rendering is plain <Text>)', () => {
    expect(parseKevEntry({ ...row, product: '<img src=x onerror=alert(1)>' })?.product).toBe(
      '<img src=x onerror=alert(1)>',
    );
  });
});

describe('parseKevCatalog', () => {
  it('counts rejected rows instead of throwing', () => {
    const catalog = parseKevCatalog({
      catalogVersion: '2026.10.08',
      vulnerabilities: [row, { nope: true }, row],
    });
    expect(catalog.entries).toHaveLength(2);
    expect(catalog.rejected).toBe(1);
    expect(catalog.catalogVersion).toBe('2026.10.08');
  });

  it('throws on a payload that is not a KEV catalog', () => {
    expect(() => parseKevCatalog({ data: [] })).toThrow(/vulnerabilities/);
    expect(() => parseKevCatalog('<html>maintenance</html>')).toThrow();
  });

  it('parses the bundled snapshot without rejecting anything', () => {
    const catalog = parseKevCatalog(snapshot.kev);
    expect(catalog.entries.length).toBeGreaterThan(0);
    expect(catalog.rejected).toBe(0);
  });
});
