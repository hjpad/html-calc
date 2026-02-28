class CalcPadEngine {
    constructor() {
        this.variables = {};
        this.math = math;
        this.math.config({
            number: 'BigNumber',
            precision: 64
        });

        // Create unit-aware math instance
        this.unitMath = math.create(math.all);
        this.unitMath.config({
            number: 'BigNumber',
            precision: 64
        });

        // Initialize units handler
        this.unitsHandler = new UnitsHandler();
    }

    async ensureUnitsLoaded() {
        if (!this.unitsHandler.loaded) {
            await this.unitsHandler.loadConfig();
        }
    }

    // Modify the convertUnit helper method (add this new method)
    async convertWithUnits(value, targetUnit) {
        await this.ensureUnitsLoaded();
        
        // Extract numeric value and source unit if value is a Unit object
        let numericValue = value;
        let sourceUnit = null;
        
        // if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Unit') {
        //     numericValue = parseFloat(value.toNumber());
        //     sourceUnit = value.formatUnits();
        // }
        
        // // Try custom units first
        // if (sourceUnit && this.unitsHandler.canConvert(sourceUnit, targetUnit)) {
        //     const result = this.unitsHandler.convert(numericValue, sourceUnit, targetUnit);
        //     if (result !== null) {
        //         return result;
        //     }
        // }
        
        // Fall back to math.js
        try {
            return this.unitMath.evaluate(`${value} to ${targetUnit}`);
        } catch (error) {
            // If math.js fails, try custom conversion without source unit
            const result = this.unitsHandler.convert(numericValue, targetUnit, targetUnit);
            if (result !== null) {
                return result;
            }
            throw error;
        }
    }

    reset() {
        this.variables = {};
    }

    async processLine(line) {
        const trimmedLine = line.trim();
        
        if (!trimmedLine || trimmedLine.startsWith('#')) {
            return { type: 'text', content: line };
        }

        // Extract and remove description (text in single quotes)
        let description = '';
        let cleanLine = trimmedLine;
        
        const descriptionMatch = trimmedLine.match(/^'([^']+)'\s*(.*)$/);
        if (descriptionMatch) {
            description = descriptionMatch[1];
            cleanLine = descriptionMatch[2].trim();
        }

        // Normalize temperature units before processing
        // Replace °C with degC, °F with degF
        cleanLine = cleanLine.replace(/°C/g, 'degC');
        cleanLine = cleanLine.replace(/°F/g, 'degF');
        // Be careful with standalone C and F - only replace if they're clearly units
        // Don't replace C or F that are part of variable names
        cleanLine = cleanLine.replace(/(\d+)\s*C\b/g, '$1 degC'); // Number followed by C
        cleanLine = cleanLine.replace(/(\d+)\s*F\b/g, '$1 degF'); // Number followed by F

        // Check for assignment with trailing "=" and optional precision/unit in either order
        let assignmentWithResultMatch = cleanLine.match(/^([a-zA-Z\u0370-\u03FF_][a-zA-Z0-9\u0370-\u03FF_]*)\s*=\s*(.+?)\s*=\s*\[([^\]]+)\]\s*$/);
        if (assignmentWithResultMatch) {
            const varName = assignmentWithResultMatch[1];
            const expression = assignmentWithResultMatch[2].trim();
            const bracketContent = assignmentWithResultMatch[3].trim();
            
            // Parse bracket content - could be "2, mm" or "mm, 2"
            const parts = bracketContent.split(',').map(p => p.trim());
            let precision = null;
            let targetUnit = null;
            
            if (parts.length === 2) {
                // Check which part is the number
                if (!isNaN(parts[0])) {
                    precision = parseInt(parts[0]);
                    targetUnit = parts[1];
                } else if (!isNaN(parts[1])) {
                    precision = parseInt(parts[1]);
                    targetUnit = parts[0];
                }
            } else if (parts.length === 1) {
                // Single value - check if it's a number or unit
                if (!isNaN(parts[0])) {
                    precision = parseInt(parts[0]);
                } else {
                    targetUnit = parts[0];
                }
            }
            
            try {
                const result = this.evaluate(expression);
                let finalResult = result;
                
                if (targetUnit) {
                    try {
                        finalResult = await this.convertWithUnits(result, targetUnit);
                    } catch (convError) {
                        return {
                            type: 'error',
                            content: line,
                            error: `Error #132: ${convError.message}`
                        };
                    }
                }
                
                this.variables[varName] = finalResult;
                return {
                    type: 'calculation_with_result',
                    content: line,
                    description: description,
                    variable: varName,
                    expression: expression,
                    result: this.formatNumber(finalResult, precision),
                    precision: precision
                };

            } catch (error) {
                return {
                    type: 'error',
                    content: line,
                    error: `Error #152: ${error.message}`
                };
            }
        }
        
        // Check for assignment with unit only (e.g., "speed = 100 km/h = [m/s]")
        assignmentWithResultMatch = cleanLine.match(/^([a-zA-Z\u0370-\u03FF_][a-zA-Z0-9\u0370-\u03FF_]*)\s*=\s*(.+?)\s*=\s*\[([^\],\d][^\]]*)\]\s*$/);
        if (assignmentWithResultMatch) {
            const varName = assignmentWithResultMatch[1];
            const expression = assignmentWithResultMatch[2].trim();
            const targetUnit = assignmentWithResultMatch[3].trim();
            
            try {
                const result = this.evaluate(expression);
                const converted = this.unitMath.evaluate(`${result} to ${targetUnit}`);
                this.variables[varName] = converted;
                return {
                    type: 'calculation_with_result',
                    content: line,
                    description: description,
                    variable: varName,
                    expression: expression,
                    result: this.formatNumber(converted, null),
                    precision: null
                };
            } catch (error) {
                return {
                    type: 'error',
                    content: line,
                    error: `Error #181: ${error.message}`
                };
            }
        }

        // Check for assignment with result and unit conversion using | (e.g., "var = expr = | unit")
        let assignmentWithResultAndPipeUnitMatch = cleanLine.match(/^([a-zA-Z\u0370-\u03FF_][a-zA-Z0-9\u0370-\u03FF_]*)\s*=\s*(.+?)\s*=\s*\|\s*(.+)\s*$/);
        if (assignmentWithResultAndPipeUnitMatch) {
            const varName = assignmentWithResultAndPipeUnitMatch[1];
            const expression = assignmentWithResultAndPipeUnitMatch[2].trim();
            const targetUnit = assignmentWithResultAndPipeUnitMatch[3].trim();

            try {
                const result = this.evaluate(expression);
                const finalResult = await this.convertWithUnits(result, targetUnit);
                this.variables[varName] = finalResult;
                
                return {
                    type: 'calculation_with_result',
                    content: line,
                    description: description,
                    variable: varName,
                    expression: expression,
                    result: this.formatNumber(finalResult, null) + ` ${targetUnit}`,
                    precision: null
                };
            } catch (error) {
                return {
                    type: 'error',
                    content: line,
                    error: `Assignment/Conversion Error: ${error.message}`
                };
            }
        }

    
        // Check for assignment with precision only (e.g., "sum = a + b = [2]")
        assignmentWithResultMatch = cleanLine.match(/^([a-zA-Z\u0370-\u03FF_][a-zA-Z0-9\u0370-\u03FF_]*)\s*=\s*(.+?)\s*=\s*\[(\d+)\]\s*$/);
        if (assignmentWithResultMatch) {
            const varName = assignmentWithResultMatch[1];
            const expression = assignmentWithResultMatch[2].trim();
            const precision = parseInt(assignmentWithResultMatch[3]);
            
            try {
                const result = this.evaluate(expression);
                this.variables[varName] = result;
                return {
                    type: 'calculation_with_result',
                    content: line,
                    description: description,
                    variable: varName,
                    expression: expression,
                    result: this.formatNumber(result, precision),
                    precision: precision
                };
            } catch (error) {
                return {
                    type: 'error',
                    content: line,
                    error: error.message
                };
            }
        }
        
        // Then try without precision bracket
        assignmentWithResultMatch = cleanLine.match(/^([a-zA-Z\u0370-\u03FF_][a-zA-Z0-9\u0370-\u03FF_]*)\s*=\s*(.+?)\s*=\s*$/);
        if (assignmentWithResultMatch) {
            const varName = assignmentWithResultMatch[1];
            const expression = assignmentWithResultMatch[2].trim();
            
            try {
                const result = this.evaluate(expression);
                this.variables[varName] = result;
                return {
                    type: 'calculation_with_result',
                    content: line,
                    description: description,
                    variable: varName,
                    expression: expression,
                    result: this.formatNumber(result, null),
                    precision: null
                };
            } catch (error) {
                return {
                    type: 'error',
                    content: line,
                    error: `Error #236: ${error.message}`
                };
            }
        }

        // Check for assignment with unit conversion in brackets (e.g., "var = expression [unit]")
        let assignmentWithUnitConversionMatch = cleanLine.match(/^([a-zA-Z\u0370-\u03FF_][a-zA-Z0-9\u0370-\u03FF_]*)\s*=\s*(.+?)\s*\[([^\]]+)\]\s*$/);
        if (assignmentWithUnitConversionMatch) {
            const varName = assignmentWithUnitConversionMatch[1];
            const expression = assignmentWithUnitConversionMatch[2].trim();
            const bracketContent = assignmentWithUnitConversionMatch[3]
            // // Use the content from either the bracket or the pipe
            // const bracketContent = assignmentWithUnitConversionMatch[3] || assignmentWithUnitConversionMatch[4];

            // This regex is simpler and assumes the bracket only contains the unit
            const targetUnit = bracketContent;
            
            try {
                const result = this.evaluate(expression);
                const finalResult = await this.convertWithUnits(result, targetUnit);
                
                this.variables[varName] = finalResult;
                
                return {
                    type: 'calculation_with_result',
                    content: line,
                    description: description,
                    variable: varName,
                    expression: expression,
                    result: this.formatNumber(finalResult, null) + ` ${targetUnit}`,
                    precision: null
                };
            } catch (error) {
                return {
                    type: 'error',
                    content: line,
                    error: `Assignment/Conversion Error: ${error.message}`
                };
            }
        }
    
        // Check for expression with precision and/or unit in brackets
        let expressionWithResultMatch = cleanLine.match(/^(.+?)\s*=\s*\[([^\]]+)\]\s*$/);
        if (expressionWithResultMatch) {
            const expression = expressionWithResultMatch[1].trim();
            const bracketContent = expressionWithResultMatch[2]
            // // Use content from either bracket or pipe
            // const bracketContent = (expressionWithResultMatch[2] || expressionWithResultMatch[3] || '').trim();
            
            // Parse bracket content - could be "2, mm" or "mm, 2" or just "2" or just "mm"
            const parts = bracketContent.split(',').map(p => p.trim());
            let precision = null;
            let targetUnit = null;
            
            if (parts.length === 2) {
                // Check which part is the number
                if (!isNaN(parts[0])) {
                    precision = parseInt(parts[0]);
                    targetUnit = parts[1];
                } else if (!isNaN(parts[1])) {
                    precision = parseInt(parts[1]);
                    targetUnit = parts[0];
                }
            } else if (parts.length === 1) {
                // Single value - check if it's a number or unit
                if (!isNaN(parts[0])) {
                    precision = parseInt(parts[0]);
                } else {
                    targetUnit = parts[0];
                }
            }
            
            try {
                const result = this.evaluate(expression);
                let finalResult = result;
                
                if (targetUnit) {
                    finalResult = this.unitMath.evaluate(`${result} to ${targetUnit}`);
                }
                
                return {
                    type: 'expression_result',
                    content: line,
                    description: description,
                    expression: expression,
                    result: this.formatNumber(finalResult, precision),
                    precision: precision
                };
            } catch (error) {
                return {
                    type: 'error',
                    content: line,
                    error: `Error #290: ${error.message}`
                };
            }
        }
        
        // Check for expression with unit only (e.g., "100 km/h = [m/s]")
        expressionWithResultMatch = cleanLine.match(/^(.+?)\s*=\s*\[([^\],\d][^\]]*)\]\s*$/);
        if (expressionWithResultMatch) {
            const expression = expressionWithResultMatch[1].trim();
            const targetUnit = expressionWithResultMatch[2].trim();
            
            try {
                const result = this.evaluate(expression);
                const converted = this.unitMath.evaluate(`${result} to ${targetUnit}`);
                return {
                    type: 'expression_result',
                    content: line,
                    description: description,
                    expression: expression,
                    result: this.formatNumber(converted, null),
                    precision: null
                };
            } catch (error) {
                return {
                    type: 'error',
                    content: line,
                    error: `Error #316: ${error.message}`
                };
            }
        }
        
        // Check for expression with precision only (e.g., "a + b = [2]")
        expressionWithResultMatch = cleanLine.match(/^(.+?)\s*=\s*\[(\d+)\]\s*$/);
        if (expressionWithResultMatch) {
            const expression = expressionWithResultMatch[1].trim();
            const precision = parseInt(expressionWithResultMatch[2]);
            
            try {
                const result = this.evaluate(expression);
                return {
                    type: 'expression_result',
                    content: line,
                    description: description,
                    expression: expression,
                    result: this.formatNumber(result, precision),
                    precision: precision
                };
            } catch (error) {
                return {
                    type: 'error',
                    content: line,
                    error: `Error #341: ${error.message}`
                };
            }
        }
        
        // Then try without precision bracket
        expressionWithResultMatch = cleanLine.match(/^(.+?)\s*=\s*$/);
        if (expressionWithResultMatch) {
            const expression = expressionWithResultMatch[1].trim();
            
            try {
                const result = this.evaluate(expression);
                return {
                    type: 'expression_result',
                    content: line,
                    description: description,
                    expression: expression,
                    result: this.formatNumber(result, null),
                    precision: null
                };
            } catch (error) {
                return {
                    type: 'error',
                    content: line,
                    error: `Error #365: ${error.message}`
                };
            }
        }
    
        // Check for regular assignment (e.g., "a = 10")
        const assignmentMatch = cleanLine.match(/^([a-zA-Z\u0370-\u03FF_][a-zA-Z0-9\u0370-\u03FF_]*)\s*=\s*(.+)$/);
        if (assignmentMatch) {
            const varName = assignmentMatch[1];
            const expression = assignmentMatch[2].trim();
            
            try {
                const result = this.evaluate(expression);
                this.variables[varName] = result;
                return {
                    type: 'calculation',
                    content: line,
                    description: description,
                    variable: varName,
                    expression: expression,
                    result: this.formatNumber(result),
                    precision: null
                };
            } catch (error) {
                return {
                    type: 'error',
                    content: line,
                    error: `Error #393: ${error.message}`
                };
            }
        }
    
        // Check for interpolation (e.g., "The sum is: {sum}")
        const interpolationMatch = line.match(/\{([^}]+)\}/g);
        if (interpolationMatch) {
            let processedLine = line;
            interpolationMatch.forEach(match => {
                const expr = match.slice(1, -1).trim();
                try {
                    const result = this.evaluate(expr);
                    processedLine = processedLine.replace(match, `**${this.formatNumber(result)}**`);
                } catch (error) {
                    processedLine = processedLine.replace(match, `[Error #407: ${error.message}]`);
                }
            });
            return { type: 'text', content: processedLine };
        }
    
        return { type: 'text', content: line };
    }

    evaluate(expression) {
        const scope = { ...this.variables };

        // Add pi to the scope, converting to BigNumber if needed
        if (this.unitMath.config().number === 'BigNumber') {
            scope.π = this.unitMath.bignumber(Math.PI);
        } else {
            scope.π = Math.PI;
        }
        
        try {
            // Try to evaluate with unit support first
            const result = this.unitMath.evaluate(expression, scope);
            return result;
        } catch (unitError) {
            // Fallback to regular evaluation if unit parsing fails
            try {
                return this.math.evaluate(expression, scope);
            } catch (error) {
                throw error;
            }
        }
    }
    
    formatNumber(num, precision = null) {
        // Check if it's a unit object from math.js
        if (num && typeof num === 'object' && num.constructor && num.constructor.name === 'Unit') {
            const numValue = parseFloat(num.toNumber());
            
            // Get the unit string - use format() for proper unit representation
            let unitStr;
            try {
                // Format the unit properly (this will show m^2 instead of m m)
                const formatted = num.format({ precision: precision !== null ? precision : 14 });
                // Extract just the unit part after the number
                const parts = formatted.split(' ');
                unitStr = parts.slice(1).join(' ');
                // Remove spaces between units (e.g., "m / s" -> "m/s")
                unitStr = unitStr.replace(/\s+/g, '');
                // Convert exponents to superscript (e.g., "m^2" -> "m<sup>2</sup>")
                unitStr = unitStr.replace(/\^(-?\d+)/g, '<sup>$1</sup>');
            } catch (e) {
                // Fallback to formatUnits if format fails
                unitStr = num.formatUnits().replace(/\s+/g, '');
                unitStr = unitStr.replace(/\^(-?\d+)/g, '<sup>$1</sup>');
            }
            
            if (precision !== null) {
                return numValue.toFixed(precision) + ' ' + unitStr;
            }
            
            if (Number.isInteger(numValue)) {
                return numValue.toString() + ' ' + unitStr;
            }
            
            // For non-integer values without specified precision, use reasonable default
            const formattedValue = numValue.toPrecision(10).replace(/\.?0+$/, '');
            return formattedValue + ' ' + unitStr;
        }
        
        const numValue = typeof num === 'number' ? num : parseFloat(num.toString());
        
        // If precision is specified, use it
        if (precision !== null) {
            return numValue.toFixed(precision);
        }
        
        // Otherwise, use default formatting
        if (Number.isInteger(numValue)) {
            return numValue.toString();
        }
        
        return num.toString();
    }

    async process(input) {
        this.reset();
        const lines = input.split('\n');
        const processedLines = [];

        // Process all lines and await their results
        for (const line of lines) {
            const result = await this.processLine(line);
            processedLines.push(result);
        }

        return processedLines;
    }
}

class HTMLCalcApp {
    constructor() {
        this.engine = new CalcPadEngine();
        this.inputEditor = document.getElementById('inputEditor');
        this.outputPreview = document.getElementById('outputPreview');

        this.init();
    }

    init() {
        let debounceTimer;
        const calculatingIndicator = document.querySelector('.calculating-indicator');
        
        this.inputEditor.addEventListener('input', () => {
            // Clear existing timer
            clearTimeout(debounceTimer);
            
            // Show calculating indicator
            calculatingIndicator.classList.remove('hidden');
            
            // Save to localStorage
            localStorage.setItem('htmlcalc_input', this.inputEditor.value);
            
            // Set new timer for auto-calculation
            debounceTimer = setTimeout(() => {
                this.calculate();
                // Hide calculating indicator after calculation
                calculatingIndicator.classList.add('hidden');
            }, 2000);
        });

        const savedInput = localStorage.getItem('htmlcalc_input');
        if (savedInput) {
            this.inputEditor.value = savedInput;
            // Trigger initial calculation
            this.calculate();
        }
        
        // Setup scroll synchronization
        this.setupScrollSync();

        // Setup mobile view toggle
        this.setupMobileViewToggle();

        // Setup swipe gestures
        this.setupSwipeGestures();

        // Setup theme toggle
        this.setupThemeToggle();

        // Setup font size control
        this.setupFontSizeControl();
    }

    setupScrollSync() {
        let isInputScrolling = false;
        let isOutputScrolling = false;
        
        this.inputEditor.addEventListener('scroll', () => {
            if (isOutputScrolling) return;
            
            isInputScrolling = true;
            
            const inputScrollPercentage = this.inputEditor.scrollTop / 
                (this.inputEditor.scrollHeight - this.inputEditor.clientHeight);
            
            const outputScrollTop = inputScrollPercentage * 
                (this.outputPreview.scrollHeight - this.outputPreview.clientHeight);
            
            this.outputPreview.scrollTop = outputScrollTop;
            
            setTimeout(() => {
                isInputScrolling = false;
            }, 100);
        });
        
        this.outputPreview.addEventListener('scroll', () => {
            if (isInputScrolling) return;
            
            isOutputScrolling = true;
            
            const outputScrollPercentage = this.outputPreview.scrollTop / 
                (this.outputPreview.scrollHeight - this.outputPreview.clientHeight);
            
            const inputScrollTop = outputScrollPercentage * 
                (this.inputEditor.scrollHeight - this.inputEditor.clientHeight);
            
            this.inputEditor.scrollTop = inputScrollTop;
            
            setTimeout(() => {
                isOutputScrolling = false;
            }, 100);
        });
    }

    setupMobileViewToggle() {
        const showOutputBtn = document.getElementById('showOutputBtn');
        const showInputBtn = document.getElementById('showInputBtn');
        const editorPanel = document.querySelector('.editor-panel');
        const outputPanel = document.querySelector('.output-panel');
        
        showOutputBtn.addEventListener('click', () => {
            // Calculate before showing output
            this.calculate();
            
            // Save current scroll position of input
            const inputScrollPercentage = this.inputEditor.scrollTop / 
                (this.inputEditor.scrollHeight - this.inputEditor.clientHeight);
            
            // Show output panel
            editorPanel.classList.add('hidden');
            outputPanel.classList.add('visible');
            
            // Sync scroll position to output
            setTimeout(() => {
                const outputScrollTop = inputScrollPercentage * 
                    (this.outputPreview.scrollHeight - this.outputPreview.clientHeight);
                this.outputPreview.scrollTop = outputScrollTop;
            }, 50);
        });
        
        showInputBtn.addEventListener('click', () => {
            // Save current scroll position of output
            const outputScrollPercentage = this.outputPreview.scrollTop / 
                (this.outputPreview.scrollHeight - this.outputPreview.clientHeight);
            
            // Show input panel
            outputPanel.classList.remove('visible');
            editorPanel.classList.remove('hidden');
            
            // Sync scroll position to input
            setTimeout(() => {
                const inputScrollTop = outputScrollPercentage * 
                    (this.inputEditor.scrollHeight - this.inputEditor.clientHeight);
                this.inputEditor.scrollTop = inputScrollTop;
            }, 50);
        });
    }

    setupSwipeGestures() {
        const editorPanel = document.querySelector('.editor-panel');
        const outputPanel = document.querySelector('.output-panel');
        
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 50; // Minimum distance for a swipe to be recognized
        
        // Swipe left on editor to show output
        editorPanel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        editorPanel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleEditorSwipe();
        }, { passive: true });
        
        const handleEditorSwipe = () => {
            const swipeDistance = touchStartX - touchEndX;
            
            // Swipe left (positive distance)
            if (swipeDistance > minSwipeDistance) {
                // Trigger the show output button click
                document.getElementById('showOutputBtn').click();
            }
        };
        
        // Swipe right on output to show editor
        outputPanel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        outputPanel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleOutputSwipe();
        }, { passive: true });
        
        const handleOutputSwipe = () => {
            const swipeDistance = touchEndX - touchStartX;
            
            // Swipe right (positive distance)
            if (swipeDistance > minSwipeDistance) {
                // Trigger the show input button click
                document.getElementById('showInputBtn').click();
            }
        };
    }

    setupThemeToggle() {
        const lightThemeBtn = document.getElementById('lightTheme');
        const darkThemeBtn = document.getElementById('darkTheme');
        
        // Load saved theme or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
        
        // Set active button based on saved theme
        if (savedTheme === 'light') {
            lightThemeBtn.classList.add('active');
        } else {
            darkThemeBtn.classList.add('active');
        }
        
        lightThemeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.documentElement.setAttribute('data-bs-theme', 'light');
            localStorage.setItem('theme', 'light');
            lightThemeBtn.classList.add('active');
            darkThemeBtn.classList.remove('active');
        });
        
        darkThemeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            darkThemeBtn.classList.add('active');
            lightThemeBtn.classList.remove('active');
        });
    }

    setupFontSizeControl() {
        const fontSizeInput = document.getElementById('fontSizeInput');
        const decreaseBtn = document.getElementById('decreaseFontSize');
        const increaseBtn = document.getElementById('increaseFontSize');
        
        // Load saved font size or default to 100
        const savedFontSize = localStorage.getItem('fontSize') || '100';
        fontSizeInput.value = savedFontSize;
        this.applyFontSize(savedFontSize);
        
        // Decrease button
        decreaseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent dropdown from closing
            let value = parseInt(fontSizeInput.value);
            value = Math.max(50, value - 5);
            fontSizeInput.value = value;
            this.applyFontSize(value);
            localStorage.setItem('fontSize', value);
        });
        
        // Increase button
        increaseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent dropdown from closing
            let value = parseInt(fontSizeInput.value);
            value = Math.min(200, value + 5);
            fontSizeInput.value = value;
            this.applyFontSize(value);
            localStorage.setItem('fontSize', value);
        });
    }

    applyFontSize(percentage) {
        const baseFontSize = 17; // Base font size in pixels
        const newFontSize = (baseFontSize * percentage) / 100;
        
        // Apply to input editor
        this.inputEditor.style.fontSize = `${newFontSize}px`;
        
        // Apply to output content
        this.outputPreview.style.fontSize = `${newFontSize}px`;
    }

    async calculate() {
        const input = this.inputEditor.value;
        
        if (!input.trim()) {
            this.outputPreview.innerHTML = `
                <div class="text-muted text-center mt-5">
                    <i class="bi bi-exclamation-circle" style="font-size: 3rem;"></i>
                    <p class="mt-3">Please enter some content to calculate</p>
                </div>
            `;
            return;
        }

        const processedLines = await this.engine.process(input);
        const output = this.renderOutput(processedLines);
        this.outputPreview.innerHTML = output;
    }
    
    renderOutput(processedLines) {
        let htmlParts = [];
    
        processedLines.forEach(line => {
            if (line.type === 'calculation_with_result') {
                const desc = line.description ? `<span class="calculation-description">${this.escapeHtml(line.description)}</span> ` : '';
                const formattedVariable = this.formatExpression(line.variable);
                const formattedExpression = this.formatExpression(line.expression);
                htmlParts.push(`<div class="calculation-result">${desc}${formattedVariable} = ${formattedExpression} = <strong>${line.result}</strong></div>`);
            } else if (line.type === 'expression_result') {
                const desc = line.description ? `<span class="calculation-description">${this.escapeHtml(line.description)}</span> ` : '';
                const formattedExpression = this.formatExpression(line.expression);
                htmlParts.push(`<div class="calculation-result">${desc}${formattedExpression} = <strong>${line.result}</strong></div>`);
            } else if (line.type === 'calculation') {
                const desc = line.description ? `<span class="calculation-description">${this.escapeHtml(line.description)}</span> ` : '';
                // Remove the quoted description from the content display
                let displayContent = line.content;
                if (line.description) {
                    displayContent = displayContent.replace(/^'[^']+'/, '').trim();
                }
                // Format the display content for subscripts and superscripts
                const formattedContent = this.formatExpression(displayContent);
                htmlParts.push(`<div class="calculation-line">${desc}${formattedContent}</div>`);
            } else if (line.type === 'error') {
                htmlParts.push(`<div class="error-message"><strong>Error #805:</strong> ${this.escapeHtml(line.error)}<br><code>${this.escapeHtml(line.content)}</code></div>`);
            } else {
                // Regular text or interpolated text - parse as markdown
                const htmlOutput = marked.parse(line.content);
                htmlParts.push(htmlOutput);
            }
        });
    
        return htmlParts.join('') || '<div class="text-muted">No output generated</div>';
    }

    formatExpression(expression) {
        // Convert subscripts: variable_subscript -> variable<sub>subscript</sub>
        // This handles patterns like "F_tot", "T_x,y", etc.
        expression = expression.replace(/([a-zA-Z_][a-zA-Z0-9_]*)_([a-zA-Z0-9,]+)/g, '$1<sub>$2</sub>');
        
        // Convert exponents to superscript in the expression
        // This handles patterns like "m^2", "s^2", etc.
        expression = expression.replace(/\^(-?\d+)/g, '<sup>$1</sup>');
        
        return expression;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HTMLCalcApp();
});