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

        // Check for assignment with trailing "=" (e.g., "sum = a + b =")
        const assignmentWithResultMatch = trimmedLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+?)\s*=\s*$/);
        if (assignmentWithResultMatch) {
            const varName = assignmentWithResultMatch[1];
            const expression = assignmentWithResultMatch[2];
            
            try {
                const result = this.evaluate(expression);
                this.variables[varName] = result;
                return {
                    type: 'calculation_with_result',
                    content: line,
                    variable: varName,
                    expression: expression,
                    result: this.formatNumber(result)
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
        const assignmentMatch = trimmedLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
        if (assignmentMatch) {
            const varName = assignmentMatch[1];
            const expression = assignmentMatch[2];
            
            try {
                const result = this.evaluate(expression);
                this.variables[varName] = result;
                return {
                    type: 'calculation',
                    content: line,
                    variable: varName,
                    result: this.formatNumber(result)
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

    formatNumber(num) {
        if (typeof num === 'number' || (num && num.constructor && num.constructor.name === 'BigNumber')) {
            const numValue = typeof num === 'number' ? num : parseFloat(num.toString());
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
        let markdownText = '';

        processedLines.forEach(line => {
            if (line.type === 'calculation_with_result') {
                // Add the line with result appended, followed by two spaces for line break
                markdownText += `${line.variable} = ${line.expression} = **${line.result}**  \n`;
            } else if (line.type === 'calculation') {
                // Regular assignment, just show as-is with two spaces for line break
                markdownText += line.content + '  \n';
            } else if (line.type === 'error') {
                markdownText += `<div class="error-message"><strong>Error:</strong> ${this.escapeHtml(line.error)}<br><code>${this.escapeHtml(line.content)}</code></div>\n`;
            } else {
                // Regular text or interpolated text
                // Empty lines get preserved, other lines get two spaces for line break
                if (line.content.trim() === '') {
                    markdownText += '\n';
                } else {
                    markdownText += line.content + '  \n';
                }
            }
        });

        const htmlOutput = marked.parse(markdownText);
        return htmlOutput || '<div class="text-muted">No output generated</div>';
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