// NG: グローバルスコープでGAS ServiceのAPIを呼び出している
const ss = SpreadsheetApp.getActiveSpreadsheet();

function readSheet(): void {
  const sheet = ss.getSheetByName('Sheet1');
  Logger.log(sheet?.getName());
}
