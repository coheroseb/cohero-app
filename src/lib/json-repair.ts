export function repairJson(json: string): any {
    if (!json) return null;
    
    // 1. Remove potential Markdown code blocks
    let cleaned = json.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-z]*\n/i, '').replace(/\n```$/m, '').trim();
    }
    
    // 2. Initial attempt
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        // Continue to repair
    }

    // 3. Normalize quotes and fix common AI JSON errors
    cleaned = cleaned
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/,\s*([\]}])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3'); // Quote unquoted keys
    
    // 4. Fix unclosed strings (handling escapes)
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }
        } else {
            if (char === '"') {
                inString = true;
            }
        }
    }

    if (inString) {
        if (escaped) {
            cleaned = cleaned.slice(0, -1); // Remove trailing backslash
        }
        cleaned += '"';
    }
    
    // 4.5 Handle dangling colons (e.g., "key":)
    let tempCleaned = cleaned.trim();
    if (tempCleaned.endsWith(':')) {
        cleaned = cleaned.trim() + ' ""'; // Add empty string value
    }
    
    // 5. Close unclosed brackets/braces
    const stack: string[] = [];
    inString = false;
    escaped = false;
    
    for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        if (inString) {
            if (escaped) escaped = false;
            else if (char === '\\') escaped = true;
            else if (char === '"') inString = false;
        } else {
            if (char === '"') inString = true;
            else if (char === '{') stack.push('}');
            else if (char === '[') stack.push(']');
            else if (char === '}') { if (stack.length > 0 && stack[stack.length - 1] === '}') stack.pop(); }
            else if (char === ']') { if (stack.length > 0 && stack[stack.length - 1] === ']') stack.pop(); }
        }
    }
    
    // If we have a dangling comma before closing, remove it
    cleaned = cleaned.trim();
    if (cleaned.endsWith(',')) {
        cleaned = cleaned.slice(0, -1);
    }
    
    while (stack.length > 0) {
        cleaned += stack.pop();
    }
    
    // 6. Final attempt
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("[JSONRepair] Failed to repair JSON:", e);
        
        // Aggressive fallback: Try to find a valid JSON structure by stripping lines from the end
        let lines = cleaned.split('\n');
        while (lines.length > 0) {
            lines.pop();
            let potentialJson = lines.join('\n').trim();
            
            // Try to close the structure for this truncated version
            try {
                // We need to re-run the bracket closer for this partial version
                let partialStack: string[] = [];
                let pInString = false;
                let pEscaped = false;
                for (let i = 0; i < potentialJson.length; i++) {
                    const char = potentialJson[i];
                    if (pInString) {
                        if (pEscaped) pEscaped = false;
                        else if (char === '\\') pEscaped = true;
                        else if (char === '"') pInString = false;
                    } else {
                        if (char === '"') pInString = true;
                        else if (char === '{') partialStack.push('}');
                        else if (char === '[') partialStack.push(']');
                        else if (char === '}') { if (partialStack.length > 0) partialStack.pop(); }
                        else if (char === ']') { if (partialStack.length > 0) partialStack.pop(); }
                    }
                }
                if (pInString) potentialJson += '"';
                if (potentialJson.endsWith(',')) potentialJson = potentialJson.slice(0, -1);
                while (partialStack.length > 0) potentialJson += partialStack.pop();
                
                return JSON.parse(potentialJson);
            } catch {
                // Continue stripping lines
            }
        }
        throw e;
    }
}
