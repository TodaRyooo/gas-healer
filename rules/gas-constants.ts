/**
 * GASのグローバルService取得API群。
 * 静的解析による既知リストのため、ここに無いServiceは検出対象外（README Limitations参照）。
 */
export const GAS_SERVICE_GLOBALS = new Set<string>([
  'SpreadsheetApp',
  'DriveApp',
  'GmailApp',
  'CalendarApp',
  'DocumentApp',
  'FormApp',
  'SlidesApp',
  'ScriptApp',
  'PropertiesService',
  'CacheService',
  'LockService',
  'HtmlService',
  'ContentService',
  'UrlFetchApp',
  'Session',
  'Utilities',
  'MailApp',
  'SitesApp',
  'LanguageApp',
  'ContactsApp',
  'DataStudioApp',
  'TasksApp',
  'XmlService',
]);

/**
 * GASが特定の名前を予約関数として自動実行するシンプルトリガー群。
 */
export const GAS_RESERVED_TRIGGER_NAMES = new Set<string>([
  'onEdit',
  'onOpen',
  'onInstall',
  'onFormSubmit',
  'onSelectionChange',
  'onChange',
  'doGet',
  'doPost',
]);
