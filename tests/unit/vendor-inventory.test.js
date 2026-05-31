import { describe, expect, it } from 'vitest';

import { getInventoryItemKey, getVendorInventoryItems } from '../../vendorInventory.js';

describe('vendor inventory helpers', () => {
    it('prefers items explicitly keyed to the vendor before filling from domain stock', () => {
        const inventory = getVendorInventoryItems({ id: '105', name: 'Vendor 105' }, [
            { id: 'item_1_1', name: 'Domain Item' },
            { id: 'item_105_1', name: 'Vendor Item One' },
            { id: 'item_105_2', name: 'Vendor Item Two' },
            { id: 'item_2_1', name: 'Other Domain Item' }
        ], { limit: 3 });

        expect(inventory.map(item => item.name)).toEqual([
            'Vendor Item One',
            'Vendor Item Two',
            'Other Domain Item'
        ]);
    });

    it('uses item id before name as the stable inventory key', () => {
        expect(getInventoryItemKey({ id: 'item-1', name: 'Item One' })).toBe('item-1');
        expect(getInventoryItemKey({ name: 'Item Two' })).toBe('Item Two');
    });
});