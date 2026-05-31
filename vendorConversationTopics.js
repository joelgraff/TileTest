function normalizeText(value, fallback = '') {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeTopic(topic) {
    if (!topic || typeof topic !== 'object') {
        return null;
    }

    const id = normalizeText(topic.id);
    const label = normalizeText(topic.label);
    const response = normalizeText(topic.response);

    if (!id || !label || !response) {
        return null;
    }

    const normalizedTopic = {
        id,
        label,
        response
    };

    const completionMarker = normalizeText(topic.completionMarker);
    if (completionMarker) {
        normalizedTopic.completionMarker = completionMarker;
    }

    return normalizedTopic;
}

export function normalizeVendorConversationTopics(topics = []) {
    const normalizedTopics = [];
    const seenTopicIds = new Set();

    for (const topic of Array.isArray(topics) ? topics : []) {
        const normalizedTopic = normalizeTopic(topic);
        if (!normalizedTopic || seenTopicIds.has(normalizedTopic.id)) {
            continue;
        }

        seenTopicIds.add(normalizedTopic.id);
        normalizedTopics.push(normalizedTopic);
    }

    return normalizedTopics;
}

export function createVendorTopicResponseDialogData(topic, { returnButton }) {
    return {
        renderMode: 'dom',
        text: topic?.response ?? '',
        buttons: [returnButton]
    };
}