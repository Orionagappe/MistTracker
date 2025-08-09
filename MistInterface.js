/**
 * MistInterface.js - UI Component System for Mist Platform
 */

class UIComponent {
    constructor(id, parentElement) {
        this.id = id;
        this.element = document.createElement('div');
        this.element.id = id;
        this.element.classList.add('mist-component');
        this.isVisible = true;
        this.isEnabled = true;
        this.tooltip = '';
        if (parentElement) {
            parentElement.appendChild(this.element);
        }
    }

    setPosition(x, y) {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        return this;
    }

    setSize(width, height) {
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
        return this;
    }

    setTooltip(text) {
        this.tooltip = text;
        this.element.title = text;
        return this;
    }

    show() {
        this.isVisible = true;
        this.element.style.display = 'block';
        return this;
    }

    hide() {
        this.isVisible = false;
        this.element.style.display = 'none';
        return this;
    }

    enable() {
        this.isEnabled = true;
        this.element.classList.remove('mist-disabled');
        return this;
    }

    disable() {
        this.isEnabled = false;
        this.element.classList.add('mist-disabled');
        return this;
    }
}

class Button extends UIComponent {
    constructor(id, parentElement, text) {
        super(id, parentElement);
        this.element = document.createElement('button');
        this.element.id = id;
        this.element.classList.add('mist-button');
        this.setText(text);
        if (parentElement) {
            parentElement.appendChild(this.element);
        }
    }

    setText(text) {
        this.element.textContent = text;
        return this;
    }

    onClick(callback) {
        this.element.addEventListener('click', (e) => {
            if (this.isEnabled) {
                callback(e);
            }
        });
        return this;
    }
}

class Slider extends UIComponent {
    constructor(id, parentElement, min = 0, max = 100, step = 1) {
        super(id, parentElement);
        this.element = document.createElement('input');
        this.element.type = 'range';
        this.element.id = id;
        this.element.classList.add('mist-slider');
        this.element.min = min;
        this.element.max = max;
        this.element.step = step;
        if (parentElement) {
            parentElement.appendChild(this.element);
        }
    }

    setValue(value) {
        this.element.value = value;
        return this;
    }

    getValue() {
        return parseFloat(this.element.value);
    }

    onChange(callback) {
        this.element.addEventListener('input', (e) => {
            if (this.isEnabled) {
                callback(parseFloat(e.target.value));
            }
        });
        return this;
    }
}

class Checkbox extends UIComponent {
    constructor(id, parentElement, label) {
        super(id, parentElement);
        this.container = document.createElement('div');
        this.container.classList.add('mist-checkbox-container');
        
        this.element = document.createElement('input');
        this.element.type = 'checkbox';
        this.element.id = id;
        this.element.classList.add('mist-checkbox');
        
        this.label = document.createElement('label');
        this.label.htmlFor = id;
        this.label.textContent = label;
        
        this.container.appendChild(this.element);
        this.container.appendChild(this.label);
        
        if (parentElement) {
            parentElement.appendChild(this.container);
        }
    }

    setChecked(checked) {
        this.element.checked = checked;
        return this;
    }

    isChecked() {
        return this.element.checked;
    }

    onChange(callback) {
        this.element.addEventListener('change', (e) => {
            if (this.isEnabled) {
                callback(e.target.checked);
            }
        });
        return this;
    }
}

class InputBox extends UIComponent {
    constructor(id, parentElement, placeholder = '') {
        super(id, parentElement);
        this.element = document.createElement('input');
        this.element.type = 'text';
        this.element.id = id;
        this.element.classList.add('mist-input');
        this.element.placeholder = placeholder;
        if (parentElement) {
            parentElement.appendChild(this.element);
        }
    }

    setValue(value) {
        this.element.value = value;
        return this;
    }

    getValue() {
        return this.element.value;
    }

    onInput(callback) {
        this.element.addEventListener('input', (e) => {
            if (this.isEnabled) {
                callback(e.target.value);
            }
        });
        return this;
    }
}

class ColorPicker extends UIComponent {
    constructor(id, parentElement) {
        super(id, parentElement);
        this.element = document.createElement('div');
        this.element.id = id;
        this.element.classList.add('mist-color-picker');
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = 200;
        this.canvas.height = 200;
        this.ctx = this.canvas.getContext('2d');
        
        this.element.appendChild(this.canvas);
        if (parentElement) {
            parentElement.appendChild(this.element);
        }
        
        this.drawColorPalette();
        this.setupEventListeners();
    }

    drawColorPalette() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Draw main color gradient
        const gradientX = this.ctx.createLinearGradient(0, 0, width, 0);
        gradientX.addColorStop(0, '#ff0000');
        gradientX.addColorStop(0.17, '#ff00ff');
        gradientX.addColorStop(0.33, '#0000ff');
        gradientX.addColorStop(0.5, '#00ffff');
        gradientX.addColorStop(0.67, '#00ff00');
        gradientX.addColorStop(0.83, '#ffff00');
        gradientX.addColorStop(1, '#ff0000');
        
        this.ctx.fillStyle = gradientX;
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw brightness gradient
        const gradientY = this.ctx.createLinearGradient(0, 0, 0, height);
        gradientY.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradientY.addColorStop(1, 'rgba(0, 0, 0, 1)');
        
        this.ctx.fillStyle = gradientY;
        this.ctx.fillRect(0, 0, width, height);
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (!this.isEnabled) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const imageData = this.ctx.getImageData(x, y, 1, 1).data;
            const color = `rgb(${imageData[0]}, ${imageData[1]}, ${imageData[2]})`;
            
            if (this.onColorSelect) {
                this.onColorSelect(color);
            }
        });
    }

    onSelect(callback) {
        this.onColorSelect = callback;
        return this;
    }
}

class Dropdown extends UIComponent {
    constructor(id, parentElement, options = []) {
        super(id, parentElement);
        this.element = document.createElement('select');
        this.element.id = id;
        this.element.classList.add('mist-dropdown');
        
        this.setOptions(options);
        
        if (parentElement) {
            parentElement.appendChild(this.element);
        }
    }

    setOptions(options) {
        this.element.innerHTML = '';
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value || option;
            opt.textContent = option.label || option;
            this.element.appendChild(opt);
        });
        return this;
    }

    getValue() {
        return this.element.value;
    }

    setValue(value) {
        this.element.value = value;
        return this;
    }

    onChange(callback) {
        this.element.addEventListener('change', (e) => {
            if (this.isEnabled) {
                callback(e.target.value);
            }
        });
        return this;
    }
}

// Export the classes
export {
    UIComponent,
    Button,
    Slider,
    Checkbox,
    InputBox,
    ColorPicker,
    Dropdown
};
