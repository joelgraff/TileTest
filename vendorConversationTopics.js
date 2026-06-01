function normalizeText(value, fallback = '') {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeComparableText(value) {
    return normalizeText(value).toLowerCase();
}

function normalizeVerificationChoice(choice) {
    const label = normalizeText(typeof choice === 'string' ? choice : choice?.label);
    const phrase = normalizeText(
        typeof choice === 'string' ? choice : choice?.phrase ?? choice?.value ?? choice?.code,
        label
    );

    if (!label || !phrase) {
        return null;
    }

    return {
        label,
        phrase
    };
}

function normalizeTopicVerification(verification) {
    if (!verification || typeof verification !== 'object') {
        return null;
    }

    const prompt = normalizeText(verification.prompt);
    const expectedPhrase = normalizeText(verification.expectedPhrase ?? verification.expectedCode ?? verification.code);
    const choices = (Array.isArray(verification.choices) ? verification.choices : [])
        .map(normalizeVerificationChoice)
        .filter(Boolean);

    if (!prompt || !expectedPhrase || choices.length === 0) {
        return null;
    }

    return {
        id: normalizeText(verification.id, expectedPhrase),
        prompt,
        expectedPhrase,
        successText: normalizeText(verification.successText, `Verification accepted: ${expectedPhrase}.`),
        failureText: normalizeText(verification.failureText, 'That phrase does not match this stop.'),
        choices
    };
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

    const verification = normalizeTopicVerification(topic.verification);
    if (verification) {
        normalizedTopic.verification = verification;
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

export function createTopicVerificationResult(topic, choice) {
    const verification = normalizeTopicVerification(topic?.verification);
    const selectedChoice = normalizeVerificationChoice(choice);

    if (!verification || !selectedChoice) {
        return null;
    }

    const verified = normalizeComparableText(selectedChoice.phrase) === normalizeComparableText(verification.expectedPhrase);

    return {
        id: verification.id,
        prompt: verification.prompt,
        expectedPhrase: verification.expectedPhrase,
        selectedLabel: selectedChoice.label,
        selectedPhrase: selectedChoice.phrase,
        verified,
        message: verified ? verification.successText : verification.failureText,
        successText: verification.successText,
        failureText: verification.failureText
    };
}

export function createVendorTopicResponseDialogData(topic, { returnButton, verificationButtons = [] }) {
    const textLines = [topic?.response ?? ''];
    if (topic?.verification?.prompt) {
        textLines.push('', topic.verification.prompt);
    }

    return {
        renderMode: 'dom',
        text: textLines.join('\n'),
        buttons: [
            ...(Array.isArray(verificationButtons) ? verificationButtons : []),
            returnButton
        ].filter(Boolean)
    };
}