import CONFIG from './config.js';

class NPCManager {

    subdivideRectangle(width, height, n) {
        // Initialize the list of rectangles with the original rectangle
        let rectangles = [{ x: 0, y: 0, width: width, height: height }];
        
        // Continue splitting until we have n rectangles
        while (rectangles.length < n) {
            // Select a random rectangle to split
            const index = Math.floor(Math.random() * rectangles.length);
            const rect = rectangles[index];
            
            // Decide whether to split horizontally or vertically
            const splitHorizontally = Math.random() < 0.5;
            
            // Ensure the rectangle is large enough to split
            const minSize = 1; // Minimum size to prevent overly small rectangles
            if ((splitHorizontally && rect.height < 2 * minSize) ||
                (!splitHorizontally && rect.width < 2 * minSize)) {
                continue; // Skip if too small to split
            }
            
            if (splitHorizontally) {
                // Split horizontally
                const splitY = rect.y + minSize + Math.random() * (rect.height - 2 * minSize);
                const rect1 = { x: rect.x, y: rect.y, width: rect.width, height: splitY - rect.y };
                const rect2 = { x: rect.x, y: splitY, width: rect.width, height: rect.y + rect.height - splitY };
                
                // Replace the original rectangle with the two new ones
                rectangles.splice(index, 1, rect1, rect2);
            } else {
                // Split vertically
                const splitX = rect.x + minSize + Math.random() * (rect.width - 2 * minSize);
                const rect1 = { x: rect.x, y: rect.y, width: splitX - rect.x, height: rect.height };
                const rect2 = { x: splitX, y: rect.y, width: rect.x + rect.width - splitX, height: rect.height };
                
                // Replace the original rectangle with the two new ones
                rectangles.splice(index, 1, rect1, rect2);
            }
        }
        
        // Verify each rectangle touches at least one boundary of the original rectangle
        const filteredRectangles = rectangles.filter(rect => 
            rect.x === 0 || 
            rect.y === 0 || 
            rect.x + rect.width === width || 
            rect.y + rect.height === height
        );
        
        // If we filtered out some rectangles, try to generate more to reach n
        if (filteredRectangles.length < n) {
            return this.subdivideRectangle(width, height, n); // Recurse to ensure n rectangles
        }
        
        // If we have more than n rectangles, trim to n
        return filteredRectangles.slice(0, n);
    }

    static createNPCs(scene) {
        // Create global animations for all NPCs once
        CONFIG.NPC.SPRITES.forEach(spriteKey => {
            scene.anims.create({
                key: `down-${spriteKey}`,
                frames: scene.anims.generateFrameNumbers(spriteKey, { frames: [0, 1, 2, 3] }),
                frameRate: 6,
                repeat: -1
            });
           
        });

    // Example usage:
        const result = this.subdivideRectangle(100, 100, 5);
        console.log(result);
        
        const npcAreaLayer = scene.map.getObjectLayer('npc_area');
        if (!npcAreaLayer || npcAreaLayer.objects.length === 0) {
            console.error('npc_area object layer not found or empty in map.');
            return;
        }

        const npcArea = npcAreaLayer.objects[0];
        const numNPCs = 5; // Number of vendors

        scene.npcGroup = scene.physics.add.group();

        // Divide the perimeter into segments
        const totalPerimeter = 2 * (npcArea.width + npcArea.height);
        const segmentLength = totalPerimeter / numNPCs;
        const subRectWidth = npcArea.width * 2 / numNPCs;
        const subRectHeight = npcArea.height / 2;

        //test for even subdivsion of rect.
        //if even, each subrect is half the hight of npc_area, each width is
        //npc_area width / (npc_count/2)
        //if odd, 1 rect = npc_area.height x (npc_area_length * 2 / npc_count) / 2
        // remaining rects = 1/2 * npc_area_hieght x (npc_area_length * 2 / npc_count)

/*
        for (let i = 0; i < numNPCs; i++) {
            const perimeterPos = i * segmentLength;
            let x, y, width, height;

            if (perimeterPos < npcArea.width) {
                // Top edge
                x = npcArea.x + perimeterPos;
                y = npcArea.y;
                width = subRectWidth;
                height = subRectHeight;
            } else if (perimeterPos < npcArea.width + npcArea.height) {
                // Right edge
                x = npcArea.x + npcArea.width - subRectWidth;
                y = npcArea.y + (perimeterPos - npcArea.width);
                width = subRectWidth;
                height = subRectHeight;
            } else if (perimeterPos < 2 * npcArea.width + npcArea.height) {
                // Bottom edge
                x = npcArea.x + (2 * npcArea.width + npcArea.height - perimeterPos) - subRectWidth;
                y = npcArea.y + npcArea.height - subRectHeight;
                width = subRectWidth;
                height = subRectHeight;
            } else {
                // Left edge
                x = npcArea.x;
                y = npcArea.y + (totalPerimeter - perimeterPos);
                width = subRectWidth;
                height = subRectHeight;
            }

            const homeRect = { x, y, width, height };
            const spriteKey = CONFIG.NPC.SPRITES[Math.floor(Math.random() * CONFIG.NPC.SPRITES.length)];
            const npc = scene.physics.add.sprite(x, y, spriteKey, 0);
            npc.setDepth(1);
            npc.setBounce(0);
            npc.setDrag(0);

            npc.collisionBoxes = scene.player.collisionBoxes;
            npc.homeRect = homeRect;

            npc.setFrame(0);
            npc.setVelocity(0, 0);
            npc.nextChange = scene.time.now + Math.random() * 1000;
            npc.currentAnimKey = null;
            npc.movingDirection = null;

            scene.npcGroup.add(npc);
        }
*/
        // Update debug graphics
        scene.npcDebugGraphics = scene.add.graphics();
        scene.npcDebugGraphics.setDepth(100);
        scene.npcDebugGraphics.lineStyle(2, 0x00ff00, 1);
        scene.npcGroup.getChildren().forEach(npc => {
            const { x, y, width, height } = npc.homeRect;
            scene.npcDebugGraphics.strokeRect(x, y, width, height);
        });
        scene.npcDebugGraphics.setVisible(scene.debugEnabled);

        // Set up collisions (unchanged)
        scene.physics.add.collider(scene.npcGroup, scene.collisionGroup, (npc, collisionObj) => {
            // ... (collision logic remains the same)
        });
        scene.physics.add.collider(scene.player, scene.npcGroup);
        scene.physics.add.collider(scene.npcGroup, scene.npcGroup, (npc1, npc2) => {
            // ... (collision logic remains the same)
        });
    }
    static handleNPCMovements(scene) {
        if (!scene.npcGroup) return;

        const minSpeed = 10;
        const margin = 32; // Adjustable margin for center detection

        scene.npcGroup.getChildren().forEach(npc => {
            if (scene.time.now > npc.nextChange) {
                let choice;
                const home = npc.homeRect;
                const isInCenter = npc.x > home.x + margin &&
                                   npc.x < home.x + home.width - margin &&
                                   npc.y > home.y + margin &&
                                   npc.y < home.y + home.height - margin;

                if (isInCenter) {
                    // Gravitate to a random edge
                    const sides = ['left', 'right', 'up', 'down'];
                    choice = sides[Math.floor(Math.random() * sides.length)];
                    npc.nextChange = scene.time.now + (Math.random() * 1500 + 500); // Move for 0.5-2s
                } else {
                    // Random wander including stop
                    const choices = ['up', 'down', 'left', 'right', 'stop'];
                    choice = choices[Math.floor(Math.random() * choices.length)];
                    if (choice === 'stop') {
                        npc.nextChange = scene.time.now + (Math.random() * 4000 + 2000); // Stop for 2-6s
                    } else {
                        npc.nextChange = scene.time.now + (Math.random() * 1500 + 500); // Move for 0.5-2s
                    }
                }

                npc.setVelocity(0, 0);
                npc.anims.stop();
                npc.setFrame(0);
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
                } else {
                    npc.movingDirection = null;
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

            // Soft boundary constraints
            const npcBounds = npc.getBounds();
            let hitBoundary = false;
            let vx = npc.body.velocity.x;
            let vy = npc.body.velocity.y;
            const stayProb = 0.8; // Probability to stay within bounds

            if (npcBounds.left < npc.homeRect.x && vx < 0) {
                if (Math.random() < stayProb) {
                    vx = 0;
                    hitBoundary = true;
                }
            } else if (npcBounds.right > npc.homeRect.x + npc.homeRect.width && vx > 0) {
                if (Math.random() < stayProb) {
                    vx = 0;
                    hitBoundary = true;
                }
            }
            if (npcBounds.top < npc.homeRect.y && vy < 0) {
                if (Math.random() < stayProb) {
                    vy = 0;
                    hitBoundary = true;
                }
            } else if (npcBounds.bottom > npc.homeRect.y + npc.homeRect.height && vy > 0) {
                if (Math.random() < stayProb) {
                    vy = 0;
                    hitBoundary = true;
                }
            }
            npc.setVelocity(vx, vy);

            if (hitBoundary) {
                npc.anims.stop();
                npc.setFrame(0);
                npc.nextChange = scene.time.now + (Math.random() * 3000 + 2000);
                npc.currentAnimKey = null;
                npc.movingDirection = null;
            }

            // Sync animation with velocity and handle low speed
            const absVx = Math.abs(vx);
            const absVy = Math.abs(vy);
            const currentSpeed = Math.abs(vx) + Math.abs(vy); // Approximate speed without sqrt
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

            // Update collision box based on current frame
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