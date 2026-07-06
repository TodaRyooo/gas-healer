// NG: ループ内でRange.setValue()を単発呼び出ししている
function writeRows(sheet: GoogleAppsScript.Spreadsheet.Sheet, data: string[]): void {
  for (let i = 0; i < data.length; i++) {
    sheet.getRange(i + 1, 1).setValue(data[i]);
  }
}
