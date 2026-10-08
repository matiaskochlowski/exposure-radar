import { extractSafeLinks, toSafeLink } from '@/domain/safe-links';

describe('extractSafeLinks', () => {
  it('pulls https links out of semicolon-separated KEV notes', () => {
    const notes =
      'https://kb.isc.org/article/AA-01272 ; https://access.redhat.com/errata/RHSA-2015:1513.html; https://nvd.nist.gov/vuln/detail/CVE-2015-5477';
    expect(extractSafeLinks(notes)).toEqual([
      { url: 'https://kb.isc.org/article/AA-01272', host: 'kb.isc.org' },
      { url: 'https://access.redhat.com/errata/RHSA-2015:1513.html', host: 'access.redhat.com' },
      { url: 'https://nvd.nist.gov/vuln/detail/CVE-2015-5477', host: 'nvd.nist.gov' },
    ]);
  });

  it('strips a "www." prefix from the displayed host only', () => {
    expect(extractSafeLinks('see https://www.cisa.gov/kev.')).toEqual([
      { url: 'https://www.cisa.gov/kev', host: 'cisa.gov' },
    ]);
  });

  it('drops plain http links', () => {
    expect(extractSafeLinks('http://example.com/advisory')).toEqual([]);
  });

  it('never yields script or data URLs', () => {
    expect(extractSafeLinks('javascript:alert(1) data:text/html,<script>x</script>')).toEqual([]);
  });

  it('rejects URLs with embedded credentials', () => {
    expect(toSafeLink('https://user:pass@example.com/')).toBeNull();
  });

  it('rejects hosts without a dot (intranet names, localhost)', () => {
    expect(toSafeLink('https://localhost/admin')).toBeNull();
    expect(toSafeLink('https://intranet/x')).toBeNull();
  });

  it('rejects IP-literal hosts', () => {
    expect(toSafeLink('https://1.2.3.4/payload')).toBeNull();
    expect(toSafeLink('https://[2001:db8::1]/payload')).toBeNull();
  });

  it('keeps balanced parentheses but drops a closing one that belongs to the prose', () => {
    expect(extractSafeLinks('https://en.wikipedia.org/wiki/Log4Shell_(vulnerability)')[0].url).toBe(
      'https://en.wikipedia.org/wiki/Log4Shell_(vulnerability)',
    );
    expect(extractSafeLinks('(see https://example.com/advisory)')[0].url).toBe(
      'https://example.com/advisory',
    );
  });

  it('deduplicates and caps the number of links', () => {
    const many = Array.from({ length: 30 }, (_, i) => `https://example.com/${i % 20}`).join(' ; ');
    const links = extractSafeLinks(many);
    expect(links).toHaveLength(12);
    expect(new Set(links.map((l) => l.url)).size).toBe(12);
  });

  it('returns nothing for empty notes', () => {
    expect(extractSafeLinks('')).toEqual([]);
  });
});
