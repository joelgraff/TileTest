import { describe, expect, it, vi } from 'vitest';

import UIManager from '../../uiManager.js';

describe('UIManager inventory dialog', () => {
    it('opens inventory as a read-only dialog during stabilization', () => {
        const showDialog = vi.fn();
        const context = {
            inventory: [{
                name: 'Test Item',
                description: 'A fixture item',
                value: 5
            }],
            isInventoryOpen: false,
            showDialog,
            closeDialog: vi.fn()
        };

        UIManager.prototype.toggleInventory.call(context);

        expect(context.isInventoryOpen).toBe(true);
        expect(showDialog).toHaveBeenCalledTimes(1);
        expect(showDialog.mock.calls[0][0].buttons).toEqual([]);
    });

    it('adds a new item once and increments score', () => {
        const addScore = vi.fn();
        const context = {
            inventory: [],
            maxInventorySlots: 8,
            addScore,
            hasItem: UIManager.prototype.hasItem
        };

        const item = { id: 'item-1', name: 'Test Item', value: 12 };
        const added = UIManager.prototype.addItem.call(context, item);

        expect(added).toBe(true);
        expect(context.inventory).toEqual([item]);
        expect(addScore).toHaveBeenCalledWith(12);
    });

    it('rejects duplicate items without changing score', () => {
        const addScore = vi.fn();
        const item = { id: 'item-1', name: 'Test Item', value: 12 };
        const context = {
            inventory: [item],
            maxInventorySlots: 8,
            addScore,
            hasItem: UIManager.prototype.hasItem
        };

        const added = UIManager.prototype.addItem.call(context, item);

        expect(added).toBe(false);
        expect(context.inventory).toEqual([item]);
        expect(addScore).not.toHaveBeenCalled();
    });

    it('rejects new items when inventory is full', () => {
        const addScore = vi.fn();
        const context = {
            inventory: Array.from({ length: 2 }, (_, index) => ({ id: `item-${index}`, name: `Item ${index}` })),
            maxInventorySlots: 2,
            addScore,
            hasItem: UIManager.prototype.hasItem
        };

        const added = UIManager.prototype.addItem.call(context, { id: 'item-3', name: 'Item 3', value: 5 });

        expect(added).toBe(false);
        expect(context.inventory).toHaveLength(2);
        expect(addScore).not.toHaveBeenCalled();
    });

    it('exposes vendor item collection as one facade for duplicate handling', () => {
        const addScore = vi.fn();
        const item = { id: 'item-1', name: 'Test Item', value: 12 };
        const questManager = {
            checkItemCollection: vi.fn()
        };
        const context = {
            inventory: [item],
            maxInventorySlots: 8,
            addScore,
            questManager,
            hasItem: UIManager.prototype.hasItem,
            addItem: UIManager.prototype.addItem
        };

        const result = UIManager.prototype.collectVendorItem.call(context, item, 'vendor-1');

        expect(result).toEqual({
            status: 'duplicate',
            message: 'You already collected Test Item.'
        });
        expect(questManager.checkItemCollection).not.toHaveBeenCalled();
        expect(addScore).not.toHaveBeenCalled();
    });

    it('reports inventory-full through the vendor item facade', () => {
        const addScore = vi.fn();
        const questManager = {
            checkItemCollection: vi.fn()
        };
        const context = {
            inventory: Array.from({ length: 2 }, (_, index) => ({ id: `item-${index}`, name: `Item ${index}` })),
            maxInventorySlots: 2,
            addScore,
            questManager,
            hasItem: UIManager.prototype.hasItem,
            addItem: UIManager.prototype.addItem
        };

        const result = UIManager.prototype.collectVendorItem.call(context, { id: 'item-3', name: 'Item 3', value: 5 }, 'vendor-1');

        expect(result).toEqual({
            status: 'inventory-full',
            message: 'Inventory full. Make room before taking Item 3.'
        });
        expect(questManager.checkItemCollection).not.toHaveBeenCalled();
        expect(addScore).not.toHaveBeenCalled();
    });

    it('updates quest progress through the vendor item facade after a successful add', () => {
        const addScore = vi.fn();
        const questManager = {
            checkItemCollection: vi.fn(() => true)
        };
        const context = {
            inventory: [],
            maxInventorySlots: 8,
            addScore,
            questManager,
            hasItem: UIManager.prototype.hasItem,
            addItem: UIManager.prototype.addItem
        };
        const item = { id: 'item-1', name: 'Quest Item', value: 12 };

        const result = UIManager.prototype.collectVendorItem.call(context, item, 'vendor-1');

        expect(result).toEqual({
            status: 'quest-updated',
            message: 'Collected Quest Item!\n\nQuest progress updated!'
        });
        expect(context.inventory).toEqual([item]);
        expect(addScore).toHaveBeenCalledWith(12);
        expect(questManager.checkItemCollection).toHaveBeenCalledWith('Quest Item', 'vendor-1');
    });
});