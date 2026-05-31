import { describe, expect, it } from 'vitest';

import { createDiscoveryHudModel } from '../../discoveryHudModel.js';

describe('discovery HUD model', () => {
    it('stays hidden when there is no discovery trail activity', () => {
        expect(createDiscoveryHudModel()).toEqual({
            visible: false,
            status: 'empty',
            label: '',
            title: '',
            detail: ''
        });
    });

    it('points players at the next available unordered passport lead', () => {
        const model = createDiscoveryHudModel({
            activeQuests: [{
                type: 'discovery',
                title: 'Starter Trail',
                ordered: false,
                objectives: [
                    {
                        vendorName: 'Vendor One',
                        booth: 'A1',
                        clue: 'Find the repair bench.',
                        goal: 'Ask what needs fixing.',
                        visited: false
                    },
                    {
                        vendorName: 'Vendor Two',
                        booth: 'A2',
                        clue: 'Find the playable demo.',
                        visited: false
                    }
                ]
            }]
        });

        expect(model).toEqual({
            visible: true,
            status: 'active',
            label: 'Passport Lead',
            title: 'Find a Passport Clue',
            detail: '0/2 stamps - Ask what needs fixing.'
        });
    });

    it('labels ordered trails as the next stop after earlier stamps', () => {
        const model = createDiscoveryHudModel({
            activeQuests: [{
                type: 'discovery',
                title: 'Ordered Trail',
                ordered: true,
                objectives: [
                    {
                        vendorName: 'Vendor One',
                        booth: 'A1',
                        clue: 'First clue.',
                        visited: true
                    },
                    {
                        vendorName: 'Vendor Two',
                        booth: 'A2',
                        clue: 'Second clue.',
                        goal: 'Ask about the second stop.',
                        visited: false
                    }
                ]
            }]
        });

        expect(model).toEqual({
            visible: true,
            status: 'ordered',
            label: 'Next Stop',
            title: 'Stop 2 of 2',
            detail: '1/2 stamps - Ask about the second stop.'
        });
    });

    it('uses neutral guidance for generated fallback vendor prompts', () => {
        const model = createDiscoveryHudModel({
            activeQuests: [{
                type: 'discovery',
                title: 'Discovery Passport',
                objectives: [{
                    vendorName: 'Real Vendor Name',
                    booth: 'K13',
                    clue: 'Visit Real Vendor Name at K13 and ask what makes their exhibit stand out.',
                    visited: false
                }]
            }]
        });

        expect(model).toEqual({
            visible: true,
            status: 'active',
            label: 'Passport Lead',
            title: 'Find a Passport Clue',
            detail: '0/1 stamps - Talk to exhibitors and look for a passport stamp.'
        });
    });

    it('keeps a completed passport payoff visible after trail completion', () => {
        const model = createDiscoveryHudModel({
            completedQuests: [{
                type: 'discovery',
                title: 'Starter Trail',
                completed: true,
                completionText: 'Starter trail complete.',
                objectives: [{ vendorName: 'Vendor One', visited: true }]
            }]
        });

        expect(model).toEqual({
            visible: true,
            status: 'complete',
            label: 'Passport Complete',
            title: 'Starter Trail',
            detail: 'Starter trail complete.'
        });
    });
});