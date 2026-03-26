
import { XMLParser } from 'fast-xml-parser';

export interface Paragraph {
  nummer: string;
  tekst: string;
}

export interface Chapter {
  nummer: string;
  titel: string;
  paragraffer: Paragraph[];
}

export interface ParsedLaw {
  titel: string;
  popularTitle?: string;
  uniqueDocumentId?: string;
  status: string;
  number?: string;
  date?: string;
  kapitler: Chapter[];
}

/**
 * Recursively extracts all text content from a branch of the Retsinfo XML tree.
 */
export function extractText(node: any): string {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    
    let text = '';

    if (Array.isArray(node)) {
        for (const child of node) {
            text += extractText(child) + ' ';
        }
    } else if (typeof node === 'object') {
        // --- HANDLE NESTED LISTS (Indentatio) ---
        if (node.Index || node.Indentatio) {
            const indents = node.Index 
                ? (Array.isArray(node.Index.Indentatio) ? node.Index.Indentatio : [node.Index.Indentatio])
                : (Array.isArray(node.Indentatio) ? node.Indentatio : [node.Indentatio]);
            
            return indents.map((i: any) => {
                if (!i) return '';
                const label = i.Explicatus ? extractText(i.Explicatus).trim() : '';
                const content = extractText(i.Exitus || i.Linea || i).trim();
                return `\n\n${label} ${content}`;
            }).join('');
        }

        // Check for common Retsinfo text containers
        if (node.Aendring) {
            const aendring = Array.isArray(node.Aendring) ? node.Aendring : [node.Aendring];
            return aendring.map((a: any) => {
                const def = a.AendringDefinition ? extractText(a.AendringDefinition).trim() : '';
                const nyTekst = a.AendringAktion?.AendringNyTekst ? `\n\nNY TEKST:\n${extractText(a.AendringAktion.AendringNyTekst).trim()}` : '';
                return `\n\nÆNDRING: ${def}${nyTekst}\n`;
            }).join('');
        }

        if (node.Char) {
            text += extractText(node.Char) + ' ';
        } else if (node.Linea) {
            text += extractText(node.Linea) + '\n';
        } else if (node.Exitus) {
            text += extractText(node.Exitus) + '\n\n';
        } else if (node.Explicatus) {
            text += extractText(node.Explicatus) + ' ';
        } else if (node.Index) {
            text += extractText(node.Index);
        } else if (node.Rubrica) {
            text += '\n' + extractText(node.Rubrica).toUpperCase() + '\n';
        } else if (node['#text']) {
            text += String(node['#text']) + ' ';
        } else {
            for (const key in node) {
                if (typeof node[key] === 'object' || typeof node[key] === 'string' || typeof node[key] === 'number') {
                    if (!key.startsWith('@_')) {
                        text += extractText(node[key]);
                    }
                }
            }
        }
    }

    return text.trim().replace(/\n\s*\n\s*\n/g, '\n\n');
}

/**
 * Specifically look for a point marker (e.g., "1.") in a node.
 */
export function getPointMarker(node: any): string | null {
    if (!node || typeof node !== 'object') return null;
    
    const lineas = Array.isArray(node.Linea) ? node.Linea : (node.Linea ? [node.Linea] : []);
    for (const linea of lineas) {
        const chars = Array.isArray(linea.Char) ? linea.Char : (linea.Char ? [linea.Char] : []);
        for (const char of chars) {
            const text = extractText(char).trim();
            const isBold = typeof char === 'object' && char['@_formaChar'] === 'Bold';
            if (isBold && /^\d+\.$/.test(text)) {
                return text;
            }
        }
    }
    return null;
}

/**
 * Formats a date string into dd.mm.yyyy format.
 */
export function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    let d: Date;
    
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) {
            return `${parts[2].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[0]}`;
        }
        d = new Date(dateStr);
    } else if (dateStr.includes('/') || (dateStr.includes('.') && dateStr.split('.').length === 3)) {
        const sep = dateStr.includes('/') ? '/' : '.';
        const parts = dateStr.split(sep);
        if (parts[2].length === 4) {
            return `${parts[0].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[2]}`;
        }
        d = new Date(`${parts[1]}/${parts[0]}/${parts[2]}`);
    } else {
        d = new Date(dateStr);
    }

    if (isNaN(d.getTime())) return dateStr;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

/**
 * Parses the Retsinformation XML structure into our internal format.
 */
export function parseRetsinformationXml(xmlString: string, fallbackName: string = "Uden titel"): ParsedLaw {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseTagValue: false, 
    });
    const jsonObj = parser.parse(xmlString);
    
    const root = jsonObj.Dokument || jsonObj;
    const meta = root?.Meta || {};
    const titel = meta.DocumentTitle || fallbackName;
    const popularTitle = meta.PopularTitle || undefined;
    const status = meta.Status || "Ukendt";
    const uniqueDocumentId = meta.UniqueDocumentId ? String(meta.UniqueDocumentId) : undefined;
    const number = meta.Number ? String(meta.Number) : undefined;
    const date = formatDate(meta.DiesSigni || "");
    
    const content = root?.DokumentIndhold || {};
    
    const chapters: Chapter[] = [];

    const getOrCreateChapter = (name: string, title: string = "") => {
        let chapter = chapters.find(c => c.nummer === name);
        if (!chapter) {
            chapter = { nummer: name, titel: title, paragraffer: [] };
            chapters.push(chapter);
        }
        return chapter;
    };

    const traverse = (node: any, currentChapter: Chapter | null) => {
        if (!node || typeof node !== 'object') return;

        const nodes = Array.isArray(node) ? node : [node];

        for (const item of nodes) {
            if (item.Kapitel) {
                const chaptersArray = Array.isArray(item.Kapitel) ? item.Kapitel : [item.Kapitel];
                for (const kap of chaptersArray) {
                    const newChapter: Chapter = {
                        nummer: kap.Explicatus || "Kapitel",
                        titel: extractText(kap.Rubrica) || "",
                        paragraffer: []
                    };
                    chapters.push(newChapter);
                    traverse(kap, newChapter);
                }
                continue; 
            }

            if (item.Paragraf) {
                const pArray = Array.isArray(item.Paragraf) ? item.Paragraf : [item.Paragraf];
                for (const p of pArray) {
                    const itemObj: Paragraph = {
                        nummer: p.Explicatus || "§",
                        tekst: ""
                    };
                    
                    if (p.Stk) {
                        const stkArray = Array.isArray(p.Stk) ? p.Stk : [p.Stk];
                        itemObj.tekst = stkArray.map((s: any) => {
                            const stkPrefix = s.Explicatus ? s.Explicatus + ' ' : '';
                            return stkPrefix + extractText(s);
                        }).join('\n\n');
                    } else {
                        itemObj.tekst = extractText(p);
                    }

                    const target = currentChapter || getOrCreateChapter("Indhold");
                    target.paragraffer.push(itemObj);
                }
                continue;
            }

            if (item.Exitus) {
                const exitusArray = Array.isArray(item.Exitus) ? item.Exitus : [item.Exitus];
                for (const ex of exitusArray) {
                    const pointNum = getPointMarker(ex);
                    const text = extractText(ex);
                    if (!text) continue;

                    if (pointNum) {
                        const itemObj: Paragraph = {
                            nummer: pointNum,
                            tekst: text.replace(pointNum, '').trim()
                        };
                        
                        const target = currentChapter || getOrCreateChapter("Indhold");
                        target.paragraffer.push(itemObj);
                    } else if (chapters.length > 0) {
                        const lastKap = chapters[chapters.length - 1];
                        if (lastKap.paragraffer.length > 0) {
                            const lastPara = lastKap.paragraffer[lastKap.paragraffer.length - 1];
                            lastPara.tekst += '\n\n' + text;
                        } else {
                            lastKap.paragraffer.push({ nummer: "-", tekst: text });
                        }
                    } else {
                        const target = getOrCreateChapter("Indledning");
                        target.paragraffer.push({ nummer: "-", tekst: text });
                    }
                }
                continue;
            }

            const containerTags = ['Indledning', 'Bog', 'Afsnit', 'TekstGruppe', 'DokumentIndhold'];
            for (const tag of containerTags) {
                if (item[tag]) {
                    traverse(item[tag], currentChapter);
                }
            }

            for (const key in item) {
                if (!['Kapitel', 'Paragraf', 'Exitus', ...containerTags].includes(key) && typeof item[key] === 'object') {
                    traverse(item[key], currentChapter);
                }
            }
        }
    };

    traverse(content, null);

    return { titel, popularTitle, status, kapitler: chapters, uniqueDocumentId, number, date };
}
