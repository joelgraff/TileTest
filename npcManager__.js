import CONFIG from './config.js';

class NPCManager {
    static subdivideRectangle(width, height, n) {
        let rectangles = [];
        
        for (let i = 0; i < n; i++) {
            rectangles.push({ x: 0, y: 0, width: width, height: height });
        }

        let w, h, half_w, oddflag, x_offset, y_offset, start_offset;

        w = width / (n/2);
        half_w = w / 2;
        h = height / 2;
        x_offset = 0;
        y_offset = 0;
        oddflag = (n % 2 == 1);
        start_offset = 0;

        for (let i = 0; i < n; i++) {
            
            //test for odd number.
            if (i==0 && oddflag==true) {

                x_offset = half_w;
                rectangles[0].width = half_w;
                rectangles[0].height = height;
                rectangles[0].x = 0;

            }
            else {

                rectangles[i].width = w;
                rectangles[i].height = h;
                rectangles[i].x = x_offset;
                x_offset += w;
            }

            rectangles[i].y = y_offset;

            if (x_offset + half_w >= width) {
                x_offset = half_w;
                y_offset = h;
            }

        }

        return rectangles;
    }

    static createNPCs(scene) {
        // Create global animations for all NPCs once
        CONFIG.NPC.SPRITES.forEach(spriteKey => {
            scene.anims.create({
                key: `down-${spriteKey}`,
                frames: scene.anims.generateFrameNumbers(spriteKey, { frames: [0, 1, 2, 3] }),
                frameRate: 6, // Slower animation speed
                repeat: -1
            });
            scene.anims.create({
                key: `left-${spriteKey}`,
                frames: scene.anims.generateFrameNumbers(spriteKey, { frames: [4, 5, 6, 7] }),
                frameRate: 6, // Slower animation speed
                repeat: -1
            });
            scene.anims.create({
                key: `right-${spriteKey}`,
                frames: scene.anims.generateFrameNumbers(spriteKey, { frames: [8, 9, 10, 11] }),
                frameRate: 6, // Slower animation speed
                repeat: -1
            });
            scene.anims.create({
                key: `up-${spriteKey}`,
                frames: scene.anims.generateFrameNumbers(spriteKey, { frames: [12, 13, 14, 15] }),
                frameRate: 6, // Slower animation speed
                repeat: -1
            });
        });

        const npcAreaLayer = scene.map.getObjectLayer('npc_area');
        if (!npcAreaLayer || npcAreaLayer.objects.length === 0) {
            console.error('npc_area object layer not found or empty in map.');
            return;
        }

        const npcArea = npcAreaLayer.objects[0]; // Assumes one rectangle defining the area
        const numNPCs = 5; // Adjust as needed

        // Subdivide npc_area into regions for each NPC
        const subRegions = this.subdivideRectangle(npcArea.width, npcArea.height, numNPCs);

        scene.npcGroup = scene.physics.add.group();

        subRegions.forEach((region, i) => {
            const spriteKey = CONFIG.NPC.SPRITES[Math.floor(Math.random() * CONFIG.NPC.SPRITES.length)];

            let x, y, attempts = 0;
            let isOverlapping = true;
            while (isOverlapping && attempts < 100) {
                // Spawn within assigned region
                x = region.x + Math.random() * (region.width - CONFIG.PLAYER.FRAME_WIDTH) + npcArea.x;
                y = region.y + Math.random() * (region.height - CONFIG.PLAYER.FRAME_HEIGHT) + npcArea.y;
                attempts++;

                // Temporary sprite for overlap check
                const tempSprite = scene.physics.add.sprite(x, y, spriteKey, 0);
                tempSprite.setSize(CONFIG.PLAYER.DEFAULT_SIZE.width, CONFIG.PLAYER.DEFAULT_SIZE.height);
                tempSprite.setOffset(CONFIG.PLAYER.DEFAULT_SIZE.offsetX, CONFIG.PLAYER.DEFAULT_SIZE.offsetY);

                isOverlapping = scene.physics.overlap(tempSprite, scene.npcGroup) || scene.physics.overlap(tempSprite, scene.collisionGroup);

                tempSprite.destroy(); // Clean up temp sprite
            }

            if (attempts >= 100) {
                console.warn(`Failed to find non-overlapping spawn position for NPC ${i} after 100 attempts.`);
                return;
            }

            const npc = scene.physics.add.sprite(x, y, spriteKey, 0);
            npc.setDepth(1); // Same as player
            npc.setBounce(0); // Remove bounce
            npc.setDrag(0); // Remove drag

            // Assign home region center
            npc.home = {
                x: npcArea.x + region.x + region.width / 2,
                y: npcArea.y + region.y + region.height / 2
            };
            console.log(i, region.x, region.y, region.width, region.height);
            // Reuse player's collision boxes
            npc.collisionBoxes = scene.player.collisionBoxes;

            // Initial state
            npc.setFrame(0);
            npc.setVelocity(0, 0);
            npc.nextChange = scene.time.now + Math.random() * 1000;
            npc.currentAnimKey = null;

            // Delay final positioning
            scene.time.delayedCall(0, () => {
                if (scene.physics.overlap(npc, scene.collisionGroup)) {
                    const overlap = scene.physics.closest(npc, scene.collisionGroup.getChildren());
                    if (overlap) {
                        const dx = npc.x - overlap.x;
                        const dy = npc.y - overlap.y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const nudgeDist = 5;
                        npc.x += (dx / dist) * nudgeDist;
                        npc.y += (dy / dist) * nudgeDist;
                        npc.body.reset(npc.x, npc.y);
                        console.log(`NPC ${npc.texture.key} position-nudged out of collision at (${x}, ${y})`);
                    }
                }
                scene.npcGroup.add(npc);
            });
        });
        
        // Store subRegions for debug drawing
        scene.subRegions = subRegions.map(region => ({
            
            x: npcArea.x + region.x,
            y: npcArea.y + region.y,
            width: region.width,
            height: region.height
        }));

        // Set up collisions
        scene.physics.add.collider(scene.npcGroup, scene.collisionGroup, (npc, collisionObj) => {
            npc.setVelocity(0, 0);
            npc.anims.stop();
            npc.setFrame(0);
            npc.nextChange = scene.time.now + (Math.random() * 3000 + 2000);
            npc.currentAnimKey = null;
        });
        scene.physics.add.collider(scene.player, scene.npcGroup);
        scene.physics.add.collider(scene.npcGroup, scene.npcGroup, (npc1, npc2) => {
            npc1.setVelocity(0, 0);
            npc1.anims.stop();
            npc1.setFrame(0);
            npc1.nextChange = scene.time.now + (Math.random() * 1500 + 500);
            npc1.currentAnimKey = null;

            npc2.setVelocity(0, 0);
            npc2.anims.stop();
            npc2.setFrame(0);
            npc2.nextChange = scene.time.now + (Math.random() * 1500 + 500);
            npc2.currentAnimKey = null;

            const dx = npc1.x - npc2.x;
            const dy = npc1.y - npc2.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const nudgeDist = 5;
            npc1.x += (dx / dist) * nudgeDist;
            npc1.y += (dy / dist) * nudgeDist;
            npc1.body.reset(npc1.x, npc1.y);

            npc2.x -= (dx / dist) * nudgeDist;
            npc2.y -= (dy / dist) * nudgeDist;
            npc2.body.reset(npc2.x, npc2.y);
        });
    }

    static handleNPCMovements(scene) {
        if (!scene.npcGroup) return;

        const npcAreaLayer = scene.map.getObjectLayer('npc_area');
        const npcArea = npcAreaLayer.objects[0];
        const minSpeed = 10; // Threshold for stopping movement
        const wanderRange = 32; // Max distance from home to wander

        // Draw subregion borders in debug mode
        if (scene.debugEnabled && scene.subRegions) {
            const graphics = scene.add.graphics();
            graphics.lineStyle(2, 0xff0000); // Red lines
            scene.subRegions.forEach(region => {
                graphics.strokeRect(region.x, region.y, region.width, region.height);
            });
            graphics.setDepth(10); // Above other elements
        }

        scene.npcGroup.getChildren().forEach(npc => {
            if (scene.time.now > npc.nextChange) {
                const choices = ['up', 'down', 'left', 'right', 'stop'];
                const dx = npc.home.x - npc.x;
                const dy = npc.home.y - npc.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Bias towards home if too far
                let choice;
                if (dist > wanderRange) {
                    if (Math.abs(dx) > Math.abs(dy)) {
                        choice = dx > 0 ? 'right' : 'left';
                    } else {
                        choice = dy > 0 ? 'down' : 'up';
                    }
                    choices.unshift(choice, choice); // Double weight for home direction
                } else {
                    choice = choices[Math.floor(Math.random() * choices.length)];
                }

                npc.setVelocity(0, 0);
                npc.anims.stop();
                npc.setFrame(0); // Reset to idle frame
                npc.currentAnimKey = null;

                if (choice !== 'stop') {
                    const animKey = `${choice}-${npc.texture.key}`;
                    if (scene.anims.exists(animKey)) {
                        npc.anims.play(animKey, true);
                        npc.currentAnimKey = animKey;
                    } else {
                        console.error(`Animation ${animKey} not found for NPC ${npc.texture.key}`);
                    }
                    npc.movingDirection = choice;
                    npc.nextChange = scene.time.now + (Math.random() * 1500 + 500); // Move for 0.5-2s
                } else {
                    npc.movingDirection = null;
                    npc.nextChange = scene.time.now + (Math.random() * 4000 + 2000); // Stop for 2-6s
                }
            }

            // Maintain constant speed if moving
            if (npc.movingDirection) {
                const speed = CONFIG.PLAYER.SPEED * 0.75;
                switch (npc.movingDirection) {
                    case 'up':
                        npc.setVelocity(0, -speed);
                        break;
                    case 'down':
                        npc.setVelocity(0, speed);
                        break;
                    case 'left':
                        npc.setVelocity(-speed, 0);
                        break;
                    case 'right':
                        npc.setVelocity(speed, 0);
                        break;
                }
            }

            // Apply boundary constraints
            const npcBounds = npc.getBounds();
            let hitBoundary = false;
            let vx = npc.body.velocity.x;
            let vy = npc.body.velocity.y;
            if (npcBounds.left < npcArea.x && vx < 0) {
                vx = 0;
                hitBoundary = true;
            } else if (npcBounds.right > npcArea.x + npcArea.width && vx > 0) {
                vx = 0;
                hitBoundary = true;
            }
            if (npcBounds.top < npcArea.y && vy < 0) {
                vy = 0;
                hitBoundary = true;
            } else if (npcBounds.bottom > npcArea.y + npcArea.height && vy > 0) {
                vy = 0;
                hitBoundary = true;
            }
            npc.setVelocity(vx, vy);

            if (hitBoundary) {
                npc.anims.stop();
                npc.setFrame(0);
                npc.nextChange = scene.time.now + (Math.random() * 3000 + 2000);
                npc.currentAnimKey = null;
                npc.movingDirection = null;
            }

            // Check velocity threshold and sync animation
            const absVx = Math.abs(vx);
            const absVy = Math.abs(vy);
            const currentSpeed = Math.sqrt(vx * vx + vy * vy);
            if (currentSpeed < minSpeed) {
                npc.setVelocity(0, 0);
                if (npc.anims.isPlaying) {
                    npc.anims.stop();
                    npc.setFrame(0);
                    npc.currentAnimKey = null;
                    npc.movingDirection = null;
                }
            } else {
                let direction;
                if (absVx > absVy) {
                    direction = vx > 0 ? 'right' : 'left';
                } else {
                    direction = vy > 0 ? 'down' : 'up';
                }
                const animKey = `${direction}-${npc.texture.key}`;
                if (npc.currentAnimKey !== animKey && scene.anims.exists(animKey)) {
                    npc.anims.play(animKey, true);
                    npc.currentAnimKey = animKey;
                }
            }

            // Update collision box
            const frameIndex = npc.anims.currentFrame ? npc.anims.currentFrame.index : 0;
            if (npc.collisionBoxes && npc.collisionBoxes[frameIndex]) {
                const obj = npc.collisionBoxes[frameIndex];
                npc.setSize(Math.round(obj.width), Math.round(obj.height));
                npc.setOffset(Math.round(obj.x), Math.round(obj.y));
            } else {
                npc.setSize(CONFIG.PLAYER.DEFAULT_SIZE.width, CONFIG.PLAYER.DEFAULT_SIZE.height);
                npc.setOffset(CONFIG.PLAYER.DEFAULT_SIZE.offsetX, CONFIG.PLAYER.DEFAULT_SIZE.offsetY);
            }
        });
    }
}

export default NPCManager;