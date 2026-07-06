// OK: 4ルールいずれの違反も無いGASコードの例
const CACHE_KEY = 'cachedRows';

function main(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Sheet1');
  if (!sheet) return;

  const data = ['a', 'b', 'c'];
  const values = data.map((d) => [d]);
  sheet.getRange(1, 1, values.length, 1).setValues(values);
}

function onOpen(): void {
  SpreadsheetApp.getUi().createMenu('Custom').addToUi();
}
