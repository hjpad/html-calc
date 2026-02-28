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
    }

    reset() {
        this.variables = {};
    }

    processLine(line) {
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
    
        // Check for assignment with trailing "=" and optional precision/unit (e.g., "speed = 100 km/h = [2, m/s]")
        let assignmentWithResultMatch = cleanLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+?)\s*=\s*\[(\d+)\s*,\s*([^\]]+)\]\s*$/);
        if (assignmentWithResultMatch) {
            const varName = assignmentWithResultMatch[1];
            const expression = assignmentWithResultMatch[2].trim();
            const precision = parseInt(assignmentWithResultMatch[3]);
            const targetUnit = assignmentWithResultMatch[4].trim();
            
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
                    result: this.formatNumber(converted, precision),
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
        
        // Check for assignment with unit only (e.g., "speed = 100 km/h = [m/s]")
        assignmentWithResultMatch = cleanLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+?)\s*=\s*\[([^\],\d][^\]]*)\]\s*$/);
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
                    error: error.message
                };
            }
        }
    
        // Check for assignment with precision only (e.g., "sum = a + b = [2]")
        assignmentWithResultMatch = cleanLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+?)\s*=\s*\[(\d+)\]\s*$/);
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
        assignmentWithResultMatch = cleanLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+?)\s*=\s*$/);
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
                    error: error.message
                };
            }
        }
    
        // Check for expression with precision and unit (e.g., "100 km/h = [2, m/s]")
        let expressionWithResultMatch = cleanLine.match(/^(.+?)\s*=\s*\[(\d+)\s*,\s*([^\]]+)\]\s*$/);
        if (expressionWithResultMatch) {
            const expression = expressionWithResultMatch[1].trim();
            const precision = parseInt(expressionWithResultMatch[2]);
            const targetUnit = expressionWithResultMatch[3].trim();
            
            try {
                const result = this.evaluate(expression);
                const converted = this.unitMath.evaluate(`${result} to ${targetUnit}`);
                return {
                    type: 'expression_result',
                    content: line,
                    description: description,
                    expression: expression,
                    result: this.formatNumber(converted, precision),
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
                    error: error.message
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
                    error: error.message
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
                    error: error.message
                };
            }
        }
    
        // Check for regular assignment (e.g., "a = 10")
        const assignmentMatch = cleanLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
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
                    error: error.message
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
                    processedLine = processedLine.replace(match, `[Error: ${error.message}]`);
                }
            });
            return { type: 'text', content: processedLine };
        }
    
        return { type: 'text', content: line };
    }

    evaluate(expression) {
        const scope = { ...this.variables };
        
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

    process(input) {
        this.reset();
        const lines = input.split('\n');
        const processedLines = [];

        lines.forEach(line => {
            processedLines.push(this.processLine(line));
        });

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
    }

    calculate() {
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

        const processedLines = this.engine.process(input);
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
                htmlParts.push(`<div class="error-message"><strong>Error:</strong> ${this.escapeHtml(line.error)}<br><code>${this.escapeHtml(line.content)}</code></div>`);
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