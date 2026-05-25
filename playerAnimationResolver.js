export function resolvePlayerAnimationKey(direction) {
    if (direction.x === 0 && direction.y === 0) {
        return null;
    }

    if (Math.abs(direction.x) > Math.abs(direction.y)) {
        return direction.x > 0 ? 'right' : 'left';
    }

    if (direction.y !== 0) {
        return direction.y > 0 ? 'down' : 'up';
    }

    return 'down';
}