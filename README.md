# HTML Calc

A browser-based calculator IDE that combines markdown documentation with live mathematical calculations. Write your notes, formulas, and calculations in a clean, readable format and see the results instantly.

🚀 **[Launch HTML Calc](https://hjpad.github.io/html-calc/)**

## Features

✨ **Markdown Support** - Write beautiful documentation with full markdown formatting  
🧮 **Live Calculations** - Evaluate mathematical expressions in real-time  
📊 **Variable System** - Define variables and reuse them throughout your document  
💾 **Auto-Save** - Your work is automatically saved to browser storage  
🎯 **Inline Results** - Display calculation results exactly where you need them  
🔢 **Unit Conversions** - Convert between units seamlessly  
🔤 **Subscripts & Superscripts** - Use `_` for subscripts and `^` for superscripts in variable names

## Quick Start

### Example Usage

```markdown
# Project Budget Calculator

labor_hours = 120
hourly_rate = 75
labor_cost = labor_hours * hourly_rate =

materials = 3500
total = labor_cost + materials =

The total project cost is: {total}
```

**Output:**
```
labor_cost = labor_hours * hourly_rate = 9000
total = labor_cost + materials = 12500

The total project cost is: 12500
```

## Syntax Guide

### Variable Assignment (Silent)
```
variable = expression
```
Stores the result without displaying it.

### Variable Assignment with Result
```
variable = expression =
```
Stores and displays the result inline.

### Precision Control
```
variable = expression = [2]        # 2 decimal places
```

### Unit Conversion
```
speed = 100 km/h = [m/s]          # Convert to m/s
distance = 5 km = [2, m]          # Convert to meters with 2 decimals
```

### Variable Interpolation
```
The result is: {variable}
```

### Subscripts and Superscripts
```
F_total = 100 N        # Displays as F_total
x^2 = 25              # Displays as x²
v_0 = 10 m/s          # Displays as v₀
```

### Descriptions
```
'Force calculation' F = m * a =
```

## Supported Operations

- **Basic Math:** `+`, `-`, `*`, `/`, `^` (power)
- **Functions:** `sqrt()`, `sin()`, `cos()`, `tan()`, `log()`, `exp()`, `abs()`, etc.
- **Constants:** `pi`, `e`
- **Units:** Length, mass, time, speed, force, energy, temperature, and more

## Keyboard Shortcuts

- **Ctrl/Cmd + Enter** - Calculate and render output
- **Tab** - Insert tab in editor

## Local Development

### Running Locally

1. Clone the repository:
```bash
git clone https://github.com/hjpad/html-calc.git
cd html-calc
```

2. Open `docs/index.html` in your browser, or use a local server:
```bash
# Python 3
python -m http.server 8017

# Node.js
npx http-server -p 8017
```

Then visit `http://localhost:8017`

### Project Structure
```
html-calc/
├── docs/
│   ├── index.html       # Main HTML file
│   ├── styles.css       # Custom styles
│   ├── script.js        # Application logic
│   ├── images/          # Images folder (optional)
│   ├── site.webmanifest # Web app manifest (optional)
│   └── sw.js            # Service worker (optional)
├── README.md            # This file
└── APP_DESCRIPTION.md   # Developer documentation
```

## Deployment to GitHub Pages

1. Go to repository **Settings → Pages**
2. Under "Source", select **Deploy from a branch**
3. Select branch: **main** and folder: **/docs**
4. Click **Save**
5. Your app will be available at `https://yourusername.github.io/html-calc/`

## Examples

### Circle Calculations
```
radius = 10
diameter = 2 * radius =
circumference = 2 * pi * radius =
area = pi * radius^2 =

A circle with radius {radius} has area {area}
```

### Unit Conversions
```
speed = 100 km/h = [m/s]
distance = 5 km = [m]
time = distance / speed =

Traveling at {speed} for {distance} takes {time}
```

## Technical Details

**Built With:**
- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5.3 - UI framework
- Marked.js - Markdown parsing
- Math.js - Mathematical expression evaluation

**Browser Support:** Chrome, Firefox, Safari, Edge (latest versions)

**Privacy:** All calculations happen in your browser. No data is sent to any server.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

**Development Guidelines:**
- Follow existing code style
- Test in multiple browsers
- Update documentation for new features
- Keep dependencies minimal

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- Inspired by [CalcPad](https://calcpad.eu/)
- Built with [Math.js](https://mathjs.org/)
- Markdown rendering by [Marked](https://marked.js.org/)
- UI components from [Bootstrap](https://getbootstrap.com/)

---

Created for myself and anyone who needs to document calculations