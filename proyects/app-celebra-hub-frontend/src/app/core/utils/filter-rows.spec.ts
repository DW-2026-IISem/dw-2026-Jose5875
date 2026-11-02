import { filterRows } from './filter-rows';

interface Row {
  name: string;
  note: string | null;
}

const ROWS: Row[] = [
  { name: 'Alfa', note: 'Primera' },
  { name: 'Beta', note: null },
];
const pick = (row: Row) => [row.name, row.note];

describe('filterRows', () => {
  it('returns a copy when there is no query', () => {
    const result = filterRows(ROWS, '   ', pick);

    expect(result).toEqual(ROWS);
    expect(result).not.toBe(ROWS);
  });

  it('matches without case sensitivity', () => {
    expect(filterRows(ROWS, 'ALFA', pick)).toEqual([ROWS[0]]);
  });

  it('tolerates null values and trims the query', () => {
    expect(filterRows(ROWS, '  prim ', pick)).toEqual([ROWS[0]]);
  });

  it('returns an empty array when there are no matches', () => {
    expect(filterRows(ROWS, 'inexistente', pick)).toEqual([]);
  });
});
