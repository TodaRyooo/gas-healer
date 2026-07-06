// NG: GASの予約トリガー関数を非ホイストのconstアロー関数で定義している
const onEdit = (e: GoogleAppsScript.Events.SheetsOnEdit): void => {
  Logger.log(`Edited: ${e.range.getA1Notation()}`);
};
