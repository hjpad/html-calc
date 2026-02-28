class UnitsHandler {
    constructor() {
        this.config = null;
        this.loaded = false;
    }

    async loadConfig() {
        if (this.loaded) return;
        
        try {
            const response = await fetch('../scripts/units.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const responseText = await response.text();
            try {
                this.config = JSON.parse(responseText);
            } catch (e) {
                console.error("Failed to parse units.json. Content received:", responseText);
                throw e; // re-throw the json parsing error to be caught below
            }
            this.loaded = true;
            // throw new Error('Units configuration loaded successfully'); // Throwing an error to indicate successful load
        } catch (error) {
            console.warn('Could not load units configuration:', error);
            this.config = {};
            this.loaded = true;
        }
    }

    normalizeUnitName(unitName) {
        if (!this.config) return unitName;
        
        for (const category in this.config) {
            const symbolMap = this.config[category].symbolMap;
            if (symbolMap && symbolMap[unitName]) {
                return symbolMap[unitName];
            }
        }
        return unitName;
    }

    canConvert(fromUnit, toUnit) {
        if (!this.config) return false;
        
        const normalizedFrom = this.normalizeUnitName(fromUnit);
        const normalizedTo = this.normalizeUnitName(toUnit);
        
        for (const category in this.config) {
            const units = this.config[category].units;
            if (units && units.includes(normalizedFrom) && units.includes(normalizedTo)) {
                return true;
            }
        }
        return false;
    }

    convert(value, fromUnit, toUnit) {
        if (!this.config) return null;
        
        const normalizedFrom = this.normalizeUnitName(fromUnit);
        const normalizedTo = this.normalizeUnitName(toUnit);
        
        if (normalizedFrom === normalizedTo) {
            return value;
        }
        
        for (const category in this.config) {
            const conversions = this.config[category].conversions;
            if (conversions && conversions[normalizedFrom] && conversions[normalizedFrom][normalizedTo]) {
                const formula = conversions[normalizedFrom][normalizedTo].formula;
                // Evaluate the formula with x as the value
                try {
                    return Function('x', `return ${formula}`)(value);
                } catch (error) {
                    console.error('Error evaluating conversion formula:', error);
                    return null;
                }
            }
        }
        
        return null;
    }
    
}