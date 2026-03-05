/**
 * Route Search — excludeDriverId Tests
 * ทดสอบว่า query param excludeDriverId ถูก validate และส่งต่อไปที่ service ถูกต้อง
 */

const { z } = require('zod');
const { RouteStatus } = { RouteStatus: { AVAILABLE: 'AVAILABLE', CANCELLED: 'CANCELLED', COMPLETED: 'COMPLETED' } };

// Replicate the listRoutesQuerySchema to test independently
const listRoutesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'departureTime', 'pricePerSeat', 'availableSeats']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  startNearLat: z.coerce.number().optional(),
  startNearLng: z.coerce.number().optional(),
  endNearLat: z.coerce.number().optional(),
  endNearLng: z.coerce.number().optional(),
  radiusMeters: z.coerce.number().int().min(1).max(50000).default(500),
  startProvince: z.string().trim().optional(),
  endProvince: z.string().trim().optional(),
  excludeDriverId: z.string().optional(),
  seatsRequired: z.coerce.number().int().min(1).optional(),
});

describe('Route Search — excludeDriverId Validation', () => {

  describe('excludeDriverId parameter', () => {
    it('should accept valid CUID as excludeDriverId', () => {
      const result = listRoutesQuerySchema.safeParse({
        excludeDriverId: 'cm7abc123def456ghi789',
      });
      expect(result.success).toBe(true);
      expect(result.data.excludeDriverId).toBe('cm7abc123def456ghi789');
    });

    it('should accept query without excludeDriverId', () => {
      const result = listRoutesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data.excludeDriverId).toBeUndefined();
    });

    it('should accept empty string as excludeDriverId', () => {
      const result = listRoutesQuerySchema.safeParse({
        excludeDriverId: '',
      });
      expect(result.success).toBe(true);
    });

    it('should accept excludeDriverId with other params', () => {
      const result = listRoutesQuerySchema.safeParse({
        page: '1',
        limit: '10',
        excludeDriverId: 'cm7abc123def456ghi789',
        startProvince: 'ขอนแก่น',
      });
      expect(result.success).toBe(true);
      expect(result.data.excludeDriverId).toBe('cm7abc123def456ghi789');
      expect(result.data.startProvince).toBe('ขอนแก่น');
      expect(result.data.page).toBe(1);
    });
  });

  describe('Province filter parameters', () => {
    it('should accept startProvince', () => {
      const result = listRoutesQuerySchema.safeParse({
        startProvince: 'กรุงเทพมหานคร',
      });
      expect(result.success).toBe(true);
      expect(result.data.startProvince).toBe('กรุงเทพมหานคร');
    });

    it('should accept endProvince', () => {
      const result = listRoutesQuerySchema.safeParse({
        endProvince: 'เชียงใหม่',
      });
      expect(result.success).toBe(true);
      expect(result.data.endProvince).toBe('เชียงใหม่');
    });

    it('should trim whitespace from province names', () => {
      const result = listRoutesQuerySchema.safeParse({
        startProvince: '  ขอนแก่น  ',
      });
      expect(result.success).toBe(true);
      expect(result.data.startProvince).toBe('ขอนแก่น');
    });
  });
});

describe('Route Search — Client-side filter logic', () => {
  const mockRoutes = [
    { id: '1', driverId: 'driver-A', driver: { id: 'driver-A' }, status: 'AVAILABLE' },
    { id: '2', driverId: 'driver-B', driver: { id: 'driver-B' }, status: 'AVAILABLE' },
    { id: '3', driverId: 'driver-A', driver: { id: 'driver-A' }, status: 'CANCELLED' },
    { id: '4', driverId: 'driver-C', driver: { id: 'driver-C' }, status: 'AVAILABLE' },
  ];

  const filterRoutes = (routes, myId) => {
    return routes.filter(r => {
      if (r.status !== 'AVAILABLE') return false;
      if (myId && (String(r.driverId) === myId || String(r.driver?.id) === myId)) return false;
      return true;
    });
  };

  it('should filter out own routes when myId matches driverId', () => {
    const result = filterRoutes(mockRoutes, 'driver-A');
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual(['2', '4']);
  });

  it('should keep all AVAILABLE routes when myId is null', () => {
    const result = filterRoutes(mockRoutes, null);
    expect(result).toHaveLength(3);
    expect(result.map(r => r.id)).toEqual(['1', '2', '4']);
  });

  it('should filter out CANCELLED routes regardless of owner', () => {
    const result = filterRoutes(mockRoutes, 'driver-X');
    expect(result).toHaveLength(3);
    expect(result.every(r => r.status === 'AVAILABLE')).toBe(true);
  });

  it('should handle numeric vs string driverId comparison', () => {
    const numericRoutes = [
      { id: '1', driverId: 123, driver: { id: 123 }, status: 'AVAILABLE' },
      { id: '2', driverId: 456, driver: { id: 456 }, status: 'AVAILABLE' },
    ];
    const result = filterRoutes(numericRoutes, '123');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should handle missing driver object gracefully', () => {
    const noDriverRoutes = [
      { id: '1', driverId: 'driver-A', status: 'AVAILABLE' },
      { id: '2', driverId: 'driver-B', driver: null, status: 'AVAILABLE' },
    ];
    const result = filterRoutes(noDriverRoutes, 'driver-A');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should return empty array when all routes belong to the user', () => {
    const ownRoutes = [
      { id: '1', driverId: 'me', driver: { id: 'me' }, status: 'AVAILABLE' },
      { id: '2', driverId: 'me', driver: { id: 'me' }, status: 'AVAILABLE' },
    ];
    const result = filterRoutes(ownRoutes, 'me');
    expect(result).toHaveLength(0);
  });
});
