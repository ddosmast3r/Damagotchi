/**
 * Tamagotchi Sprite Editor
 * Game Boy style pixel art editor with animation support
 */

// Game Boy Color Palette
const PALETTE = [
    '#0f380f', // Darkest
    '#306230', // Dark
    '#8bac0f', // Light
    '#9bbc0f'  // Lightest (background)
];

class SpriteEditor {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('drawCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.previewCanvas = document.getElementById('previewCanvas');
        this.previewCtx = this.previewCanvas.getContext('2d');

        // Editor state
        this.spriteSize = 32;
        this.pixelSize = this.canvas.width / this.spriteSize;
        this.currentTool = 'pencil';
        this.currentColor = 0;
        this.isDrawing = false;
        this.showGrid = true;
        this.onionSkin = false;

        // Speech bubble
        this.bubbleEnabled = false;
        this.bubbleText = 'Hello!';
        this.bubbleX = 50;
        this.bubbleY = 5;
        this.bubbleTail = 'down';
        this.bubbleFontSize = 6;

        // Animation frames
        this.frames = [];
        this.currentFrameIndex = 0;
        this.isPlaying = true;
        this.animSpeed = 200;
        this.animTimer = null;

        // Pagination
        this.framesPerPage = 6;
        this.currentPage = 0;

        // Undo/Redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;

        // Line/shape tool state
        this.startPos = null;
        this.lastPos = null;

        // Assets library
        this.assets = [];

        // Layers
        this.numLayers = 3;
        this.currentLayer = 0;
        this.layerVisibility = [true, true, true];

        // Initialize
        this.init();
    }

    init() {
        // Create first frame
        this.addFrame();

        // Event listeners
        this.setupCanvasEvents();
        this.setupToolEvents();
        this.setupControlEvents();
        this.setupKeyboardShortcuts();

        // Initial render
        this.render();
        this.startAnimation();

        // Load saved assets
        this.loadAssetsFromStorage();

        console.log('Sprite Editor initialized!');
    }

    // === Canvas Events ===
    setupCanvasEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    getPixelPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Use actual displayed size, not internal canvas size
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = Math.floor((e.clientX - rect.left) * scaleX / this.pixelSize);
        const y = Math.floor((e.clientY - rect.top) * scaleY / this.pixelSize);
        return { x: Math.max(0, Math.min(x, this.spriteSize - 1)),
                 y: Math.max(0, Math.min(y, this.spriteSize - 1)) };
    }

    onMouseDown(e) {
        this.isDrawing = true;
        const pos = this.getPixelPos(e);

        // Right click = eraser
        if (e.button === 2) {
            this.setPixel(pos.x, pos.y, 3); // Background color
        } else {
            this.startPos = pos;

            if (this.currentTool === 'pencil' || this.currentTool === 'eraser') {
                const color = this.currentTool === 'eraser' ? 3 : this.currentColor;
                this.setPixel(pos.x, pos.y, color);
            } else if (this.currentTool === 'fill') {
                this.floodFill(pos.x, pos.y, this.currentColor);
            }
        }
    }

    onMouseMove(e) {
        const pos = this.getPixelPos(e);

        // Update cursor position display
        document.getElementById('cursorPos').textContent = `X: ${pos.x} Y: ${pos.y}`;

        if (!this.isDrawing) return;

        if (this.currentTool === 'pencil') {
            this.setPixel(pos.x, pos.y, this.currentColor);
        } else if (this.currentTool === 'eraser') {
            this.setPixel(pos.x, pos.y, 3);
        } else if (this.currentTool === 'line' || this.currentTool === 'rect') {
            // Save last position for use in onMouseUp
            this.lastPos = pos;
            // Preview will be shown on render
            this.render();
            this.drawShapePreview(pos);
        }
    }

    onMouseUp() {
        if (this.isDrawing && this.startPos && this.lastPos) {
            if (this.currentTool === 'line') {
                // Draw line to frame data
                this.drawLine(this.startPos.x, this.startPos.y, this.lastPos.x, this.lastPos.y, this.currentColor, false);
                this.saveToHistory();
            } else if (this.currentTool === 'rect') {
                // Draw rect to frame data
                this.drawRect(this.startPos.x, this.startPos.y, this.lastPos.x, this.lastPos.y, this.currentColor);
                this.saveToHistory();
            }
        }

        this.isDrawing = false;
        this.startPos = null;
        this.lastPos = null;
        this.render();
    }

    drawRect(x0, y0, x1, y1, color) {
        const minX = Math.min(x0, x1);
        const maxX = Math.max(x0, x1);
        const minY = Math.min(y0, y1);
        const maxY = Math.max(y0, y1);

        // Draw horizontal lines
        for (let x = minX; x <= maxX; x++) {
            this.setPixelDirect(x, minY, color);
            this.setPixelDirect(x, maxY, color);
        }
        // Draw vertical lines
        for (let y = minY; y <= maxY; y++) {
            this.setPixelDirect(minX, y, color);
            this.setPixelDirect(maxX, y, color);
        }

        this.render();
        this.updateFrameThumbnail(this.currentFrameIndex);
    }

    setPixelDirect(x, y, color) {
        const frame = this.getCurrentFrame();
        frame[y][x] = color;
    }

    drawShapePreview(endPos) {
        if (!this.startPos) return;

        const ctx = this.ctx;
        ctx.fillStyle = PALETTE[this.currentColor];

        if (this.currentTool === 'line') {
            this.drawLine(this.startPos.x, this.startPos.y, endPos.x, endPos.y, this.currentColor, true);
        } else if (this.currentTool === 'rect') {
            const x1 = Math.min(this.startPos.x, endPos.x);
            const y1 = Math.min(this.startPos.y, endPos.y);
            const x2 = Math.max(this.startPos.x, endPos.x);
            const y2 = Math.max(this.startPos.y, endPos.y);

            for (let x = x1; x <= x2; x++) {
                this.drawPixelDirect(x, y1);
                this.drawPixelDirect(x, y2);
            }
            for (let y = y1; y <= y2; y++) {
                this.drawPixelDirect(x1, y);
                this.drawPixelDirect(x2, y);
            }
        }
    }

    drawPixelDirect(x, y) {
        this.ctx.fillRect(
            x * this.pixelSize,
            y * this.pixelSize,
            this.pixelSize,
            this.pixelSize
        );
    }

    // === Pixel Operations ===
    getCurrentFrame() {
        return this.frames[this.currentFrameIndex];
    }

    getCurrentLayer() {
        const frame = this.getCurrentFrame();
        return frame.layers[this.currentLayer];
    }

    getPixel(x, y) {
        const layer = this.getCurrentLayer();
        return layer[y][x];
    }

    setPixel(x, y, color) {
        const layer = this.getCurrentLayer();
        if (layer[y][x] !== color) {
            layer[y][x] = color;
            this.render();
            this.updateFrameThumbnail(this.currentFrameIndex);
        }
    }

    setPixelDirect(x, y, color) {
        const layer = this.getCurrentLayer();
        layer[y][x] = color;
    }

    drawLine(x0, y0, x1, y1, color, preview = false) {
        // Bresenham's line algorithm
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            if (preview) {
                this.drawPixelDirect(x0, y0);
            } else {
                this.setPixelDirect(x0, y0, color);
            }

            if (x0 === x1 && y0 === y1) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }

        if (!preview) {
            this.render();
            this.updateFrameThumbnail(this.currentFrameIndex);
        }
    }

    floodFill(startX, startY, newColor) {
        const layer = this.getCurrentLayer();
        const oldColor = layer[startY][startX];

        if (oldColor === newColor) return;

        const stack = [[startX, startY]];

        while (stack.length > 0) {
            const [x, y] = stack.pop();

            if (x < 0 || x >= this.spriteSize || y < 0 || y >= this.spriteSize) continue;
            if (layer[y][x] !== oldColor) continue;

            layer[y][x] = newColor;

            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }

        this.render();
        this.updateFrameThumbnail(this.currentFrameIndex);
        this.saveToHistory();
    }

    // === Rendering ===
    render() {
        const ctx = this.ctx;
        const frame = this.getCurrentFrame();

        // Clear canvas
        ctx.fillStyle = PALETTE[3];
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw onion skin (previous frame)
        if (this.onionSkin && this.currentFrameIndex > 0) {
            ctx.globalAlpha = 0.3;
            const prevFrame = this.frames[this.currentFrameIndex - 1];
            this.drawFrame(prevFrame);
            ctx.globalAlpha = 1;
        }

        // Draw current frame
        this.drawFrame(frame);

        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }
    }

    drawFrame(frame) {
        const ctx = this.ctx;

        // Draw layers from bottom to top
        for (let l = 0; l < this.numLayers; l++) {
            if (!this.layerVisibility[l]) continue;
            const layer = frame.layers[l];

            for (let y = 0; y < this.spriteSize; y++) {
                for (let x = 0; x < this.spriteSize; x++) {
                    const color = layer[y][x];
                    if (color !== 3) { // Don't draw background
                        ctx.fillStyle = PALETTE[color];
                        ctx.fillRect(
                            x * this.pixelSize,
                            y * this.pixelSize,
                            this.pixelSize,
                            this.pixelSize
                        );
                    }
                }
            }
        }
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = '#306230';
        ctx.lineWidth = 1;

        for (let i = 0; i <= this.spriteSize; i++) {
            const pos = i * this.pixelSize;

            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, this.canvas.height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(this.canvas.width, pos);
            ctx.stroke();
        }
    }

    // === Animation Preview ===
    renderPreview() {
        const ctx = this.previewCtx;
        const frame = this.getCurrentFrame();
        const scale = this.previewCanvas.width / this.spriteSize;

        ctx.fillStyle = PALETTE[3];
        ctx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

        // Draw all visible layers
        for (let l = 0; l < this.numLayers; l++) {
            if (!this.layerVisibility[l]) continue;
            const layer = frame.layers[l];

            for (let y = 0; y < this.spriteSize; y++) {
                for (let x = 0; x < this.spriteSize; x++) {
                    const color = layer[y][x];
                    if (color !== 3) {
                        ctx.fillStyle = PALETTE[color];
                        ctx.fillRect(x * scale, y * scale, scale, scale);
                    }
                }
            }
        }
    }

    updateBubble() {
        const bubble = document.getElementById('previewBubble');
        if (!bubble) return;

        // Toggle visibility
        if (this.bubbleEnabled) {
            bubble.classList.add('active');
        } else {
            bubble.classList.remove('active');
            return;
        }

        // Update text (replace spaces with non-breaking spaces for better rendering)
        bubble.innerHTML = this.bubbleText.replace(/ /g, '&nbsp;');

        // Update font size
        bubble.style.fontSize = this.bubbleFontSize + 'px';

        // Update position using coordinates
        bubble.style.left = this.bubbleX + '%';
        bubble.style.top = this.bubbleY + '%';
        bubble.style.transform = 'translate(-50%, -50%)';

        // Update tail
        bubble.classList.remove('tail-up', 'tail-down', 'tail-left', 'tail-right');
        if (this.bubbleTail !== 'none') {
            bubble.classList.add('tail-' + this.bubbleTail);
        }
    }

    startAnimation() {
        if (this.animTimer) clearInterval(this.animTimer);

        this.animTimer = setInterval(() => {
            if (this.isPlaying && this.frames.length > 1) {
                this.currentFrameIndex = (this.currentFrameIndex + 1) % this.frames.length;
                this.updateFrameSelection();
            }
            this.renderPreview();
        }, this.animSpeed);
    }

    // === Frame Management ===
    createEmptyLayer() {
        const layer = [];
        for (let y = 0; y < this.spriteSize; y++) {
            layer.push(new Array(this.spriteSize).fill(3));
        }
        return layer;
    }

    addFrame() {
        // Create frame with layers
        const frame = {
            layers: []
        };
        for (let i = 0; i < this.numLayers; i++) {
            frame.layers.push(this.createEmptyLayer());
        }
        this.frames.push(frame);
        this.currentFrameIndex = this.frames.length - 1;

        // Go to the page with the new frame
        this.goToFramePage(this.currentFrameIndex);
        this.rebuildFrameThumbnails();
        this.render();
    }

    duplicateFrame() {
        const currentFrame = this.getCurrentFrame();
        const newFrame = {
            layers: currentFrame.layers.map(layer => layer.map(row => [...row]))
        };
        this.frames.splice(this.currentFrameIndex + 1, 0, newFrame);
        this.currentFrameIndex++;

        this.goToFramePage(this.currentFrameIndex);
        this.rebuildFrameThumbnails();
        this.render();
    }

    deleteFrame() {
        if (this.frames.length <= 1) return;

        this.frames.splice(this.currentFrameIndex, 1);
        if (this.currentFrameIndex >= this.frames.length) {
            this.currentFrameIndex = this.frames.length - 1;
        }

        // Adjust page if needed
        const totalPages = Math.ceil(this.frames.length / this.framesPerPage);
        if (this.currentPage >= totalPages) {
            this.currentPage = Math.max(0, totalPages - 1);
        }

        this.rebuildFrameThumbnails();
        this.render();
    }

    clearCurrentFrame() {
        const layer = this.getCurrentLayer();
        for (let y = 0; y < this.spriteSize; y++) {
            for (let x = 0; x < this.spriteSize; x++) {
                layer[y][x] = 3; // Background color
            }
        }
        this.render();
        this.updateFrameThumbnail(this.currentFrameIndex);
        this.saveToHistory();
    }

    newSprite() {
        // Reset everything
        this.frames = [];
        this.currentFrameIndex = 0;
        this.currentPage = 0;
        this.history = [];
        this.historyIndex = -1;

        // Create first empty frame
        this.addFrame();

        // Clear animation name
        document.getElementById('animName').value = '';
    }

    // === Transform Operations ===
    shiftFrame(dx, dy) {
        const layer = this.getCurrentLayer();
        const size = this.spriteSize;
        const newLayer = [];

        // Create empty layer
        for (let y = 0; y < size; y++) {
            newLayer.push(new Array(size).fill(3));
        }

        // Copy with offset (wrap around)
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const newX = (x + dx + size) % size;
                const newY = (y + dy + size) % size;
                newLayer[newY][newX] = layer[y][x];
            }
        }

        // Apply
        this.getCurrentFrame().layers[this.currentLayer] = newLayer;
        this.render();
        this.updateFrameThumbnail(this.currentFrameIndex);
        this.saveToHistory();
    }

    flipHorizontal() {
        const layer = this.getCurrentLayer();
        const size = this.spriteSize;

        for (let y = 0; y < size; y++) {
            layer[y].reverse();
        }

        this.render();
        this.updateFrameThumbnail(this.currentFrameIndex);
        this.saveToHistory();
    }

    flipVertical() {
        const layer = this.getCurrentLayer();
        layer.reverse();

        this.render();
        this.updateFrameThumbnail(this.currentFrameIndex);
        this.saveToHistory();
    }

    rotate90() {
        const layer = this.getCurrentLayer();
        const size = this.spriteSize;
        const newLayer = [];

        for (let y = 0; y < size; y++) {
            newLayer.push(new Array(size).fill(3));
        }

        // Rotate 90° clockwise
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                newLayer[x][size - 1 - y] = layer[y][x];
            }
        }

        this.getCurrentFrame().layers[this.currentLayer] = newLayer;
        this.render();
        this.updateFrameThumbnail(this.currentFrameIndex);
        this.saveToHistory();
    }

    // === Assets Library ===
    saveAsset() {
        // Save current layer as asset
        const layer = this.getCurrentLayer();
        const assetData = layer.map(row => [...row]);
        this.assets.push({
            data: assetData,
            size: this.spriteSize
        });
        this.rebuildAssetThumbnails();
        this.saveAssetsToStorage();
    }

    loadAsset(index) {
        const asset = this.assets[index];
        if (!asset) return;

        const layer = this.getCurrentLayer();

        // If sizes match, load directly
        if (asset.size === this.spriteSize) {
            const frame = this.getCurrentFrame();
            frame.layers[this.currentLayer] = asset.data.map(row => [...row]);
        } else {
            // Scale asset to current sprite size
            const scale = this.spriteSize / asset.size;

            for (let y = 0; y < this.spriteSize; y++) {
                for (let x = 0; x < this.spriteSize; x++) {
                    const srcX = Math.floor(x / scale);
                    const srcY = Math.floor(y / scale);
                    if (srcY < asset.data.length && srcX < asset.data[0].length) {
                        layer[y][x] = asset.data[srcY][srcX];
                    }
                }
            }
        }

        this.render();
        this.updateFrameThumbnail(this.currentFrameIndex);
        this.saveToHistory();
    }

    deleteAsset(index) {
        this.assets.splice(index, 1);
        this.rebuildAssetThumbnails();
        this.saveAssetsToStorage();
    }

    clearAssets() {
        this.assets = [];
        this.rebuildAssetThumbnails();
        this.saveAssetsToStorage();
    }

    rebuildAssetThumbnails() {
        const container = document.getElementById('assetsContainer');
        if (!container) return;
        container.innerHTML = '';

        this.assets.forEach((asset, index) => {
            const thumb = document.createElement('div');
            thumb.className = 'asset-thumb';
            thumb.onclick = () => this.loadAsset(index);

            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            thumb.appendChild(canvas);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-asset';
            deleteBtn.textContent = '×';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteAsset(index);
            };
            thumb.appendChild(deleteBtn);

            container.appendChild(thumb);
            this.drawAssetThumbnail(canvas, asset);
        });
    }

    drawAssetThumbnail(canvas, asset) {
        const ctx = canvas.getContext('2d');
        const scale = canvas.width / asset.size;

        ctx.fillStyle = PALETTE[3];
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < asset.size; y++) {
            for (let x = 0; x < asset.size; x++) {
                const color = asset.data[y][x];
                if (color !== 3) {
                    ctx.fillStyle = PALETTE[color];
                    ctx.fillRect(x * scale, y * scale, Math.ceil(scale), Math.ceil(scale));
                }
            }
        }
    }

    saveAssetsToStorage() {
        try {
            localStorage.setItem('spriteEditorAssets', JSON.stringify(this.assets));
        } catch (e) {
            console.warn('Could not save assets to localStorage');
        }
    }

    loadAssetsFromStorage() {
        try {
            const saved = localStorage.getItem('spriteEditorAssets');
            if (saved) {
                this.assets = JSON.parse(saved);
                this.rebuildAssetThumbnails();
            }
        } catch (e) {
            console.warn('Could not load assets from localStorage');
        }
    }

    selectFrame(index) {
        this.currentFrameIndex = index;
        this.goToFramePage(index);
        this.rebuildFrameThumbnails();
        this.render();
    }

    rebuildFrameThumbnails() {
        const container = document.getElementById('framesContainer');
        container.innerHTML = '';

        // Calculate page
        const totalPages = Math.ceil(this.frames.length / this.framesPerPage);
        const startIndex = this.currentPage * this.framesPerPage;
        const endIndex = Math.min(startIndex + this.framesPerPage, this.frames.length);

        // Show frames for current page
        for (let index = startIndex; index < endIndex; index++) {
            const frame = this.frames[index];
            const thumb = document.createElement('div');
            thumb.className = 'frame-thumb' + (index === this.currentFrameIndex ? ' active' : '');
            thumb.onclick = () => this.selectFrame(index);

            const canvas = document.createElement('canvas');
            canvas.width = 56;
            canvas.height = 56;
            thumb.appendChild(canvas);

            const number = document.createElement('span');
            number.className = 'frame-number';
            number.textContent = index + 1;
            thumb.appendChild(number);

            container.appendChild(thumb);

            this.drawThumbnail(canvas, frame);
        }

        // Update pagination display
        this.updatePaginationDisplay();
    }

    updatePaginationDisplay() {
        const totalPages = Math.ceil(this.frames.length / this.framesPerPage);
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (pageInfo) {
            pageInfo.textContent = `${this.currentPage + 1}/${totalPages}`;
        }
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 0;
            prevBtn.style.opacity = this.currentPage === 0 ? '0.5' : '1';
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages - 1;
            nextBtn.style.opacity = this.currentPage >= totalPages - 1 ? '0.5' : '1';
        }
    }

    prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.rebuildFrameThumbnails();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.frames.length / this.framesPerPage);
        if (this.currentPage < totalPages - 1) {
            this.currentPage++;
            this.rebuildFrameThumbnails();
        }
    }

    goToFramePage(frameIndex) {
        this.currentPage = Math.floor(frameIndex / this.framesPerPage);
    }

    updateFrameThumbnail(index) {
        // Check if frame is on current page
        const startIndex = this.currentPage * this.framesPerPage;
        const endIndex = startIndex + this.framesPerPage;

        if (index >= startIndex && index < endIndex) {
            const thumbs = document.querySelectorAll('.frame-thumb canvas');
            const localIndex = index - startIndex;
            if (thumbs[localIndex]) {
                this.drawThumbnail(thumbs[localIndex], this.frames[index]);
            }
        }
    }

    updateFrameSelection() {
        const thumbs = document.querySelectorAll('.frame-thumb');
        const startIndex = this.currentPage * this.framesPerPage;

        thumbs.forEach((thumb, localIndex) => {
            const globalIndex = startIndex + localIndex;
            thumb.classList.toggle('active', globalIndex === this.currentFrameIndex);
        });
    }

    drawThumbnail(canvas, frame) {
        const ctx = canvas.getContext('2d');
        const scale = canvas.width / this.spriteSize;

        ctx.fillStyle = PALETTE[3];
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw all layers
        for (let l = 0; l < this.numLayers; l++) {
            const layer = frame.layers[l];
            for (let y = 0; y < this.spriteSize; y++) {
                for (let x = 0; x < this.spriteSize; x++) {
                    const color = layer[y][x];
                    if (color !== 3) {
                        ctx.fillStyle = PALETTE[color];
                        ctx.fillRect(x * scale, y * scale, Math.ceil(scale), Math.ceil(scale));
                    }
                }
            }
        }
    }

    // === Tool & Color Selection ===
    selectTool(tool) {
        this.currentTool = tool;

        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
    }

    selectColor(colorIndex) {
        this.currentColor = colorIndex;

        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.color) === colorIndex);
        });
    }

    // === Event Setup ===
    setupToolEvents() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.onclick = () => this.selectTool(btn.dataset.tool);
        });

        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.onclick = () => this.selectColor(parseInt(btn.dataset.color));
        });
    }

    setupControlEvents() {
        // Grid toggle
        document.getElementById('showGrid').onchange = (e) => {
            this.showGrid = e.target.checked;
            this.render();
        };

        // Onion skin
        document.getElementById('onionSkin').onclick = (e) => {
            this.onionSkin = !this.onionSkin;
            e.target.classList.toggle('active', this.onionSkin);
            this.render();
        };

        // Speech bubble
        document.getElementById('bubbleEnabled').onchange = (e) => {
            this.bubbleEnabled = e.target.checked;
            this.updateBubble();
        };

        document.getElementById('bubbleText').oninput = (e) => {
            this.bubbleText = e.target.value || 'Hello!';
            this.updateBubble();
        };

        document.querySelectorAll('.position-grid button').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.position-grid button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.bubbleX = parseInt(btn.dataset.x);
                this.bubbleY = parseInt(btn.dataset.y);
                document.getElementById('bubbleX').value = this.bubbleX;
                document.getElementById('bubbleY').value = this.bubbleY;
                this.updateBubble();
            };
        });

        document.getElementById('bubbleX').oninput = (e) => {
            this.bubbleX = parseInt(e.target.value) || 0;
            document.querySelectorAll('.position-grid button').forEach(b => b.classList.remove('active'));
            this.updateBubble();
        };

        document.getElementById('bubbleY').oninput = (e) => {
            this.bubbleY = parseInt(e.target.value) || 0;
            document.querySelectorAll('.position-grid button').forEach(b => b.classList.remove('active'));
            this.updateBubble();
        };

        // Bubble tail
        document.querySelectorAll('.tail-btns button').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.tail-btns button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.bubbleTail = btn.dataset.tail;
                this.updateBubble();
            };
        });

        // Bubble font size
        document.getElementById('bubbleFontSize').oninput = (e) => {
            this.bubbleFontSize = parseInt(e.target.value) || 6;
            this.updateBubble();
        };

        // Sprite size
        document.getElementById('spriteSize').onchange = (e) => {
            this.changeSpriteSize(parseInt(e.target.value));
        };

        // Animation controls
        document.getElementById('playBtn').onclick = () => {
            this.isPlaying = true;
            document.getElementById('playBtn').classList.add('active');
            document.getElementById('stopBtn').classList.remove('active');
        };

        document.getElementById('stopBtn').onclick = () => {
            this.isPlaying = false;
            document.getElementById('stopBtn').classList.add('active');
            document.getElementById('playBtn').classList.remove('active');
        };

        document.getElementById('speedSlider').oninput = (e) => {
            this.animSpeed = parseInt(e.target.value);
            document.getElementById('speedValue').textContent = this.animSpeed;
            this.startAnimation();
        };

        // Frame controls
        document.getElementById('addFrame').onclick = () => this.addFrame();
        document.getElementById('dupFrame').onclick = () => this.duplicateFrame();
        document.getElementById('delFrame').onclick = () => this.deleteFrame();

        // Canvas controls
        document.getElementById('clearCanvas').onclick = () => this.clearCurrentFrame();
        document.getElementById('newSprite').onclick = () => this.newSprite();

        // Transform controls
        document.getElementById('shiftUp').onclick = () => this.shiftFrame(0, -1);
        document.getElementById('shiftDown').onclick = () => this.shiftFrame(0, 1);
        document.getElementById('shiftLeft').onclick = () => this.shiftFrame(-1, 0);
        document.getElementById('shiftRight').onclick = () => this.shiftFrame(1, 0);
        document.getElementById('flipH').onclick = () => this.flipHorizontal();
        document.getElementById('flipV').onclick = () => this.flipVertical();
        document.getElementById('rotate').onclick = () => this.rotate90();

        // Pagination
        document.getElementById('prevPage').onclick = () => this.prevPage();
        document.getElementById('nextPage').onclick = () => this.nextPage();

        // Export/Import
        document.getElementById('exportPng').onclick = () => this.exportPNG();
        document.getElementById('exportJson').onclick = () => this.exportJSON();
        document.getElementById('importJson').onclick = () => this.importJSON();

        // Assets
        document.getElementById('saveAsset').onclick = () => this.saveAsset();
        document.getElementById('clearAssets').onclick = () => this.clearAssets();

        // Layers
        document.querySelectorAll('.layer-btn').forEach(btn => {
            btn.onclick = () => {
                const layerIndex = parseInt(btn.dataset.layer);
                this.selectLayer(layerIndex);
            };
        });
    }

    selectLayer(index) {
        this.currentLayer = index;
        document.querySelectorAll('.layer-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.layer) === index);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger if typing in input
            if (e.target.tagName === 'INPUT') return;

            switch (e.key.toLowerCase()) {
                case 'p': this.selectTool('pencil'); break;
                case 'e': this.selectTool('eraser'); break;
                case 'f': this.selectTool('fill'); break;
                case 'l': this.selectTool('line'); break;
                case 'r': this.selectTool('rect'); break;
                case '1': this.selectColor(0); break;
                case '2': this.selectColor(1); break;
                case '3': this.selectColor(2); break;
                case '4': this.selectColor(3); break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) this.undo();
                    break;
                case 'y':
                    if (e.ctrlKey || e.metaKey) this.redo();
                    break;
                case ' ':
                    e.preventDefault();
                    this.isPlaying = !this.isPlaying;
                    break;
                case 'arrowleft':
                    if (e.shiftKey) {
                        this.prevPage();
                    } else if (this.currentFrameIndex > 0) {
                        this.selectFrame(this.currentFrameIndex - 1);
                    }
                    break;
                case 'arrowright':
                    if (e.shiftKey) {
                        this.nextPage();
                    } else if (this.currentFrameIndex < this.frames.length - 1) {
                        this.selectFrame(this.currentFrameIndex + 1);
                    }
                    break;
            }
        });
    }

    // === Sprite Size ===
    changeSpriteSize(newSize) {
        this.spriteSize = newSize;
        this.pixelSize = this.canvas.width / this.spriteSize;

        // Reset frames
        this.frames = [];
        this.currentFrameIndex = 0;
        this.addFrame();

        document.getElementById('canvasSize').textContent = `${newSize}x${newSize}`;
    }

    // === History (Undo/Redo) ===
    saveToHistory() {
        // Remove any redo states
        this.history = this.history.slice(0, this.historyIndex + 1);

        // Save current state (deep copy of frames with layers)
        const state = this.frames.map(frame => ({
            layers: frame.layers.map(layer => layer.map(row => [...row]))
        }));
        this.history.push({
            frames: state,
            currentFrame: this.currentFrameIndex
        });

        // Limit history
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        this.historyIndex = this.history.length - 1;
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreFromHistory();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreFromHistory();
        }
    }

    restoreFromHistory() {
        const state = this.history[this.historyIndex];
        this.frames = state.frames.map(frame => ({
            layers: frame.layers.map(layer => layer.map(row => [...row]))
        }));
        this.currentFrameIndex = state.currentFrame;
        this.rebuildFrameThumbnails();
        this.render();
    }

    // === Export/Import ===
    exportPNG() {
        const name = document.getElementById('animName').value || 'sprite';

        // Create spritesheet
        const sheetCanvas = document.createElement('canvas');
        sheetCanvas.width = this.spriteSize * this.frames.length;
        sheetCanvas.height = this.spriteSize;
        const sheetCtx = sheetCanvas.getContext('2d');

        this.frames.forEach((frame, index) => {
            // Merge all layers
            for (let l = 0; l < this.numLayers; l++) {
                const layer = frame.layers[l];
                for (let y = 0; y < this.spriteSize; y++) {
                    for (let x = 0; x < this.spriteSize; x++) {
                        const color = layer[y][x];
                        if (color !== 3) {
                            sheetCtx.fillStyle = PALETTE[color];
                            sheetCtx.fillRect(
                                index * this.spriteSize + x,
                                y,
                                1, 1
                            );
                        }
                    }
                }
            }
        });

        // Download
        const link = document.createElement('a');
        link.download = `${name}_${this.spriteSize}x${this.spriteSize}_${this.frames.length}frames.png`;
        link.href = sheetCanvas.toDataURL('image/png');
        link.click();
    }

    exportJSON() {
        const name = document.getElementById('animName').value || 'sprite';

        const data = {
            name: name,
            spriteSize: this.spriteSize,
            frameCount: this.frames.length,
            speed: this.animSpeed,
            frames: this.frames,
            bubble: {
                text: this.bubbleText,
                x: this.bubbleX,
                y: this.bubbleY,
                tail: this.bubbleTail,
                fontSize: this.bubbleFontSize
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = `${name}.json`;
        link.href = URL.createObjectURL(blob);
        link.click();
    }

    importJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);

                    this.spriteSize = data.spriteSize;
                    this.pixelSize = this.canvas.width / this.spriteSize;

                    // Handle both old (flat) and new (layered) formats
                    if (data.frames[0] && data.frames[0].layers) {
                        // New format with layers
                        this.frames = data.frames;
                    } else {
                        // Old format - convert to layers
                        this.frames = data.frames.map(oldFrame => ({
                            layers: [
                                oldFrame.map(row => [...row]),  // Layer 0
                                this.createEmptyLayer(),          // Layer 1
                                this.createEmptyLayer()           // Layer 2
                            ]
                        }));
                    }

                    this.currentFrameIndex = 0;
                    this.animSpeed = data.speed || 200;

                    document.getElementById('spriteSize').value = this.spriteSize;
                    document.getElementById('animName').value = data.name || '';
                    document.getElementById('speedSlider').value = this.animSpeed;
                    document.getElementById('speedValue').textContent = this.animSpeed;

                    // Restore bubble settings if present
                    if (data.bubble) {
                        this.bubbleText = data.bubble.text || 'Hello!';
                        this.bubbleX = data.bubble.x || 50;
                        this.bubbleY = data.bubble.y || 5;
                        this.bubbleTail = data.bubble.tail || 'down';
                        this.bubbleFontSize = data.bubble.fontSize || 6;

                        document.getElementById('bubbleText').value = this.bubbleText;
                        document.getElementById('bubbleX').value = this.bubbleX;
                        document.getElementById('bubbleY').value = this.bubbleY;
                        document.getElementById('bubbleFontSize').value = this.bubbleFontSize;
                        this.updateBubble();
                    }

                    this.rebuildFrameThumbnails();
                    this.render();
                    this.startAnimation();

                    console.log('Sprite imported successfully!');
                } catch (err) {
                    alert('Error loading file: ' + err.message);
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }
}

// Initialize editor
let editor;
document.addEventListener('DOMContentLoaded', () => {
    editor = new SpriteEditor();
    window.editor = editor;
});
