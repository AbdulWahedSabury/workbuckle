import { describe, expect, it } from 'vitest';
import { formatDateTime, fromZonedInputValue, toZonedInputValue } from '@/lib/datetime';
import {
  applicationStatusSchema,
  candidateManualStatusSchema,
  candidateSchema,
  interviewSchema,
  jobSchema,
} from '@/schemas/AdminSchemas';

describe('Cyprus time conversion', () => {
  it.each([
    ['2026-11-12T10:30', '2026-11-12T08:30:00.000Z'], // winter, UTC+2
    ['2026-07-01T09:00', '2026-07-01T06:00:00.000Z'], // summer, UTC+3
    ['2026-10-25T03:30', '2026-10-25T01:30:00.000Z'], // DST ends
  ])('%s → %s and back', (local, utc) => {
    const date = fromZonedInputValue(local);
    expect(date?.toISOString()).toBe(utc);
    expect(toZonedInputValue(date!)).toBe(local);
  });

  it('rejects malformed input and formats for display', () => {
    expect(fromZonedInputValue('2026-11-12 10:30')).toBeNull();
    expect(fromZonedInputValue('')).toBeNull();
    expect(formatDateTime(new Date('2026-11-12T08:30:00Z'))).toBe('12 Nov 2026, 10:30');
  });
});

describe('status schemas', () => {
  it('hired, cancelled and interview are never accepted from the status menu', () => {
    expect(applicationStatusSchema.safeParse('hired').success).toBe(false);
    expect(applicationStatusSchema.safeParse('cancelled').success).toBe(false);
    // Only the employer moves an application to interview, by recording one.
    expect(applicationStatusSchema.safeParse('interview').success).toBe(false);
    expect(applicationStatusSchema.safeParse('submitted').success).toBe(true);
    expect(candidateManualStatusSchema.safeParse('hired').success).toBe(false);
  });

  it('interview: scheduled needs a date; blank date is null', () => {
    expect(interviewSchema.safeParse({ interviewStatus: 'scheduled', interviewAt: '' }).success).toBe(false);
    const ok = interviewSchema.parse({ interviewStatus: 'completed', interviewAt: '', interviewNotes: ' ', employerFeedback: 'Good' });
    expect(ok).toEqual({ interviewStatus: 'completed', interviewAt: null, interviewNotes: null, employerFeedback: 'Good' });
    expect(interviewSchema.safeParse({ interviewStatus: 'bogus' }).success).toBe(false);
  });
});

describe('input schemas', () => {
  it('candidate email is trimmed and lower-cased', () => {
    const parsed = candidateSchema.parse({
      firstName: 'A',
      lastName: 'B',
      phone: '+357 99 123456',
      email: '  Some.One@Example.COM ',
      jobId: crypto.randomUUID(),
    });
    expect(parsed.email).toBe('some.one@example.com');
    expect(parsed.status).toBe('pending');
  });

  it('job openings must be a whole number from 1 to 10,000', () => {
    const base = {
      title: 't', salary: 's', experience: 'e', clientId: crypto.randomUUID(), cityId: crypto.randomUUID(),
      jobTypeId: crypto.randomUUID(), jobCategoryId: crypto.randomUUID(), positionId: crypto.randomUUID(), description: '<p>x</p>',
      responsibilities: '<p>x</p>', requirements: '<p>x</p>', benefits: '<p>x</p>', status: 'draft',
    };
    expect(jobSchema.parse({ ...base, totalPositions: '4' }).totalPositions).toBe(4);
    for (const bad of ['0', '-1', '2.5', 'x', '10001']) {
      expect(jobSchema.safeParse({ ...base, totalPositions: bad }).success, bad).toBe(false);
    }
  });

  it('a job needs a position', () => {
    const base = {
      title: 't', salary: 's', experience: 'e', clientId: crypto.randomUUID(), cityId: crypto.randomUUID(),
      jobTypeId: crypto.randomUUID(), jobCategoryId: crypto.randomUUID(), description: '<p>x</p>',
      responsibilities: '<p>x</p>', requirements: '<p>x</p>', benefits: '<p>x</p>', status: 'draft',
    };
    expect(jobSchema.safeParse(base).success).toBe(false);
    expect(jobSchema.safeParse({ ...base, positionId: crypto.randomUUID() }).success).toBe(true);
  });
});

describe('role sections', async () => {
  const { canView } = await import('@/lib/auth/roles');
  it('client users: jobs and candidates only; no talent pool, no live feed', () => {
    expect(canView('EMPLOYER', 'jobs')).toBe(true);
    expect(canView('EMPLOYER', 'candidates')).toBe(true);
    expect(canView('EMPLOYER', 'people')).toBe(false);
    expect(canView('EMPLOYER', 'notifications')).toBe(false);
    expect(canView('EMPLOYER', 'clients')).toBe(false);
    expect(canView('VIEWER', 'people')).toBe(true);
    expect(canView('ADMIN', 'notifications')).toBe(true);
  });
});
