# HTML Calc

A browser-based calculator IDE that combines markdown documentation with live mathematical calculations. Write your notes, formulas, and calculations in a clean, readable format and see the results instantly.

🚀 **[Launch HTML Calc](https://hjpad.github.io/html-calc/)**

> Replace `hjpad` with your GitHub username after deploying

## Features

✨ **Markdown Support** - Write beautiful documentation with full markdown formatting  
🧮 **Live Calculations** - Evaluate mathematical expressions in real-time  
📊 **Variable System** - Define variables and reuse them throughout your document  
💾 **Auto-Save** - Your work is automatically saved to browser storage  
🎯 **Inline Results** - Display calculation results exactly where you need them  
🚫 **Error Handling** - Clear error messages help you fix issues quickly  

## Quick Start

### Try It Online

Visit the [live demo](https://hjpad.github.io/html-calc/) and start calculating immediately. No installation required!

### Example Usage

```markdown
# Project Budget Calculator

## Initial Costs
labor_hours = 120
hourly_rate = 75
labor_cost = labor_hours * hourly_rate =

## Materials
materials = 3500

## Total
total = labor_cost + materials =

The total project cost is: {total}
Output:
# Project Budget Calculator

## Initial Costs
labor_hours = 120
hourly_rate = 75
labor_cost = labor_hours * hourly_rate = 9000

## Materials
materials = 3500

## Total
total = labor_cost + materials = 12500

The total project cost is: 12500
Syntax Guide
Variable Assignment (Silent)
variable = expression
Stores the result without displaying it.
Example:
radius = 5
pi = 3.14159
Variable Assignment with Result
variable = expression =
Stores the result AND displays it inline.
Example:
area = pi * radius^2 =
Output: area = pi * radius^2 = 78.53975
Variable Interpolation
Text {variable} more text
Inserts the variable's value into your text.
Example:
The calculated area is {area} square units.
Output: The calculated area is 78.53975 square units.
Supported Operations
Basic Math: +, -, *, /, ^ (power)
Functions: sqrt(), sin(), cos(), tan(), log(), exp(), abs(), etc.
Constants: pi, e
Parentheses: For grouping expressions
Examples:
hypotenuse = sqrt(3^2 + 4^2) =
angle = sin(pi/4) =
compound = 1000 * (1 + 0.05)^10 =
Keyboard Shortcuts
Ctrl/Cmd + Enter - Calculate and render output
Tab - Insert tab in editor (doesn't switch focus)
Use Cases
📐 Engineering Calculations
Document your engineering calculations with formulas and results side-by-side.
💰 Financial Planning
Create budget spreadsheets with automatic totals and percentages.
📚 Educational Content
Write math tutorials with live, interactive examples.
🔬 Scientific Notes
Keep lab notebooks with embedded calculations and unit conversions.
📊 Data Analysis
Quick calculations and data transformations with readable documentation.
Technical Details
Built With
HTML5 - Structure
CSS3 - Styling
JavaScript (ES6+) - Application logic
Bootstrap 5.3 - UI framework
Marked.js - Markdown parsing
Math.js - Mathematical expression evaluation
Browser Support
Chrome (latest)
Firefox (latest)
Safari (latest)
Edge (latest)
Privacy
All calculations happen in your browser. No data is sent to any server. Your work is saved locally using browser localStorage.
Local Development
Prerequisites
None! Just a modern web browser.
Running Locally
1.
Clone the repository:
bash
git clone https://github.com/hjpad/html-calc.git
cd html-calc
2.
Open index.html in your browser:
bash
# On macOS
open index.html

# On Linux
xdg-open index.html

# On Windows
start index.html
Or use a local server:
bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (with http-server)
npx http-server
Then visit http://localhost:8000
Deployment to GitHub Pages
1.
Fork or clone this repository
2.
Go to repository Settings → Pages
3.
Under "Source", select "Deploy from a branch"
4.
Select branch: main and folder: / (root)
5.
Click Save
6.
Your app will be available at https://hjpad.github.io/html-calc/
Project Structure
html-calc/
├── index.html           # Main HTML file
├── styles.css           # Custom styles
├── script.js            # Application logic
├── README.md            # This file
└── APP_DESCRIPTION.md   # Developer documentation
Examples
Example 1: Circle Calculations
# Circle Calculator

radius = 10
diameter = 2 * radius =
circumference = 2 * pi * radius =
area = pi * radius^2 =

## Summary
A circle with radius {radius} has:
- Diameter: {diameter}
- Circumference: {circumference}
- Area: {area}
Example 2: Loan Calculator
# Loan Payment Calculator

principal = 200000
annual_rate = 0.045
years = 30
monthly_rate = annual_rate / 12
num_payments = years * 12

monthly_payment = principal * (monthly_rate * (1 + monthly_rate)^num_payments) / ((1 + monthly_rate)^num_payments - 1) =

total_paid = monthly_payment * num_payments =
total_interest = total_paid - principal =

## Results
Your monthly payment will be: ${monthly_payment}
Total amount paid: ${total_paid}
Total interest: ${total_interest}
Example 3: Unit Conversions
# Temperature Converter

celsius = 25
fahrenheit = celsius * 9/5 + 32 =
kelvin = celsius + 273.15 =

{celsius}°C equals {fahrenheit}°F or {kelvin}K
Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
Development Guidelines
Follow existing code style
Test in multiple browsers
Update documentation for new features
Keep dependencies minimal
See APP_DESCRIPTION.md for detailed developer documentation.
Roadmap
Export to PDF
Dark mode theme
Syntax highlighting in editor
Unit conversion support
Graphing capabilities
Custom function definitions
Mobile app version
Collaborative editing
License
MIT License - feel free to use this project for any purpose.
Acknowledgments
Inspired by CalcPad
Built with Math.js
Markdown rendering by Marked
UI components from Bootstrap
Support
📖 Documentation
🐛 Report Issues
💡 Request Features
Author
Created with ❤️ for anyone who needs to document calculations