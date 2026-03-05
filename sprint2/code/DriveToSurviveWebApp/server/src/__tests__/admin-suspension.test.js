/**
 * Admin Suspension — Validation & Logic Tests
 * ทดสอบ Role-based Suspension (TC-4.4 ~ TC-4.8)
 */

describe('Suspension — Role Validation', () => {
  const validRoles = ['passenger', 'driver', 'both'];

  it.each(validRoles)('should accept role "%s"', (role) => {
    expect(validRoles.includes(role)).toBe(true);
  });

  it('should reject invalid role "admin"', () => {
    expect(validRoles.includes('admin')).toBe(false);
  });

  it('should reject empty role', () => {
    expect(validRoles.includes('')).toBe(false);
  });
});

describe('Suspension — Duration Calculation', () => {
  const calculateSuspensionEnd = (durationDays) => {
    if (durationDays === 0) {
      return new Date('2099-12-31T23:59:59.999Z'); // ถาวร
    }
    const end = new Date();
    end.setDate(end.getDate() + durationDays);
    return end;
  };

  it('should set 7-day suspension', () => {
    const end = calculateSuspensionEnd(7);
    const expected = new Date();
    expected.setDate(expected.getDate() + 7);
    expect(end.toDateString()).toBe(expected.toDateString());
  });

  it('should set 30-day suspension', () => {
    const end = calculateSuspensionEnd(30);
    const expected = new Date();
    expected.setDate(expected.getDate() + 30);
    expect(end.toDateString()).toBe(expected.toDateString());
  });

  it('should set 90-day suspension', () => {
    const end = calculateSuspensionEnd(90);
    const expected = new Date();
    expected.setDate(expected.getDate() + 90);
    expect(end.toDateString()).toBe(expected.toDateString());
  });

  it('should set 365-day (1 year) suspension', () => {
    const end = calculateSuspensionEnd(365);
    const expected = new Date();
    expected.setDate(expected.getDate() + 365);
    expect(end.toDateString()).toBe(expected.toDateString());
  });

  it('should set permanent suspension (duration = 0) to far future', () => {
    const end = calculateSuspensionEnd(0);
    expect(end.getFullYear()).toBeGreaterThanOrEqual(2099);
  });
});

describe('Suspension — Role-specific Logic', () => {
  const applySuspension = (user, role, suspendedUntil) => {
    const updated = { ...user };
    if (role === 'passenger' || role === 'both') {
      updated.passengerSuspendedUntil = suspendedUntil;
    }
    if (role === 'driver' || role === 'both') {
      updated.driverSuspendedUntil = suspendedUntil;
    }
    return updated;
  };

  const applyUnsuspend = (user, role) => {
    const updated = { ...user };
    if (role === 'passenger' || role === 'both') {
      updated.passengerSuspendedUntil = null;
    }
    if (role === 'driver' || role === 'both') {
      updated.driverSuspendedUntil = null;
    }
    return updated;
  };

  const baseUser = {
    id: 'user-1',
    passengerSuspendedUntil: null,
    driverSuspendedUntil: null,
  };

  const futureDate = new Date('2026-12-31');

  it('TC-4.4: should suspend only Passenger role', () => {
    const result = applySuspension(baseUser, 'passenger', futureDate);
    expect(result.passengerSuspendedUntil).toEqual(futureDate);
    expect(result.driverSuspendedUntil).toBeNull();
  });

  it('TC-4.5: should suspend only Driver role', () => {
    const result = applySuspension(baseUser, 'driver', futureDate);
    expect(result.passengerSuspendedUntil).toBeNull();
    expect(result.driverSuspendedUntil).toEqual(futureDate);
  });

  it('TC-4.6: should suspend both roles', () => {
    const result = applySuspension(baseUser, 'both', futureDate);
    expect(result.passengerSuspendedUntil).toEqual(futureDate);
    expect(result.driverSuspendedUntil).toEqual(futureDate);
  });

  it('TC-4.7: should unsuspend Passenger role', () => {
    const suspendedUser = {
      ...baseUser,
      passengerSuspendedUntil: futureDate,
      driverSuspendedUntil: futureDate,
    };
    const result = applyUnsuspend(suspendedUser, 'passenger');
    expect(result.passengerSuspendedUntil).toBeNull();
    expect(result.driverSuspendedUntil).toEqual(futureDate); // Driver ยังถูกระงับ
  });

  it('TC-4.7: should unsuspend Driver role', () => {
    const suspendedUser = {
      ...baseUser,
      passengerSuspendedUntil: futureDate,
      driverSuspendedUntil: futureDate,
    };
    const result = applyUnsuspend(suspendedUser, 'driver');
    expect(result.passengerSuspendedUntil).toEqual(futureDate); // Passenger ยังถูกระงับ
    expect(result.driverSuspendedUntil).toBeNull();
  });

  it('TC-4.7: should unsuspend both roles', () => {
    const suspendedUser = {
      ...baseUser,
      passengerSuspendedUntil: futureDate,
      driverSuspendedUntil: futureDate,
    };
    const result = applyUnsuspend(suspendedUser, 'both');
    expect(result.passengerSuspendedUntil).toBeNull();
    expect(result.driverSuspendedUntil).toBeNull();
  });

  it('should not affect unrelated fields', () => {
    const userWithExtra = { ...baseUser, email: 'test@example.com', role: 'PASSENGER' };
    const result = applySuspension(userWithExtra, 'passenger', futureDate);
    expect(result.email).toBe('test@example.com');
    expect(result.role).toBe('PASSENGER');
  });
});

describe('Suspension — Active Check', () => {
  const isSuspended = (suspendedUntil) => {
    if (!suspendedUntil) return false;
    return new Date(suspendedUntil) > new Date();
  };

  it('should return false when suspendedUntil is null', () => {
    expect(isSuspended(null)).toBe(false);
  });

  it('should return false when suspendedUntil is undefined', () => {
    expect(isSuspended(undefined)).toBe(false);
  });

  it('should return true when suspendedUntil is in the future', () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    expect(isSuspended(future)).toBe(true);
  });

  it('should return false when suspendedUntil is in the past', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(isSuspended(past)).toBe(false);
  });

  it('should return true for permanent suspension (2099)', () => {
    expect(isSuspended(new Date('2099-12-31'))).toBe(true);
  });
});
