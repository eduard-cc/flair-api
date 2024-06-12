import { parse } from 'csv-parse/sync';
import { FileParser } from 'src/file-parsers/file-parser.interface';

export class CsvFileParser implements FileParser {
  parse(fileBuffer: Buffer): unknown[] {
    const fileContent = fileBuffer.toString();
    const records = parse(fileContent, {
      columns: (header) =>
        header.map((columnName: string) => this.toCamelCase(columnName)),
      skip_empty_lines: true,
    });
    return records;
  }

  private toCamelCase(str: string): string {
    const regex = /(?:^\w|[A-Z]|\b\w|\s+)/g;

    return str.replace(regex, (match, index) => {
      if (Number(match) === 0) return ''; // ignore white spaces
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
  }
}