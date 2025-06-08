import type {
  CSVParseResult,
  BuildingLevel,
  BuildingLevelProperty,
} from "../types/building";

/**
 * Parse CSV text into structured data
 */
export function parseCSV(csvText: string): CSVParseResult {
  const errors: string[] = [];

  if (!csvText.trim()) {
    return {
      headers: [],
      data: [],
      errors: ["CSV text is empty"],
    };
  }

  try {
    const lines = csvText.trim().split("\n");

    if (lines.length < 2) {
      errors.push("CSV must have at least a header row and one data row");
      return { headers: [], data: [], errors };
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]);

    // Parse data rows
    const data: string[][] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);

      // Skip empty rows
      if (row.length === 0 || row.every((cell) => !cell.trim())) {
        continue;
      }

      // Validate row length matches headers
      if (row.length !== headers.length) {
        errors.push(
          `Row ${i + 1} has ${row.length} columns, expected ${headers.length}`
        );
        continue;
      }

      data.push(row);
    }

    if (data.length === 0) {
      errors.push("No valid data rows found");
    }

    return {
      headers,
      data,
      errors,
    };
  } catch (error) {
    return {
      headers: [],
      data: [],
      errors: [
        `Failed to parse CSV: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      ],
    };
  }
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = "";
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
}

/**
 * Parse time string in hh:mm:ss format to total minutes
 */
function parseTimeToMinutes(timeStr: string): {
  value: number;
  error?: string;
} {
  // Handle empty values
  if (!timeStr || timeStr.trim() === "") {
    return { value: 0 };
  }

  // Handle already numeric values (backwards compatibility)
  // But don't treat time formats like "00:02:00" as numeric
  if (!/\d+:\d+:\d+/.test(timeStr)) {
    const numericValue = parseFloat(timeStr);
    if (!isNaN(numericValue)) {
      return { value: numericValue };
    }
  }

  // Parse hh:mm:ss format
  const timeRegex = /^(\d+):(\d{1,2}):(\d{1,2})$/;
  const match = timeStr.trim().match(timeRegex);

  if (!match) {
    return {
      value: 0,
      error: `Invalid time format "${timeStr}". Expected hh:mm:ss format or empty for 0.`,
    };
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);

  // Validate ranges
  if (minutes >= 60 || seconds >= 60) {
    return {
      value: 0,
      error: `Invalid time "${timeStr}". Minutes and seconds must be less than 60.`,
    };
  }

  // Convert to total minutes (including fractional minutes from seconds)
  const totalMinutes = hours * 60 + minutes + seconds / 60;
  return { value: Math.round(totalMinutes * 100) / 100 }; // Round to 2 decimal places
}

/**
 * Parse numeric value with empty string handling and space separator support
 */
function parseNumericValue(valueStr: string): {
  value: number;
  error?: string;
} {
  // Handle empty values
  if (!valueStr || valueStr.trim() === "") {
    return { value: 0 };
  }

  // Remove spaces that might be used as thousand separators
  // Also handle other common separators like underscores
  const cleanedValue = valueStr.trim().replace(/[\s_]/g, "");

  // Handle comma as decimal separator (European format)
  const normalizedValue = cleanedValue.replace(",", ".");

  const numericValue = parseFloat(normalizedValue);
  if (isNaN(numericValue)) {
    return {
      value: 0,
      error: `"${valueStr}" is not a valid number. Use empty cell for 0. Supported formats: 180000, 180 000, 180_000, 180.5, 180,5`,
    };
  }

  return { value: numericValue };
}

/**
 * Convert mapped CSV data to BuildingLevel objects
 */
export function convertCSVToLevels(
  data: string[][],
  columnMappings: Record<number, BuildingLevelProperty | "unmapped">
): { levels: BuildingLevel[]; errors: string[] } {
  const levels: BuildingLevel[] = [];
  const errors: string[] = [];

  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    const level: Partial<BuildingLevel> = {
      meat: 0,
      plant: 0,
      fungus: 0,
      wetSoil: 0,
      sand: 0,
      honeydew: 0,
      power: 0,
      powerDelta: 0,
      time: 0,
    };

    // Map each column to the corresponding property
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const property = columnMappings[colIndex];
      if (!property || property === "unmapped") continue;

      const cellValue = row[colIndex] || ""; // Handle undefined cells as empty strings

      let parseResult: { value: number; error?: string };

      // Special handling for time field
      if (property === "time") {
        parseResult = parseTimeToMinutes(cellValue);
      } else {
        parseResult = parseNumericValue(cellValue);
      }

      if (parseResult.error) {
        errors.push(
          `Row ${rowIndex + 1}, Column ${colIndex + 1}: ${parseResult.error}`
        );
      }

      level[property] = parseResult.value;
    }

    levels.push(level as BuildingLevel);
  }

  return { levels, errors };
}

/**
 * Generate sample CSV for user reference
 */
export function generateSampleCSV(): string {
  const headers = [
    "Level",
    "Meat",
    "Plant",
    "Fungus",
    "Wet Soil",
    "Sand",
    "Honeydew",
    "Power",
    "Power Delta",
    "Time (hh:mm:ss)",
  ];
  const sampleData = [
    ["1", "100", "50", "25", "10", "5", "", "10", "2", "01:00:00"],
    ["2", "150", "75", "40", "15", "8", "5", "15", "3", "01:30:00"],
    ["3", "200", "100", "60", "20", "12", "10", "20", "4", "02:00:00"],
    ["4", "180 000", "75_000", "40,5", "", "", "", "", "", "525:50:30"],
    ["5", "50", "25", "10", "5", "2", "1", "5", "1", "00:02:00"],
  ];

  return [headers, ...sampleData]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
}
