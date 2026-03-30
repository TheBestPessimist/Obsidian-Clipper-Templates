import fs from 'fs';
import path from 'path';

// Allowed property types in Obsidian Web Clipper
export type PropType = 'text' | 'multitext' | 'number' | 'checkbox' | 'date' | 'datetime';

interface TemplateJson {
  name?: string;
  properties?: { name?: string; type?: string }[];
}

interface TypeUsage {
  [type: string]: Set<string>;
}

interface PropertyUsage {
  types: TypeUsage;
}

export class PropertyTypeConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PropertyTypeConflictError';
  }
}

const ALLOWED_TYPES: ReadonlyArray<PropType> = [
  'text',
  'multitext',
  'number',
  'checkbox',
  'date',
  'datetime',
];

function assertValidType(type: string, propertyName: string, templateName: string): PropType {
  if (!ALLOWED_TYPES.includes(type as PropType)) {
    throw new Error(
      `Invalid type "${type}" for property "${propertyName}" in template "${templateName}". ` +
        `Allowed types: ${ALLOWED_TYPES.join(', ')}.`,
    );
  }
  return type as PropType;
}

/**
 * Scan all template JSON files in a directory and collect merged property types.
 *
 * Rules:
 * - Every property must have an explicit `type`; otherwise this throws.
 * - Types must be one of the allowed property types.
 * - If the same property name appears with different types across templates, this throws
 *   a PropertyTypeConflictError listing all templates involved.
 */
export function collectPropertyTypesFromTemplates(templatesDir: string): Record<string, PropType> {
  const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.json'));
  const usage: Record<string, PropertyUsage> = {};

  for (const file of files) {
    const fullPath = path.join(templatesDir, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const tpl = JSON.parse(raw) as TemplateJson;
    const templateName = tpl.name || file;

    for (const prop of tpl.properties ?? []) {
      if (!prop.name) continue;
      if (!prop.type) {
        throw new Error(
          `Property "${prop.name}" in template "${templateName}" is missing a 'type' field. ` +
            `Please set an explicit type (text, multitext, number, checkbox, date, datetime).`,
        );
      }

      const type = assertValidType(prop.type, prop.name, templateName);
      const entry = usage[prop.name] ?? { types: {} };
      if (!entry.types[type]) {
        entry.types[type] = new Set<string>();
      }
      entry.types[type].add(templateName);
      usage[prop.name] = entry;
    }
  }

  const result: Record<string, PropType> = {};
  const conflictLines: string[] = [];

  for (const [name, { types }] of Object.entries(usage)) {
    const distinctTypes = Object.keys(types);
    if (distinctTypes.length === 1) {
      result[name] = distinctTypes[0] as PropType;
    } else {
      const pieces = distinctTypes.map((t) => {
        const templates = Array.from(types[t]).join(', ');
        return `${t} (in ${templates})`;
      });
      conflictLines.push(`- "${name}": ${pieces.join(' vs ')}`);
    }
  }

  if (conflictLines.length > 0) {
    throw new PropertyTypeConflictError(
      'Conflicting property types detected between templates:\n' + conflictLines.join('\n'),
    );
  }

  return result;
}

/**
 * Write a types.json file compatible with the Clipper "Import properties" dialog.
 */
export function writeTypesJsonFromTemplates(templatesDir: string, outPath: string): void {
  const map = collectPropertyTypesFromTemplates(templatesDir);
  const types: Record<string, string> = {};
  for (const [name, type] of Object.entries(map)) {
    types[name] = type;
  }
  const payload = { types };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
}

