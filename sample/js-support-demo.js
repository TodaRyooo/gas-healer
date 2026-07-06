// JS対応デモ: 型注釈の無いプレーンなJavaScript(Clasp+JS環境)でも検出される
let jsGlobalCache = [];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Custom').addToUi();
}
