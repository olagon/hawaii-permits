import { describe, it, expect } from 'vitest';
import { buildChecklist, bookingStatus, hstInstant, addDays, encodeTrip, decodeTrip, remindersForTrip } from '../../app/src/planner.js';
import { fixture } from './fixture.js';

const d = fixture();
const NOW = Date.parse('2026-10-01T00:00:00Z');
const ids = (cl) => cl.items.map((i) => i.permit.id);

describe('booking window math in Pacific/Honolulu', () => {
  it('converts a Hawaiʻi local time to an instant with no daylight saving', () => {
    expect(hstInstant('2026-12-01', '00:00')).toBe('2026-12-01T10:00:00.000Z');
    expect(hstInstant('2026-07-01', '09:30')).toBe('2026-07-01T19:30:00.000Z');
  });
  it('subtracts days across a month boundary', () => {
    expect(addDays('2026-11-05', -30)).toBe('2026-10-06');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });
  it('says not_yet before the window opens and open after', () => {
    const p = d.permitById['county-camp']; // 14 days before at 09:00 HST
    const s = bookingStatus(p, '2026-10-20', NOW);
    expect(s.state).toBe('not_yet');
    expect(s.opensOn).toBe('2026-10-06');
    expect(s.opensAt).toBe('2026-10-06T19:00:00.000Z');
    expect(bookingStatus(p, '2026-10-20', Date.parse('2026-10-06T19:00:00Z')).state).toBe('open');
    expect(bookingStatus(p, '2026-10-20', Date.parse('2026-10-06T18:59:00Z')).state).toBe('not_yet');
  });
  it('is anytime when the permit has no window', () => {
    expect(bookingStatus(d.permitById.parking, '2026-10-20', NOW).state).toBe('anytime');
  });
});

describe('trip checklists', () => {
  const trip = (stops, name = 't') => ({ id: 't1', name, stops });

  it('1. single camping stop lists the camping permit and parking', () => {
    const cl = buildChecklist(trip([{ place: 'a', activities: ['camping'], start: '2026-11-10', end: '2026-11-12' }]), d, NOW);
    expect(ids(cl)).toEqual(['parking', 'state-camp']);
  });
  it('2. dedupes the same permit across two stops and keeps both places', () => {
    const cl = buildChecklist(trip([{ place: 'a', activities: ['camping'], start: '2026-11-10', end: '2026-11-11' }, { place: 'b', activities: ['camping'], start: '2026-11-11', end: '2026-11-12' }]), d, NOW);
    expect(ids(cl).filter((x) => x === 'state-camp')).toHaveLength(1);
    expect(cl.items.find((i) => i.permit.id === 'state-camp').stops.map((s) => s.place.id)).toEqual(['a', 'b']);
  });
  it('3. uses the earliest stop date for the booking window', () => {
    const cl = buildChecklist(trip([{ place: 'b', activities: ['camping'], start: '2026-12-01', end: '2026-12-02' }, { place: 'a', activities: ['camping'], start: '2026-11-10', end: '2026-11-11' }]), d, NOW);
    expect(cl.items.find((i) => i.permit.id === 'state-camp').booking.opensOn).toBe('2026-10-11');
  });
  it('4. adds prerequisites and puts them first', () => {
    const cl = buildChecklist(trip([{ place: 'e', activities: ['hunting'], start: '2026-11-10', end: '2026-11-10' }]), d, NOW);
    expect(ids(cl)[0]).toBe('hunter-ed');
    expect(ids(cl)).toContain('hunt-lic');
    expect(ids(cl)).not.toContain('fish-lic');
    expect(cl.items[0].prerequisiteFor).toEqual(['hunt-lic']);
  });
  it('5. drops a camping permit when the user only hikes', () => {
    const cl = buildChecklist(trip([{ place: 'a', activities: ['hiking'], start: '2026-11-10', end: '2026-11-10' }]), d, NOW);
    expect(ids(cl)).toEqual(['parking']);
  });
  it('6. includes everything when no activities are picked', () => {
    const cl = buildChecklist(trip([{ place: 'e', activities: [], start: '2026-11-10', end: '2026-11-10' }]), d, NOW);
    expect(ids(cl).sort()).toEqual(['fish-lic', 'hunt-lic', 'hunter-ed']);
  });
  it('7. multi island trip warns and lists both islands', () => {
    const cl = buildChecklist(trip([{ place: 'a', activities: ['camping'], start: '2026-11-10', end: '2026-11-11' }, { place: 'c', activities: ['camping'], start: '2026-11-12', end: '2026-11-13' }]), d, NOW);
    expect(cl.islands.sort()).toEqual(['kauai', 'oahu']);
    expect(cl.warnings.some((w) => /2 islands/.test(w.text))).toBe(true);
    expect(cl.warnings.some((w) => /flash flood/i.test(w.text))).toBe(true);
  });
  it('8. warns about max stay', () => {
    const cl = buildChecklist(trip([{ place: 'a', activities: ['camping'], start: '2026-11-10', end: '2026-11-15' }]), d, NOW);
    expect(cl.warnings.some((w) => /up to 3 nights/.test(w.text))).toBe(true);
  });
  it('9. warns about closed and removed places and stale data', () => {
    const cl = buildChecklist(trip([{ place: 'f', activities: [], start: '2026-11-10', end: '2026-11-10' }, { place: 'g', activities: [] }, { place: 'h', activities: [] }]), d, NOW);
    expect(cl.warnings.filter((w) => w.level === 'danger')).toHaveLength(2);
    expect(cl.warnings.some((w) => /out of date/.test(w.text))).toBe(true);
  });
  it('10. orders open windows before ones that open later, soonest first', () => {
    const cl = buildChecklist(trip([{ place: 'd', activities: ['camping', 'day_use'], start: '2026-10-20', end: '2026-10-22' }, { place: 'c', activities: ['camping'], start: '2026-11-20', end: '2026-11-21' }]), d, NOW);
    // backcountry opens 90 days before 10-20 (already open). day-res opens 30 days before 10-20 (open). county-camp opens 11-06 (not yet).
    expect(ids(cl)).toEqual(['backcountry', 'day-res', 'county-camp']);
    expect(cl.items[2].booking.state).toBe('not_yet');
  });
  it('11. ignores unknown places with a warning', () => {
    const cl = buildChecklist(trip([{ place: 'nope', activities: [] }]), d, NOW);
    expect(cl.items).toHaveLength(0);
    expect(cl.warnings[0].text).toMatch(/no longer/);
  });
});

describe('sharing and reminders', () => {
  it('round trips a trip through a share link', () => {
    const t = { id: 'x', name: 'Kauaʻi trip', stops: [{ place: 'c', activities: ['camping'], start: '2026-11-20', end: '2026-11-21' }] };
    const enc = encodeTrip(t);
    expect(enc).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeTrip(enc)).toEqual({ name: 'Kauaʻi trip', stops: t.stops });
    expect(decodeTrip('not-valid')).toBeNull();
  });
  it('builds reminders for windows not yet open and the day before the trip', () => {
    const t = { id: 't1', name: 'T', stops: [{ place: 'c', activities: ['camping'], start: '2099-11-20', end: '2099-11-21' }] };
    const r = remindersForTrip(t, buildChecklist(t, d, NOW));
    expect(r.map((x) => x.type)).toEqual(['booking_opens', 'trip_soon']);
    expect(r[1].at).toBe('2099-11-19T18:00:00.000Z');
  });
});
