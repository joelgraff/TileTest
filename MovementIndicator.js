// MovementIndicator.js
// Handles the movement indicator (reticle) logic for UIManager

class MovementIndicator {
    constructor(scene) {
        this.scene = scene;
        this.graphics = this.scene.add.graphics();
        this.graphics.setDepth(999);
        this.graphics.setVisible(false);
        this.graphics.alpha = 1;
        this.fadeTween = null;
    }

    show(x, y) {
        this.graphics.clear();
        // Draw reticle: circle + crosshair
        this.graphics.lineStyle(4, 0xFFFF00, 1);
        this.graphics.strokeCircle(x, y, 16);
        this.graphics.lineStyle(2, 0xFFFFFF, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(x - 12, y);
        this.graphics.lineTo(x + 12, y);
        this.graphics.moveTo(x, y - 12);
        this.graphics.lineTo(x, y + 12);
        this.graphics.strokePath();
        this.graphics.setVisible(true);
        this.graphics.alpha = 1;
        if (this.fadeTween) {
            this.fadeTween.stop();
            this.fadeTween = null;
        }
    }

    hide() {
        if (this.fadeTween) {
            this.fadeTween.stop();
        }
        this.fadeTween = this.scene.tweens.add({
            targets: this.graphics,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.graphics.setVisible(false);
            }
        });
    }

    handlePointerMove(screenX, screenY, isDown) {
        if (isDown) {
            // Convert screen coordinates to world coordinates
            const worldPoint = this.scene.cameras.main.getWorldPoint(screenX, screenY);
            this.show(worldPoint.x, worldPoint.y);
        } else {
            this.hide();
        }
    }
}

export default MovementIndicator;
