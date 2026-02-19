class CalcPadEngine {
    constructor() {
        this.variables = {};
        this.math = math;
        this.math.config({
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
    
        // Check for assignment with trailing "=" and optional precision (e.g., "sum = a + b = [2]" or "sum = a + b =")
        // First try to match with precision bracket - match everything that's NOT "= ["
        let assignmentWithResultMatch = cleanLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^=]+(?:=[^=\[])*?)\s*=\s*\[(\d+)\]\s*$/);
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
    
        // Check for expression with trailing "=" and optional precision (e.g., "a + b = [2]" or "a + b =")
        // First try with precision bracket - match everything that's NOT "= ["
        let expressionWithResultMatch = cleanLine.match(/^([^=]+(?:=[^=\[])*?)\s*=\s*\[(\d+)\]\s*$/);
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
        return this.math.evaluate(expression, scope);
    }
    
    formatNumber(num, precision = null) {
        if (typeof num === 'number' || (num && num.constructor && num.constructor.name === 'BigNumber')) {
            const numValue = typeof num === 'number' ? num : parseFloat(num.toString());
            
            // If precision is specified, use it
            if (precision !== null) {
                return numValue.toFixed(precision);
            }
            
            // Otherwise, use default formatting
            if (Number.isInteger(numValue)) {
                return numValue.toString();
            }
            return numValue.toFixed(6).replace(/\.?0+$/, '');
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
        this.calculateBtn = document.getElementById('calculateBtn');

        this.init();
    }

    init() {
        this.calculateBtn.addEventListener('click', () => this.calculate());
        
        this.inputEditor.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.calculate();
            }
        });

        const savedInput = localStorage.getItem('htmlcalc_input');
        if (savedInput) {
            this.inputEditor.value = savedInput;
        }

        this.inputEditor.addEventListener('input', () => {
            localStorage.setItem('htmlcalc_input', this.inputEditor.value);
        });
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
                htmlParts.push(`<div class="calculation-result">${desc}${line.variable} = ${line.expression} = <strong>${line.result}</strong></div>`);
            } else if (line.type === 'expression_result') {
                const desc = line.description ? `<span class="calculation-description">${this.escapeHtml(line.description)}</span> ` : '';
                htmlParts.push(`<div class="calculation-result">${desc}${line.expression} = <strong>${line.result}</strong></div>`);
            } else if (line.type === 'calculation') {
                const desc = line.description ? `<span class="calculation-description">${this.escapeHtml(line.description)}</span> ` : '';
                // Remove the quoted description from the content display
                let displayContent = line.content;
                if (line.description) {
                    displayContent = displayContent.replace(/^'[^']+'/, '').trim();
                }
                htmlParts.push(`<div class="calculation-line">${desc}${this.escapeHtml(displayContent)}</div>`);
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HTMLCalcApp();
});