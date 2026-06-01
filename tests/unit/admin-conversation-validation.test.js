import { describe, expect, it } from 'vitest';

import { analyzeTopicLines, buildMarkerFlowPreview } from '../../adminConversationValidation.js';

describe('admin conversation validation', () => {
    it('builds a clue to topic to verification preview for a matching marker-gated stop', () => {
        const topicAnalysis = analyzeTopicLines([
            'portable_demo | the handwritten placard | That placard is our prompt. | portable_demo | Which phrase is printed on the placard? | Portable Powerhouse | Portable Powerhouse; Pocket Spreadsheet; DOS in Motion'
        ].join('\n'));
        const preview = buildMarkerFlowPreview({
            selectedVendorId: '100',
            trailStops: [{
                id: 'stop-1',
                vendorId: '100',
                clueText: 'Live trail clue 1.',
                goalText: 'Live trail goal 1.',
                completionMarker: 'portable_demo'
            }],
            topics: topicAnalysis.topics
        });

        expect(topicAnalysis.issues).toEqual([]);
        expect(preview.issues).toEqual([]);
        expect(preview.markerStopCount).toBe(1);
        expect(preview.previewItems).toEqual([{
            stopIndex: 0,
            vendorId: '100',
            clueText: 'Live trail clue 1.',
            goalText: 'Live trail goal 1.',
            completionMarker: 'portable_demo',
            topicId: 'portable_demo',
            topicLabel: 'the handwritten placard',
            verificationPrompt: 'Which phrase is printed on the placard?',
            expectedPhrase: 'Portable Powerhouse'
        }]);
    });

    it('surfaces topic line errors for missing fields, duplicate ids, and invalid verification choices', () => {
        const analysis = analyzeTopicLines([
            'portable_demo | the handwritten placard',
            'portable_demo | the handwritten placard | First response | portable_demo | Which phrase is printed on the placard? | Portable Powerhouse | Pocket Spreadsheet; DOS in Motion',
            'portable_demo | the backup placard | Second response'
        ].join('\n'));

        expect(analysis.issues.map(issue => issue.code)).toEqual([
            'too-few-fields',
            'expected-phrase-missing',
            'duplicate-topic-id'
        ]);
        expect(analysis.issues[1].message).toContain('expected phrase');
        expect(analysis.topics).toHaveLength(2);
    });

    it('warns when a marker-gated stop has no match or multiple matching topics', () => {
        const topicAnalysis = analyzeTopicLines([
            'portable_demo_a | first placard | First response | portable_demo',
            'portable_demo_b | second placard | Second response | portable_demo',
            'speaker_corner | speaker corner | Speaker response | speaker_corner'
        ].join('\n'));
        const preview = buildMarkerFlowPreview({
            selectedVendorId: '100',
            trailStops: [{
                id: 'stop-1',
                vendorId: '100',
                clueText: 'Find the portable demo.',
                goalText: 'Goal 1.',
                completionMarker: 'portable_demo'
            }, {
                id: 'stop-2',
                vendorId: '100',
                clueText: 'Find the missing marker.',
                goalText: 'Goal 2.',
                completionMarker: 'missing_marker'
            }],
            topics: topicAnalysis.topics
        });

        expect(topicAnalysis.issues).toEqual([]);
        expect(preview.previewItems).toEqual([]);
        expect(preview.issues.map(issue => issue.code)).toEqual([
            'ambiguous-topic-marker',
            'missing-topic-marker'
        ]);
        expect(preview.issues[0].message).toContain('multiple topics match it');
        expect(preview.issues[1].message).toContain('no topic with that marker');
    });
});