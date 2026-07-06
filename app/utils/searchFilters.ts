import type { FilterableAttribute } from "~/types/search";

export type FilterOperator =
  | "="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "EXISTS"
  | "NOT EXISTS"
  | "TO";

export interface FilterRow {
  attribute: string;
  operator: FilterOperator;
  value: string;
  valueTo?: string;
}

export const FILTER_OPERATORS: { label: string; value: FilterOperator }[] = [
  { label: "Equals", value: "=" },
  { label: "Not equal", value: "!=" },
  { label: "Greater than", value: ">" },
  { label: "Greater or equal", value: ">=" },
  { label: "Less than", value: "<" },
  { label: "Less or equal", value: "<=" },
  { label: "Range (TO)", value: "TO" },
  { label: "Exists", value: "EXISTS" },
  { label: "Does not exist", value: "NOT EXISTS" },
];

export function getFilterableAttributeNames(
  attributes: FilterableAttribute[] | null | undefined,
): string[] {
  if (!attributes?.length) {
    return [];
  }

  return attributes.flatMap((attribute) => {
    if (typeof attribute === "string") {
      return [attribute];
    }

    return attribute.attributePatterns;
  });
}

function formatFilterValue(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return '""';
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return trimmed;
  }

  if (trimmed === "true" || trimmed === "false" || trimmed === "null") {
    return trimmed;
  }

  return `"${trimmed.replace(/"/g, '\\"')}"`;
}

function formatFilterRow(row: FilterRow): string | null {
  if (!row.attribute.trim()) {
    return null;
  }

  const attribute = row.attribute.trim();

  if (row.operator === "EXISTS") {
    return `${attribute} EXISTS`;
  }

  if (row.operator === "NOT EXISTS") {
    return `${attribute} NOT EXISTS`;
  }

  if (row.operator === "TO") {
    const from = row.value.trim();
    const to = row.valueTo?.trim();

    if (!from || !to) {
      return null;
    }

    return `${attribute} ${formatFilterValue(from)} TO ${formatFilterValue(to)}`;
  }

  if (!row.value.trim()) {
    return null;
  }

  return `${attribute} ${row.operator} ${formatFilterValue(row.value)}`;
}

export function buildFilterExpression(rows: FilterRow[]): string {
  return rows
    .map(formatFilterRow)
    .filter((expression): expression is string => Boolean(expression))
    .join(" AND ");
}

export function createEmptyFilterRow(attribute = ""): FilterRow {
  return {
    attribute,
    operator: "=",
    value: "",
    valueTo: "",
  };
}

export type FilterFormValues = Record<string, string>;

export function createFilterForm(attributes: string[]): FilterFormValues {
  return Object.fromEntries(attributes.map((attribute) => [attribute, ""]));
}

export function buildFilterFormExpression(form: FilterFormValues): string {
  const rows: FilterRow[] = Object.entries(form)
    .filter(([, value]) => value.trim())
    .map(([attribute, value]) => ({
      attribute,
      operator: "=",
      value,
    }));

  return buildFilterExpression(rows);
}

export function hasActiveOverrideRows(rows: FilterRow[]): boolean {
  return rows.some((row) => {
    if (!row.attribute.trim()) {
      return false;
    }

    if (row.operator === "EXISTS" || row.operator === "NOT EXISTS") {
      return true;
    }

    if (row.operator === "TO") {
      return Boolean(row.value.trim() && row.valueTo?.trim());
    }

    return Boolean(row.value.trim());
  });
}

export function resolveFilterExpression(
  form: FilterFormValues,
  overrideRows: FilterRow[],
): string {
  if (hasActiveOverrideRows(overrideRows)) {
    return buildFilterExpression(overrideRows);
  }

  return buildFilterFormExpression(form);
}

export function countFilterConditions(expression: string): number {
  const trimmed = expression.trim();

  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+AND\s+/).filter(Boolean).length;
}
