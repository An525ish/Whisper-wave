import { describe, expect, it } from 'vitest';
import { boostLeftLabel, cheapestPerDay, formatRupees, timeLeftLabel } from '../pricing';
import type { PassPlan } from '../../types';

const plans: PassPlan[] = [
  { id: 'day', label: 'Day', days: 1, amountPaise: 1900 },
  { id: 'week', label: 'Week', days: 7, amountPaise: 4900 },
  { id: 'year', label: 'Year', days: 365, amountPaise: 69900 },
];

describe('formatRupees', () => {
  it('shows whole rupees with Indian grouping', () => {
    expect(formatRupees(4900)).toBe('₹49');
    expect(formatRupees(69900)).toBe('₹699');
    expect(formatRupees(1250000)).toBe('₹12,500');
  });
});

describe('cheapestPerDay', () => {
  it('picks the lowest price per day, and nothing for an empty list', () => {
    expect(cheapestPerDay(plans)?.id).toBe('year');
    expect(cheapestPerDay([])).toBeNull();
  });
});

describe('timeLeftLabel', () => {
  const now = Date.parse('2026-01-01T00:00:00Z');
  it('rounds up and pluralises', () => {
    expect(timeLeftLabel('2026-01-01T05:00:00Z', now)).toBe('1 day left');
    expect(timeLeftLabel('2026-01-07T12:00:00Z', now)).toBe('7 days left');
  });
  it('is null when expired, missing or garbage', () => {
    expect(timeLeftLabel('2025-12-31T00:00:00Z', now)).toBeNull();
    expect(timeLeftLabel(null, now)).toBeNull();
    expect(timeLeftLabel('nope', now)).toBeNull();
  });
});

describe('boostLeftLabel', () => {
  const now = Date.parse('2026-01-01T00:00:00Z');
  it('rounds up to whole minutes and is null when over or missing', () => {
    expect(boostLeftLabel('2026-01-01T00:24:00Z', now)).toBe('24 min left');
    expect(boostLeftLabel('2026-01-01T00:00:20Z', now)).toBe('1 min left');
    expect(boostLeftLabel('2025-12-31T23:59:00Z', now)).toBeNull();
    expect(boostLeftLabel(null, now)).toBeNull();
  });
});
