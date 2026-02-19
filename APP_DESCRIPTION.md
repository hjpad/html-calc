# HTML Calc - Application Description

## Overview

HTML Calc is a browser-based calculator IDE inspired by CalcPad. It allows users to write markdown-formatted documents with embedded mathematical calculations. The application processes variable assignments, evaluates expressions, and displays results inline within the formatted markdown output with optional precision control and descriptive labels.

## Scope

### Core Features
- **Markdown Support**: Full markdown rendering (headings, lists, bold, italic, code blocks, etc.)
- **Variable Assignments**: Define variables and use them in subsequent calculations
- **Expression Evaluation**: Evaluate mathematical expressions using the Math.js library
- **Result Display**: Show calculation results inline when expressions end with "="
- **Precision Control**: Specify decimal precision using square brackets (e.g., `= [2]` for 2 decimal places)
- **Descriptive Labels**: Add descriptions to calculations using single quotes (e.g., `'Area:' A = pi * r^2 =`)
- **Variable Interpolation**: Reference calculated values in text using `{variable}` syntax
- **Error Handling**: Display clear error messages for invalid expressions
- **Local Storage**: Automatically save and restore user input between sessions

### Technical Stack
- **HTML5**: Structure and layout
- **CSS3**: Styling with custom properties
- **Bootstrap 5.3**: UI framework and responsive design
- **Bootstrap Icons**: Icon library
- **JavaScript (ES6+)**: Application logic
- **Marked.js**: Markdown parsing and rendering
- **Math.js**: Mathematical expression evaluation with BigNumber support

## Application Structure

### File Organization