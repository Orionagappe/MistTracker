/**
 * MistInterface.js - UI Component System for Mist Platform using Vulkan
 */


import nvk from 'nvk';
import fs from 'node:fs';

// Basic UI rendering utilities
const renderUtils = {
    createRect: (device, width, height, color) => {
        const vertexData = new Float32Array([
            0, 0,       color[0], color[1], color[2], color[3],
            width, 0,   color[0], color[1], color[2], color[3],
            0, height,  color[0], color[1], color[2], color[3],
            width, height, color[0], color[1], color[2], color[3]
        ]);
        const buffer = new nvk.Buffer(device, {
            size: vertexData.byteLength,
            usage: nvk.BufferUsage.VERTEX_BUFFER,
            data: vertexData
        });
        return buffer;
    },
    
    createText: (device, text, fontSize = 12) => {
        // Create texture for text rendering
        const canvas = new nvk.Canvas(256, 32);
        const ctx = canvas.getContext('2d');
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, 0, fontSize);
        
        return new nvk.Texture(device, {
            data: canvas.getData(),
            width: canvas.width,
            height: canvas.height,
            format: nvk.Format.R8G8B8A8_UNORM
        });
    }
};

class UIComponent {
    constructor(id, parentElement) {
        this.id = id;
        this.isVisible = true;
        this.isEnabled = true;
        this.tooltip = '';
        this.position = { x: 0, y: 0 };
        this.size = { width: 100, height: 30 };
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.parent = parentElement;
        this.children = [];
        
        if (parentElement) {
            parentElement.children.push(this);
        }

        // Will be initialized when device is available
        this.vertexBuffer = null;
        this.texture = null;
    }

    initializeGraphics(device) {
        this.vertexBuffer = renderUtils.createRect(
            device,
            this.size.width,
            this.size.height,
            this.color
        );
    }

    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        return this;
    }

    setSize(width, height) {
        this.size.width = width;
        this.size.height = height;
        if (this.vertexBuffer) {
            this.vertexBuffer.destroy();
            this.vertexBuffer = renderUtils.createRect(
                this.device,
                width,
                height,
                this.color
            );
        }
        return this;
    }

    setTooltip(text) {
        this.tooltip = text;
        if (this.tooltipTexture) {
            this.tooltipTexture.destroy();
        }
        this.tooltipTexture = renderUtils.createText(this.device, text);
        return this;
    }

    show() {
        this.isVisible = true;
        return this;
    }

    hide() {
        this.isVisible = false;
        return this;
    }

    enable() {
        this.isEnabled = true;
        this.color[3] = 1.0; // Full opacity
        if (this.vertexBuffer) {
            this.vertexBuffer.destroy();
            this.vertexBuffer = renderUtils.createRect(
                this.device,
                this.size.width,
                this.size.height,
                this.color
            );
        }
        return this;
    }

    disable() {
        this.isEnabled = false;
        this.color[3] = 0.5; // Half opacity
        if (this.vertexBuffer) {
            this.vertexBuffer.destroy();
            this.vertexBuffer = renderUtils.createRect(
                this.device,
                this.size.width,
                this.size.height,
                this.color
            );
        }
        return this;
    }

    render(commandBuffer, pipeline) {
        if (!this.isVisible) return;

        // Bind vertex buffer and pipeline
        commandBuffer.bindVertexBuffers(0, [this.vertexBuffer], [0]);
        commandBuffer.bindPipeline(nvk.PipelineBindPoint.GRAPHICS, pipeline);

        // Push constants for position
        commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
            this.position.x,
            this.position.y
        ]));

        // Draw
        commandBuffer.draw(4, 1, 0, 0);

        // Render children
        this.children.forEach(child => {
            child.render(commandBuffer, pipeline);
        });
    }
}

class Button extends UIComponent {
    constructor(id, parentElement, text) {
        super(id, parentElement);
        this.text = text || '';
        this.clickHandlers = [];
        this.color = [0.2, 0.4, 0.8, 1.0]; // Default button color
        this.hovered = false;
    }

    setText(text) {
        this.text = text;
        if (this.textTexture) {
            this.textTexture.destroy();
        }
        this.textTexture = renderUtils.createText(this.device, text);
        return this;
    }

    onClick(callback) {
        if (typeof callback === 'function') {
            this.clickHandlers.push(callback);
        }
        return this;
    }

    handleInput(x, y, type) {
        if (!this.isEnabled) return;

        const isInside = x >= this.position.x && 
                        x <= this.position.x + this.size.width &&
                        y >= this.position.y && 
                        y <= this.position.y + this.size.height;

        if (type === 'mousemove') {
            this.hovered = isInside;
            if (this.hovered) {
                this.color = [0.3, 0.5, 0.9, 1.0]; // Hover color
            } else {
                this.color = [0.2, 0.4, 0.8, 1.0]; // Normal color
            }
            this.updateVertexBuffer();
        } else if (type === 'click' && isInside) {
            this.clickHandlers.forEach(handler => handler());
        }
    }

    updateVertexBuffer() {
        if (this.vertexBuffer) {
            this.vertexBuffer.destroy();
        }
        this.vertexBuffer = renderUtils.createRect(
            this.device,
            this.size.width,
            this.size.height,
            this.color
        );
    }

    render(commandBuffer, pipeline) {
        if (!this.isVisible) return;

        // Render button background
        super.render(commandBuffer, pipeline);

        // Render button text
        if (this.textTexture) {
            commandBuffer.bindDescriptorSets(
                nvk.PipelineBindPoint.GRAPHICS,
                pipeline.layout,
                0,
                [this.textTexture.descriptorSet]
            );

            const textX = this.position.x + (this.size.width - this.textTexture.width) / 2;
            const textY = this.position.y + (this.size.height - this.textTexture.height) / 2;

            commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
                textX,
                textY
            ]));

            commandBuffer.draw(4, 1, 0, 0);
        }
    }
}

class Slider extends UIComponent {
    constructor(id, parentElement, min = 0, max = 100, step = 1) {
        super(id, parentElement);
        this.min = min;
        this.max = max;
        this.step = step;
        this.value = min;
        this.changeHandlers = [];
        this.isDragging = false;
        this.color = [0.3, 0.3, 0.3, 1.0]; // Track color
        this.handleColor = [0.6, 0.6, 0.6, 1.0]; // Handle color
    }

    setValue(value) {
        this.value = Math.min(this.max, Math.max(this.min, value));
        this.updateHandlePosition();
        this.changeHandlers.forEach(handler => handler(this.value));
        return this;
    }

    getValue() {
        return this.value;
    }

    onChange(callback) {
        if (typeof callback === 'function') {
            this.changeHandlers.push(callback);
        }
        return this;
    }

    updateHandlePosition() {
        const percent = (this.value - this.min) / (this.max - this.min);
        this.handleX = this.position.x + percent * (this.size.width - this.handleWidth);
    }

    initializeGraphics(device) {
        this.device = device;
        this.handleWidth = 20;
        this.handleHeight = this.size.height;

        // Create track buffer
        this.trackBuffer = renderUtils.createRect(
            device,
            this.size.width,
            4, // Track height
            this.color
        );

        // Create handle buffer
        this.handleBuffer = renderUtils.createRect(
            device,
            this.handleWidth,
            this.handleHeight,
            this.handleColor
        );

        this.updateHandlePosition();
    }

    handleInput(x, y, type) {
        if (!this.isEnabled) return;

        const isInTrack = y >= this.position.y && 
                         y <= this.position.y + this.size.height &&
                         x >= this.position.x && 
                         x <= this.position.x + this.size.width;

        if (type === 'mousedown' && isInTrack) {
            this.isDragging = true;
            const percent = (x - this.position.x) / this.size.width;
            const newValue = this.min + percent * (this.max - this.min);
            this.setValue(Math.round(newValue / this.step) * this.step);
        } else if (type === 'mousemove' && this.isDragging) {
            const percent = (x - this.position.x) / this.size.width;
            const newValue = this.min + percent * (this.max - this.min);
            this.setValue(Math.round(newValue / this.step) * this.step);
        } else if (type === 'mouseup') {
            this.isDragging = false;
        }
    }

    render(commandBuffer, pipeline) {
        if (!this.isVisible) return;

        // Render track
        commandBuffer.bindVertexBuffers(0, [this.trackBuffer], [0]);
        commandBuffer.bindPipeline(nvk.PipelineBindPoint.GRAPHICS, pipeline);
        commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
            this.position.x,
            this.position.y + (this.size.height - 4) / 2 // Center the track
        ]));
        commandBuffer.draw(4, 1, 0, 0);

        // Render handle
        commandBuffer.bindVertexBuffers(0, [this.handleBuffer], [0]);
        commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
            this.handleX,
            this.position.y
        ]));
        commandBuffer.draw(4, 1, 0, 0);
    }
}

class Checkbox extends UIComponent {
    constructor(id, parentElement, label) {
        super(id, parentElement);
        this.label = label || '';
        this.checked = false;
        this.changeHandlers = [];
        this.boxSize = 20;
        this.color = [0.3, 0.3, 0.3, 1.0];
        this.checkColor = [0.8, 0.8, 0.8, 1.0];
        this.labelColor = [1.0, 1.0, 1.0, 1.0];
    }

    setChecked(checked) {
        this.checked = checked;
        this.changeHandlers.forEach(handler => handler(checked));
        return this;
    }

    isChecked() {
        return this.checked;
    }

    onChange(callback) {
        if (typeof callback === 'function') {
            this.changeHandlers.push(callback);
        }
        return this;
    }

    initializeGraphics(device) {
        this.device = device;

        // Create box buffer
        this.boxBuffer = renderUtils.createRect(
            device,
            this.boxSize,
            this.boxSize,
            this.color
        );

        // Create checkmark buffer (diagonal line)
        const checkVertices = new Float32Array([
            4, 10,    this.checkColor[0], this.checkColor[1], this.checkColor[2], this.checkColor[3],
            8, 14,    this.checkColor[0], this.checkColor[1], this.checkColor[2], this.checkColor[3],
            16, 6,    this.checkColor[0], this.checkColor[1], this.checkColor[2], this.checkColor[3]
        ]);
        this.checkBuffer = new nvk.Buffer(device, {
            size: checkVertices.byteLength,
            usage: nvk.BufferUsage.VERTEX_BUFFER,
            data: checkVertices
        });

        // Create label texture if label exists
        if (this.label) {
            this.labelTexture = renderUtils.createText(device, this.label);
        }
    }

    handleInput(x, y, type) {
        if (!this.isEnabled) return;

        const isInBox = x >= this.position.x && 
                       x <= this.position.x + this.boxSize &&
                       y >= this.position.y && 
                       y <= this.position.y + this.boxSize;

        if (type === 'click' && isInBox) {
            this.setChecked(!this.checked);
        }
    }

    render(commandBuffer, pipeline) {
        if (!this.isVisible) return;

        // Render box
        commandBuffer.bindVertexBuffers(0, [this.boxBuffer], [0]);
        commandBuffer.bindPipeline(nvk.PipelineBindPoint.GRAPHICS, pipeline);
        commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
            this.position.x,
            this.position.y
        ]));
        commandBuffer.draw(4, 1, 0, 0);

        // Render checkmark if checked
        if (this.checked) {
            commandBuffer.bindVertexBuffers(0, [this.checkBuffer], [0]);
            commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
                this.position.x,
                this.position.y
            ]));
            commandBuffer.draw(3, 1, 0, 0); // Draw checkmark as line strip
        }

        // Render label if exists
        if (this.labelTexture) {
            commandBuffer.bindDescriptorSets(
                nvk.PipelineBindPoint.GRAPHICS,
                pipeline.layout,
                0,
                [this.labelTexture.descriptorSet]
            );

            commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
                this.position.x + this.boxSize + 10,
                this.position.y + (this.boxSize - this.labelTexture.height) / 2
            ]));

            commandBuffer.draw(4, 1, 0, 0);
        }
    }
}

class InputBox extends UIComponent {
    constructor(id, parentElement, placeholder = '') {
        super(id, parentElement);
        this.value = '';
        this.placeholder = placeholder;
        this.focused = false;
        this.cursorPosition = 0;
        this.inputHandlers = [];
        this.color = [0.2, 0.2, 0.2, 1.0]; // Background color
        this.textColor = [1.0, 1.0, 1.0, 1.0]; // Text color
        this.placeholderColor = [0.5, 0.5, 0.5, 1.0]; // Placeholder color
        this.cursorColor = [1.0, 1.0, 1.0, 0.8]; // Cursor color
    }

    setValue(value) {
        this.value = value;
        this.updateTextTexture();
        this.inputHandlers.forEach(handler => handler(value));
        return this;
    }

    getValue() {
        return this.value;
    }

    onInput(callback) {
        if (typeof callback === 'function') {
            this.inputHandlers.push(callback);
        }
        return this;
    }

    updateTextTexture() {
        if (this.textTexture) {
            this.textTexture.destroy();
        }
        
        const textToRender = this.value || this.placeholder;
        const color = this.value ? this.textColor : this.placeholderColor;
        
        this.textTexture = renderUtils.createText(
            this.device, 
            textToRender, 
            14, // fontSize
            color
        );
    }

    initializeGraphics(device) {
        this.device = device;

        // Create background buffer
        this.backgroundBuffer = renderUtils.createRect(
            device,
            this.size.width,
            this.size.height,
            this.color
        );

        // Create cursor buffer
        this.cursorBuffer = renderUtils.createRect(
            device,
            2, // Cursor width
            this.size.height - 6, // Cursor height (slight padding)
            this.cursorColor
        );

        this.updateTextTexture();
    }

    handleInput(x, y, type, key) {
        if (!this.isEnabled) return;

        const isInside = x >= this.position.x && 
                        x <= this.position.x + this.size.width &&
                        y >= this.position.y && 
                        y <= this.position.y + this.size.height;

        if (type === 'click') {
            this.focused = isInside;
            if (isInside) {
                // Calculate cursor position based on click x position
                const textWidth = this.textTexture ? this.textTexture.width : 0;
                const clickOffset = x - (this.position.x + 5);
                this.cursorPosition = Math.round((clickOffset / textWidth) * this.value.length);
            }
        } else if (type === 'keypress' && this.focused) {
            if (key === 'Backspace') {
                if (this.cursorPosition > 0) {
                    this.value = this.value.slice(0, this.cursorPosition - 1) + 
                                this.value.slice(this.cursorPosition);
                    this.cursorPosition--;
                }
            } else if (key === 'ArrowLeft') {
                this.cursorPosition = Math.max(0, this.cursorPosition - 1);
            } else if (key === 'ArrowRight') {
                this.cursorPosition = Math.min(this.value.length, this.cursorPosition + 1);
            } else if (key.length === 1) {
                this.value = this.value.slice(0, this.cursorPosition) + 
                            key + 
                            this.value.slice(this.cursorPosition);
                this.cursorPosition++;
            }
            this.updateTextTexture();
            this.inputHandlers.forEach(handler => handler(this.value));
        }
    }

    render(commandBuffer, pipeline) {
        if (!this.isVisible) return;

        // Render background
        commandBuffer.bindVertexBuffers(0, [this.backgroundBuffer], [0]);
        commandBuffer.bindPipeline(nvk.PipelineBindPoint.GRAPHICS, pipeline);
        commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
            this.position.x,
            this.position.y
        ]));
        commandBuffer.draw(4, 1, 0, 0);

        // Render text
        if (this.textTexture) {
            commandBuffer.bindDescriptorSets(
                nvk.PipelineBindPoint.GRAPHICS,
                pipeline.layout,
                0,
                [this.textTexture.descriptorSet]
            );

            commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
                this.position.x + 5, // Text padding
                this.position.y + (this.size.height - this.textTexture.height) / 2
            ]));

            commandBuffer.draw(4, 1, 0, 0);
        }

        // Render cursor if focused
        if (this.focused) {
            const cursorX = this.position.x + 5 + 
                           (this.textTexture ? 
                            (this.cursorPosition / this.value.length) * this.textTexture.width : 
                            0);

            commandBuffer.bindVertexBuffers(0, [this.cursorBuffer], [0]);
            commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
                cursorX,
                this.position.y + 3 // Slight padding
            ]));
            commandBuffer.draw(4, 1, 0, 0);
        }
    }
}

class ColorPicker extends UIComponent {
    constructor(id, parentElement) {
        super(id, parentElement);
        this.size = { width: 200, height: 200 };
        this.selectedColor = [1.0, 0.0, 0.0, 1.0]; // Start with red
        this.selectHandlers = [];
        this.isDragging = false;
        this.huePosition = 0;
        this.saturationPosition = 1.0;
        this.valuePosition = 1.0;
    }

    setColor(r, g, b) {
        this.selectedColor = [r, g, b, 1.0];
        this.updateFromRGB();
        this.selectHandlers.forEach(handler => handler(this.selectedColor));
        return this;
    }

    getColor() {
        return [...this.selectedColor];
    }

    onSelect(callback) {
        if (typeof callback === 'function') {
            this.selectHandlers.push(callback);
        }
        return this;
    }

    updateFromRGB() {
        // Convert RGB to HSV
        const r = this.selectedColor[0];
        const g = this.selectedColor[1];
        const b = this.selectedColor[2];
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        
        let h = 0;
        if (d === 0) h = 0;
        else if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else if (max === b) h = (r - g) / d + 4;
        
        h = h < 0 ? h + 6 : h;
        
        this.huePosition = h / 6;
        this.saturationPosition = max === 0 ? 0 : d / max;
        this.valuePosition = max;
    }

    initializeGraphics(device) {
        this.device = device;

        // Create color palette buffer
        this.paletteBuffer = renderUtils.createRect(
            device,
            this.size.width,
            this.size.height,
            [1.0, 1.0, 1.0, 1.0]
        );

        // Create selector circle
        const circleVertices = this.createCircleVertices(5, [1.0, 1.0, 1.0, 1.0]);
        this.selectorBuffer = new nvk.Buffer(device, {
            size: circleVertices.byteLength,
            usage: nvk.BufferUsage.VERTEX_BUFFER,
            data: circleVertices
        });
    }

    createCircleVertices(radius, color) {
        const segments = 32;
        const vertices = [];
        
        // Center vertex
        vertices.push(0, 0, ...color);
        
        // Circle vertices
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            vertices.push(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                ...color
            );
        }
        
        return new Float32Array(vertices);
    }

    handleInput(x, y, type) {
        if (!this.isEnabled) return;

        const localX = x - this.position.x;
        const localY = y - this.position.y;
        const isInside = localX >= 0 && 
                        localX <= this.size.width &&
                        localY >= 0 && 
                        localY <= this.size.height;

        if (type === 'mousedown' && isInside) {
            this.isDragging = true;
            this.updateColorFromPosition(localX, localY);
        } else if (type === 'mousemove' && this.isDragging) {
            this.updateColorFromPosition(localX, localY);
        } else if (type === 'mouseup') {
            this.isDragging = false;
        }
    }

    updateColorFromPosition(x, y) {
        // Convert coordinates to HSV
        const h = Math.max(0, Math.min(1, x / this.size.width));
        const s = Math.max(0, Math.min(1, x / this.size.width));
        const v = Math.max(0, Math.min(1, 1 - (y / this.size.height)));

        this.huePosition = h;
        this.saturationPosition = s;
        this.valuePosition = v;

        // Convert HSV to RGB
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);

        let r, g, b;
        switch (i % 6) {
            case 0: [r, g, b] = [v, t, p]; break;
            case 1: [r, g, b] = [q, v, p]; break;
            case 2: [r, g, b] = [p, v, t]; break;
            case 3: [r, g, b] = [p, q, v]; break;
            case 4: [r, g, b] = [t, p, v]; break;
            case 5: [r, g, b] = [v, p, q]; break;
        }

        this.selectedColor = [r, g, b, 1.0];
        this.selectHandlers.forEach(handler => handler(this.selectedColor));
    }

    render(commandBuffer, pipeline) {
        if (!this.isVisible) return;

        // Render color palette
        commandBuffer.bindVertexBuffers(0, [this.paletteBuffer], [0]);
        commandBuffer.bindPipeline(nvk.PipelineBindPoint.GRAPHICS, pipeline);
        
        // Push constants for position and HSV values
        commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX | nvk.ShaderStage.FRAGMENT, 0, new Float32Array([
            this.position.x, this.position.y,    // Position
            this.huePosition,                    // Hue
            this.saturationPosition,             // Saturation
            this.valuePosition                   // Value
        ]));
        
        commandBuffer.draw(4, 1, 0, 0);

        // Render selector circle
        const selectorX = this.position.x + (this.huePosition * this.size.width);
        const selectorY = this.position.y + ((1 - this.valuePosition) * this.size.height);

        commandBuffer.bindVertexBuffers(0, [this.selectorBuffer], [0]);
        commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
            selectorX,
            selectorY
        ]));
        
        commandBuffer.draw(33, 1, 0, 0); // 32 segments + center vertex
    }
}

class Dropdown extends UIComponent {
    constructor(id, parentElement, options = []) {
        super(id, parentElement);
        this.options = options.map(opt => ({
            value: opt.value || opt,
            label: opt.label || opt
        }));
        this.selectedIndex = 0;
        this.isOpen = false;
        this.changeHandlers = [];
        this.color = [0.2, 0.2, 0.2, 1.0]; // Background color
        this.hoverColor = [0.3, 0.3, 0.3, 1.0]; // Hover color
        this.textColor = [1.0, 1.0, 1.0, 1.0]; // Text color
        this.hoveredIndex = -1;
        this.itemHeight = 24;
    }

    setOptions(options) {
        this.options = options.map(opt => ({
            value: opt.value || opt,
            label: opt.label || opt
        }));
        if (this.selectedIndex >= this.options.length) {
            this.selectedIndex = 0;
        }
        this.updateTextures();
        return this;
    }

    getValue() {
        return this.options[this.selectedIndex]?.value;
    }

    setValue(value) {
        const index = this.options.findIndex(opt => opt.value === value);
        if (index !== -1) {
            this.selectedIndex = index;
            this.updateTextures();
            this.changeHandlers.forEach(handler => handler(this.getValue()));
        }
        return this;
    }

    onChange(callback) {
        if (typeof callback === 'function') {
            this.changeHandlers.push(callback);
        }
        return this;
    }

    updateTextures() {
        if (this.textTextures) {
            this.textTextures.forEach(texture => texture.destroy());
        }

        this.textTextures = this.options.map(option =>
            renderUtils.createText(this.device, option.label)
        );
    }

    initializeGraphics(device) {
        this.device = device;

        // Create background buffer for main button
        this.mainBuffer = renderUtils.createRect(
            device,
            this.size.width,
            this.itemHeight,
            this.color
        );

        // Create background buffer for dropdown items
        this.itemBuffer = renderUtils.createRect(
            device,
            this.size.width,
            this.itemHeight,
            this.color
        );

        // Create arrow indicator
        const arrowVertices = new Float32Array([
            0, 0,       1, 1, 1, 1,
            5, 5,       1, 1, 1, 1,
            10, 0,      1, 1, 1, 1
        ]);
        this.arrowBuffer = new nvk.Buffer(device, {
            size: arrowVertices.byteLength,
            usage: nvk.BufferUsage.VERTEX_BUFFER,
            data: arrowVertices
        });

        this.updateTextures();
    }

    handleInput(x, y, type) {
        if (!this.isEnabled) return;

        const isInMainButton = x >= this.position.x && 
                             x <= this.position.x + this.size.width &&
                             y >= this.position.y && 
                             y <= this.position.y + this.itemHeight;

        const isInDropdown = this.isOpen &&
                           x >= this.position.x && 
                           x <= this.position.x + this.size.width &&
                           y >= this.position.y + this.itemHeight && 
                           y <= this.position.y + this.itemHeight * (this.options.length + 1);

        if (type === 'click') {
            if (isInMainButton) {
                this.isOpen = !this.isOpen;
            } else if (isInDropdown) {
                const clickedIndex = Math.floor((y - (this.position.y + this.itemHeight)) / this.itemHeight);
                if (clickedIndex >= 0 && clickedIndex < this.options.length) {
                    this.selectedIndex = clickedIndex;
                    this.isOpen = false;
                    this.changeHandlers.forEach(handler => handler(this.getValue()));
                }
            } else {
                this.isOpen = false;
            }
        } else if (type === 'mousemove') {
            if (isInDropdown) {
                this.hoveredIndex = Math.floor((y - (this.position.y + this.itemHeight)) / this.itemHeight);
            } else {
                this.hoveredIndex = -1;
            }
        }
    }

    render(commandBuffer, pipeline) {
        if (!this.isVisible) return;

        // Render main button
        commandBuffer.bindVertexBuffers(0, [this.mainBuffer], [0]);
        commandBuffer.bindPipeline(nvk.PipelineBindPoint.GRAPHICS, pipeline);
        commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
            this.position.x,
            this.position.y
        ]));
        commandBuffer.draw(4, 1, 0, 0);

        // Render selected option text
        if (this.textTextures && this.textTextures[this.selectedIndex]) {
            commandBuffer.bindDescriptorSets(
                nvk.PipelineBindPoint.GRAPHICS,
                pipeline.layout,
                0,
                [this.textTextures[this.selectedIndex].descriptorSet]
            );

            commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
                this.position.x + 5,
                this.position.y + (this.itemHeight - this.textTextures[this.selectedIndex].height) / 2
            ]));
            commandBuffer.draw(4, 1, 0, 0);
        }

        // Render arrow
        commandBuffer.bindVertexBuffers(0, [this.arrowBuffer], [0]);
        commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
            this.position.x + this.size.width - 20,
            this.position.y + (this.itemHeight - 10) / 2
        ]));
        commandBuffer.draw(3, 1, 0, 0);

        // Render dropdown if open
        if (this.isOpen) {
            for (let i = 0; i < this.options.length; i++) {
                const itemY = this.position.y + (i + 1) * this.itemHeight;
                
                // Render item background
                commandBuffer.bindVertexBuffers(0, [this.itemBuffer], [0]);
                commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
                    this.position.x,
                    itemY
                ]));
                
                // Use hover color if this item is hovered
                if (i === this.hoveredIndex) {
                    commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.FRAGMENT, 8, new Float32Array(this.hoverColor));
                } else {
                    commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.FRAGMENT, 8, new Float32Array(this.color));
                }
                
                commandBuffer.draw(4, 1, 0, 0);

                // Render item text
                if (this.textTextures[i]) {
                    commandBuffer.bindDescriptorSets(
                        nvk.PipelineBindPoint.GRAPHICS,
                        pipeline.layout,
                        0,
                        [this.textTextures[i].descriptorSet]
                    );

                    commandBuffer.pushConstants(pipeline.layout, nvk.ShaderStage.VERTEX, 0, new Float32Array([
                        this.position.x + 5,
                        itemY + (this.itemHeight - this.textTextures[i].height) / 2
                    ]));
                    commandBuffer.draw(4, 1, 0, 0);
                }
            }
        }
    }
}

class MenuPage extends UIComponent {
    constructor(id, parentElement) {
        super(id, parentElement);
        this.element.classList.add('mist-menu-page');
        this.components = new Map();
    }

    addComponent(component) {
        this.components.set(component.id, component);
        this.element.appendChild(component.element);
        return this;
    }

    removeComponent(componentId) {
        const component = this.components.get(componentId);
        if (component) {
            this.element.removeChild(component.element);
            this.components.delete(componentId);
        }
        return this;
    }

    getComponent(componentId) {
        return this.components.get(componentId);
    }

    getState() {
        const state = {};
        this.components.forEach((component, id) => {
            if (component.getValue) {
                state[id] = component.getValue();
            }
        });
        return state;
    }

    setState(state) {
        Object.entries(state).forEach(([id, value]) => {
            const component = this.components.get(id);
            if (component && component.setValue) {
                component.setValue(value);
            }
        });
        return this;
    }
}

class MenuManager extends UIComponent {
    constructor(id, parentElement) {
        super(id, parentElement);
        this.element.classList.add('mist-menu-manager');
        this.pages = new Map();
        this.currentPage = null;
        this.history = [];
        this.configPath = './settings.config';
    }

    addPage(page) {
        this.pages.set(page.id, page);
        page.hide();
        this.element.appendChild(page.element);
        return this;
    }

    removePage(pageId) {
        const page = this.pages.get(pageId);
        if (page) {
            this.element.removeChild(page.element);
            this.pages.delete(pageId);
        }
        return this;
    }

    showPage(pageId) {
        const page = this.pages.get(pageId);
        if (page) {
            if (this.currentPage) {
                this.currentPage.hide();
                this.history.push(this.currentPage.id);
            }
            this.currentPage = page;
            page.show();
        }
        return this;
    }

    back() {
        if (this.history.length > 0) {
            const previousPageId = this.history.pop();
            if (this.currentPage) {
                this.currentPage.hide();
            }
            this.currentPage = this.pages.get(previousPageId);
            if (this.currentPage) {
                this.currentPage.show();
            }
        }
        return this;
    }

    getState() {
        const state = {};
        this.pages.forEach((page, id) => {
            state[id] = page.getState();
        });
        return state;
    }

    setState(state) {
        Object.entries(state).forEach(([pageId, pageState]) => {
            const page = this.pages.get(pageId);
            if (page) {
                page.setState(pageState);
            }
        });
        return this;
    }

    async saveConfig() {
        const state = this.getState();
        try {
            const fs = await import('node:fs/promises');
            await fs.writeFile(this.configPath, JSON.stringify(state, null, 2));
            return true;
        } catch (error) {
            console.error('Failed to save config:', error);
            return false;
        }
    }

    async loadConfig() {
        try {
            const fs = await import('node:fs/promises');
            const data = await fs.readFile(this.configPath, 'utf8');
            const state = JSON.parse(data);
            this.setState(state);
            return true;
        } catch (error) {
            console.error('Failed to load config:', error);
            return false;
        }
    }

    setConfigPath(path) {
        this.configPath = path;
        return this;
    }
}


export {
    UIComponent,
    Button,
    Slider,
    Checkbox,
    InputBox,
    ColorPicker,
    Dropdown,
    MenuPage,
    MenuManager
};
