import { describe, expect, it, vi } from 'vitest';

import { renderDialogImageContent, renderDialogTextContent } from '../../dialogContentRenderer.js';

describe('dialog content renderer', () => {
    it('returns null without an image key and otherwise renders a scaled dialog image', () => {
        const setImage = vi.fn();
        const imageObject = {
            setDisplaySize: vi.fn(function (width, height) {
                this.width = width;
                this.height = height;
                return this;
            }),
            setOrigin: vi.fn(function () {
                return this;
            })
        };
        const image = vi.fn(() => imageObject);
        const manager = {
            scene: {
                add: {
                    image
                }
            },
            dialogLayout: {
                setImage
            }
        };

        expect(renderDialogImageContent(manager, { imageKey: null, dialogWidth: 600 })).toBe(null);
        expect(image).not.toHaveBeenCalled();

        const result = renderDialogImageContent(manager, { imageKey: 'npc-1', dialogWidth: 600 });

        expect(image).toHaveBeenCalledWith(0, 0, 'npc-1');
        expect(imageObject.setDisplaySize).toHaveBeenCalledWith(100, 100);
        expect(imageObject.setOrigin).toHaveBeenCalledWith(0.5, 0.5);
        expect(setImage).toHaveBeenCalledWith(imageObject);
        expect(result).toBe(imageObject);
    });

    it('renders dialog text with the capped wrap width and assigns it to the layout', () => {
        const setText = vi.fn();
        const textObject = {
            setOrigin: vi.fn(function () {
                return this;
            })
        };
        const text = vi.fn(() => textObject);
        const manager = {
            scene: {
                add: {
                    text
                }
            },
            dialogLayout: {
                setText
            }
        };

        const result = renderDialogTextContent(manager, { displayText: 'Hello world', dialogWidth: 900 });

        expect(text).toHaveBeenCalledWith(0, 0, 'Hello world', {
            fontSize: '18px',
            fontStyle: 'bold',
            wordWrap: { width: 389 },
            color: '#000',
            align: 'left'
        });
        expect(textObject.setOrigin).toHaveBeenCalledWith(0, 0);
        expect(setText).toHaveBeenCalledWith(textObject);
        expect(result).toBe(textObject);
    });
});