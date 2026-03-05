const placeService = require('../services/place.service');

// Mock Prisma
jest.mock('../utils/prisma', () => {
    const savedPlaces = [];
    const recentSearches = [];
    let idCounter = 1;

    return {
        savedPlace: {
            findMany: jest.fn(({ where }) => {
                return Promise.resolve(savedPlaces.filter(p => p.userId === where.userId));
            }),
            findUnique: jest.fn(({ where }) => {
                return Promise.resolve(savedPlaces.find(p => p.id === where.id) || null);
            }),
            upsert: jest.fn(({ where, create, update }) => {
                const existing = savedPlaces.find(
                    p => p.userId === where.userId_label?.userId && p.label === where.userId_label?.label
                );
                if (existing) {
                    Object.assign(existing, update);
                    return Promise.resolve(existing);
                }
                const newPlace = { id: `sp_${idCounter++}`, ...create, createdAt: new Date(), updatedAt: new Date() };
                savedPlaces.push(newPlace);
                return Promise.resolve(newPlace);
            }),
            delete: jest.fn(({ where }) => {
                const idx = savedPlaces.findIndex(p => p.id === where.id);
                if (idx >= 0) return Promise.resolve(savedPlaces.splice(idx, 1)[0]);
                return Promise.reject(new Error('Not found'));
            }),
        },
        recentSearch: {
            findMany: jest.fn(({ where, take }) => {
                const filtered = recentSearches
                    .filter(r => r.userId === where?.userId)
                    .sort((a, b) => b.usedAt - a.usedAt);
                return Promise.resolve(take ? filtered.slice(0, take) : filtered);
            }),
            findFirst: jest.fn(({ where }) => {
                return Promise.resolve(
                    recentSearches.find(r => r.userId === where.userId && r.placeId === where.placeId) || null
                );
            }),
            create: jest.fn(({ data }) => {
                const newSearch = { id: `rs_${idCounter++}`, ...data, usedAt: new Date() };
                recentSearches.push(newSearch);
                return Promise.resolve(newSearch);
            }),
            update: jest.fn(({ where, data }) => {
                const item = recentSearches.find(r => r.id === where.id);
                if (item) Object.assign(item, data);
                return Promise.resolve(item);
            }),
            deleteMany: jest.fn(({ where }) => {
                if (where?.id?.in) {
                    const ids = where.id.in;
                    let count = 0;
                    for (let i = recentSearches.length - 1; i >= 0; i--) {
                        if (ids.includes(recentSearches[i].id)) {
                            recentSearches.splice(i, 1);
                            count++;
                        }
                    }
                    return Promise.resolve({ count });
                }
                // clear all for user
                let count = 0;
                for (let i = recentSearches.length - 1; i >= 0; i--) {
                    if (recentSearches[i].userId === where.userId) {
                        recentSearches.splice(i, 1);
                        count++;
                    }
                }
                return Promise.resolve({ count });
            }),
        },
        // expose arrays for test cleanup  
        _savedPlaces: savedPlaces,
        _recentSearches: recentSearches,
    };
});

const prisma = require('../utils/prisma');

describe('Place Service', () => {
    beforeEach(() => {
        prisma._savedPlaces.length = 0;
        prisma._recentSearches.length = 0;
        jest.clearAllMocks();
    });

    // ─── Saved Places ─────────────────────────────────────────

    describe('getSavedPlaces', () => {
        it('should return empty array when user has no saved places', async () => {
            const result = await placeService.getSavedPlaces('user1');
            expect(result).toEqual([]);
        });

        it('should return saved places for user', async () => {
            prisma._savedPlaces.push(
                { id: 'sp1', userId: 'user1', label: 'บ้าน', name: 'Home' },
                { id: 'sp2', userId: 'user2', label: 'ที่ทำงาน', name: 'Office' }
            );
            const result = await placeService.getSavedPlaces('user1');
            expect(result.length).toBe(1);
            expect(result[0].label).toBe('บ้าน');
        });
    });

    describe('upsertSavedPlace', () => {
        it('should create a new saved place', async () => {
            const data = { label: 'บ้าน', name: 'My Home', lat: 16.47, lng: 102.82 };
            const result = await placeService.upsertSavedPlace('user1', data);
            expect(result.label).toBe('บ้าน');
            expect(result.name).toBe('My Home');
            expect(result.userId).toBe('user1');
        });

        it('should throw 400 if required fields missing', async () => {
            await expect(placeService.upsertSavedPlace('user1', { label: 'บ้าน' }))
                .rejects.toThrow('label, name, lat, lng are required');
        });

        it('should update existing place with same label', async () => {
            const data1 = { label: 'บ้าน', name: 'Old Home', lat: 16.47, lng: 102.82 };
            await placeService.upsertSavedPlace('user1', data1);

            const data2 = { label: 'บ้าน', name: 'New Home', lat: 16.48, lng: 102.83 };
            const result = await placeService.upsertSavedPlace('user1', data2);
            expect(result.name).toBe('New Home');
        });
    });

    describe('deleteSavedPlace', () => {
        it('should delete saved place owned by user', async () => {
            prisma._savedPlaces.push({ id: 'sp1', userId: 'user1', label: 'บ้าน', name: 'Home' });
            await placeService.deleteSavedPlace('user1', 'sp1');
            expect(prisma._savedPlaces.length).toBe(0);
        });

        it('should throw 404 if place not found', async () => {
            await expect(placeService.deleteSavedPlace('user1', 'nonexistent'))
                .rejects.toThrow('Saved place not found');
        });

        it('should throw 403 if not owner', async () => {
            prisma._savedPlaces.push({ id: 'sp1', userId: 'user2', label: 'บ้าน', name: 'Home' });
            await expect(placeService.deleteSavedPlace('user1', 'sp1'))
                .rejects.toThrow('Not your saved place');
        });
    });

    // ─── Recent Searches ──────────────────────────────────────

    describe('getRecentSearches', () => {
        it('should return empty array when no recent searches', async () => {
            const result = await placeService.getRecentSearches('user1');
            expect(result).toEqual([]);
        });
    });

    describe('addRecentSearch', () => {
        it('should add a new recent search', async () => {
            const data = { name: 'KKU', lat: 16.47, lng: 102.82, placeId: 'place123' };
            const result = await placeService.addRecentSearch('user1', data);
            expect(result.name).toBe('KKU');
            expect(result.userId).toBe('user1');
        });

        it('should throw 400 if required fields missing', async () => {
            await expect(placeService.addRecentSearch('user1', { name: 'Test' }))
                .rejects.toThrow('name, lat, lng are required');
        });

        it('should dedup by placeId and update usedAt', async () => {
            prisma._recentSearches.push({
                id: 'rs1', userId: 'user1', name: 'KKU Old', placeId: 'place123',
                lat: 16.47, lng: 102.82, usedAt: new Date('2020-01-01')
            });
            const data = { name: 'KKU New', lat: 16.47, lng: 102.82, placeId: 'place123' };
            await placeService.addRecentSearch('user1', data);
            // Should have called update, not create
            expect(prisma.recentSearch.update).toHaveBeenCalled();
        });
    });

    describe('clearRecentSearches', () => {
        it('should clear all recent searches for user', async () => {
            prisma._recentSearches.push(
                { id: 'rs1', userId: 'user1', name: 'A', usedAt: new Date() },
                { id: 'rs2', userId: 'user1', name: 'B', usedAt: new Date() },
                { id: 'rs3', userId: 'user2', name: 'C', usedAt: new Date() }
            );
            const result = await placeService.clearRecentSearches('user1');
            expect(result.deleted).toBe(2);
            expect(prisma._recentSearches.length).toBe(1);
        });
    });
});
