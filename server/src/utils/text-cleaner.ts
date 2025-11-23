export function cleanJSX(text: string): string {
    // Clean up the response
    let cleanText = text.replace(/```jsx/g, '').replace(/```/g, '').trim();

    // Remove imports
    cleanText = cleanText.replace(/^import\s+.*\n?/gm, '');

    // Handle "export default function" -> "function" (just in case)
    cleanText = cleanText.replace(/export\s+default\s+function/g, 'function');

    // Handle "export default class" -> "class" (just in case)
    cleanText = cleanText.replace(/export\s+default\s+class/g, 'class');

    // Remove "export default GeneratedComponent;"
    cleanText = cleanText.replace(/^export\s+default\s+GeneratedComponent;?\s*$/gm, '');

    // Remove any remaining "export default" to prevent syntax errors
    cleanText = cleanText.replace(/export\s+default\s+/g, '');

    return cleanText;
}
