function createIssue(severity, code, message, lineNumber = null) {
    return {
        severity,
        code,
        message,
        ...(Number.isInteger(lineNumber) ? { lineNumber } : {})
    };
}

function normalizeChoiceList(choiceParts) {
    return choiceParts.join('|')
        .split(';')
        .map(choice => choice.trim())
        .filter(choice => choice.length > 0);
}

function hasMatchingChoice(choices, expectedPhrase) {
    const normalizedPhrase = expectedPhrase.trim().toLowerCase();

    return choices.some(choice => choice.toLowerCase() === normalizedPhrase);
}

export function analyzeTopicLines(inputValue = '') {
    const issues = [];
    const topics = [];
    const seenTopicIds = new Set();
    const lines = String(inputValue)
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

    for (const [index, line] of lines.entries()) {
        const lineNumber = index + 1;
        const parts = line.split('|').map(part => part.trim());

        if (parts.length < 3) {
            issues.push(createIssue('error', 'too-few-fields', `Topic line ${lineNumber} requires topic id, label, and response.`, lineNumber));
            continue;
        }

        const [
            topicId = '',
            label = '',
            response = '',
            completionMarker = '',
            verificationPrompt = '',
            expectedPhrase = '',
            ...choiceParts
        ] = parts;

        if (!topicId || !label || !response) {
            issues.push(createIssue('error', 'missing-required-fields', `Topic line ${lineNumber} requires topic id, label, and response.`, lineNumber));
            continue;
        }

        if (seenTopicIds.has(topicId)) {
            issues.push(createIssue('error', 'duplicate-topic-id', `Topic line ${lineNumber} duplicates topic id "${topicId}".`, lineNumber));
        }

        seenTopicIds.add(topicId);

        const choices = normalizeChoiceList(choiceParts);
        const hasVerification = Boolean(verificationPrompt || expectedPhrase || choices.length > 0);
        const topic = {
            id: topicId,
            label,
            response
        };

        if (completionMarker) {
            topic.completionMarker = completionMarker;
        }

        if (hasVerification) {
            if (!completionMarker) {
                issues.push(createIssue('error', 'missing-completion-marker', `Topic line ${lineNumber} requires a completion marker when verification fields are provided.`, lineNumber));
            }

            if (!verificationPrompt || !expectedPhrase || choices.length === 0) {
                issues.push(createIssue('error', 'missing-verification-fields', `Topic line ${lineNumber} requires a verification prompt, expected phrase, and at least one choice.`, lineNumber));
            }

            if (expectedPhrase && choices.length > 0 && !hasMatchingChoice(choices, expectedPhrase)) {
                issues.push(createIssue('error', 'expected-phrase-missing', `Topic line ${lineNumber} must include the expected phrase in the choice list.`, lineNumber));
            }

            topic.verification = {
                ...(verificationPrompt ? { prompt: verificationPrompt } : {}),
                ...(expectedPhrase ? { expectedPhrase } : {}),
                ...(choices.length > 0 ? { choices } : {})
            };
        }

        topics.push(topic);
    }

    return { topics, issues };
}

export function buildMarkerFlowPreview({ selectedVendorId = '', trailStops = [], topics = [] } = {}) {
    const issues = [];
    const previewItems = [];
    const markerStops = Array.isArray(trailStops)
        ? trailStops
            .map((stop, index) => ({ stop, index }))
            .filter(({ stop }) => (
                stop
                && stop.vendorId === selectedVendorId
                && typeof stop.completionMarker === 'string'
                && stop.completionMarker.trim().length > 0
            ))
        : [];
    const topicsByMarker = new Map();

    for (const topic of Array.isArray(topics) ? topics : []) {
        if (!topic?.completionMarker) {
            continue;
        }

        const marker = topic.completionMarker.trim();
        const markerTopics = topicsByMarker.get(marker) ?? [];

        markerTopics.push(topic);
        topicsByMarker.set(marker, markerTopics);
    }

    for (const { stop, index } of markerStops) {
        const matches = topicsByMarker.get(stop.completionMarker) ?? [];

        if (matches.length === 1) {
            const [matchedTopic] = matches;

            previewItems.push({
                stopIndex: index,
                vendorId: stop.vendorId,
                clueText: stop.clueText ?? '',
                goalText: stop.goalText ?? '',
                completionMarker: stop.completionMarker,
                topicId: matchedTopic.id,
                topicLabel: matchedTopic.label,
                verificationPrompt: matchedTopic.verification?.prompt ?? '',
                expectedPhrase: matchedTopic.verification?.expectedPhrase ?? ''
            });
            continue;
        }

        if (matches.length === 0) {
            issues.push(createIssue(
                'warning',
                'missing-topic-marker',
                `Trail stop ${index + 1} uses marker "${stop.completionMarker}", but the selected vendor has no topic with that marker.`
            ));
            continue;
        }

        issues.push(createIssue(
            'warning',
            'ambiguous-topic-marker',
            `Trail stop ${index + 1} uses marker "${stop.completionMarker}", but multiple topics match it: ${matches.map(topic => topic.label || topic.id).join(', ')}.`
        ));
    }

    return {
        issues,
        previewItems,
        markerStopCount: markerStops.length
    };
}