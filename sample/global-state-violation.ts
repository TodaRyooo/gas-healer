// NG: グローバルスコープでletによる可変状態を宣言している
let cachedRows: string[] = [];

function appendRow(row: string): void {
  cachedRows.push(row);
}
