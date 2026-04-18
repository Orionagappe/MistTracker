/**
 * MistInterface.js - UI Component System for Mist Platform (MVP - No Vulkan)
 * This is a minimal stub version for the MVP. Full Vulkan rendering in Phase 2.
 */

// MVP: No external dependencies for now

// ===== MVP STUBS: No Vulkan rendering =====

/**
 * Base component class - MVP version
 */
class UIComponent {
    constructor(id) {
        this.id = id;
        this.isVisible = true;
        this.isEnabled = true;
        this.value = null;
        this.label = '';
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
        return this;
    }

    disable() {
        this.isEnabled = false;
        return this;
    }

    setLabel(label) {
        this.label = label;
        return this;
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value;
        return this;
    }
}

/**
 * Button component - MVP version
 */
class Button extends UIComponent {
    constructor(id) {
        super(id);
        this.onClick = () => {};
    }

    onClick(callback) {
        this.onClick = callback;
        return this;
    }
}

/**
 * Slider component - MVP version
 */
class Slider extends UIComponent {
    constructor(id) {
        super(id);
        this.min = 0;
        this.max = 100;
        this.value = 50;
    }

    setRange(min, max) {
        this.min = min;
        this.max = max;
        return this;
    }
}

/**
 * Checkbox component - MVP version
 */
class Checkbox extends UIComponent {
    constructor(id) {
        super(id);
        this.checked = false;
    }

    getValue() {
        return this.checked;
    }

    setValue(checked) {
        this.checked = checked;
        return this;
    }
}

/**
 * InputBox component - MVP version
 */
class InputBox extends UIComponent {
    constructor(id) {
        super(id);
        this.value = '';
        this.placeholder = '';
    }

    setPlaceholder(text) {
        this.placeholder = text;
        return this;
    }
}

/**
 * ColorPicker component - MVP version
 */
class ColorPicker extends UIComponent {
    constructor(id) {
        super(id);
        this.value = '#FFFFFF';
    }

    getValue() {
        return this.value;
    }

    setValue(color) {
        this.value = color;
        return this;
    }
}

/**
 * Dropdown component - MVP version
 */
class Dropdown extends UIComponent {
    constructor(id) {
        super(id);
        this.options = [];
        this.selectedIndex = 0;
    }

    setOptions(options) {
        this.options = options;
        return this;
    }

    getValue() {
        return this.options[this.selectedIndex] || null;
    }
}

/**
 * MenuPage component - MVP version
 */
class MenuPage extends UIComponent {
    constructor(id) {
        super(id);
        this.components = new Map();
        this.title = '';
    }

    addComponent(component) {
        this.components.set(component.id, component);
        return this;
    }

    getComponent(id) {
        return this.components.get(id);
    }

    setTitle(title) {
        this.title = title;
        return this;
    }
}

/**
 * MenuManager component - MVP version
 */
class MenuManager extends UIComponent {
    constructor(name) {
        super(name);
        this.name = name;
        this.pages = new Map();
        this.currentPage = null;
    }

    addPage(page) {
        this.pages.set(page.id, page);
        return this;
    }

    showPage(pageId) {
        if (this.pages.has(pageId)) {
            this.currentPage = pageId;
            console.log(`[MenuManager] Showing page: ${pageId}`);
            return this.pages.get(pageId);
        }
        return null;
    }

    getCurrentPage() {
        return this.pages.get(this.currentPage);
    }

    getComponent(componentId) {
        const page = this.getCurrentPage();
        return page ? page.getComponent(componentId) : null;
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
