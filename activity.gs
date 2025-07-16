
!!!!!!  
USE THIS CODE ONLY IN APP SCRIPTS (GOOGLE-SHEETS)
AFTER YOU CAN DELETE THIS FILE



function doPost(e) {
  const sheetName = "ChromeActivity";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!e.postData || !e.postData.contents) {
    return ContentService.createTextOutput("No POST data");
  }

  const data = JSON.parse(e.postData.contents); // Ожидаем [{date, domain, timestamp}]
  const headerRow = 2;
  const dateCol = 2;     // Колонка B
  const domainCol = 3;   // Колонка C
  const timestampCol = 4; // Колонка D

  const monthNames = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];

  const lastRow = sheet.getLastRow();
  let values = [];

  if (lastRow > headerRow) {
    const numRows = lastRow - headerRow;
    const range = sheet.getRange(headerRow + 1, dateCol, numRows, 3);
    values = range.getValues();
  }

  // Ключ: "16 июля|youtube.com" → row number
  const mapIndex = {};
  for (let i = 0; i < values.length; i++) {
    const rawDate = values[i][0];
    const domain = values[i][1];

    if (!rawDate || !domain) continue;

    const jsDate = new Date(rawDate);
    const keyDate = `${jsDate.getDate()} ${monthNames[jsDate.getMonth()]}`;
    mapIndex[keyDate + '|' + domain] = i + headerRow + 1;
  }

  data.forEach(item => {
    // ⛔ Пропуск, если < 5 минут
    if (item.timestamp < 5 * 60 * 1000) return;

    const dateParts = item.date.split("-");
    const day = parseInt(dateParts[2], 10);
    const monthIndex = parseInt(dateParts[1], 10) - 1;
    const keyDate = `${day} ${monthNames[monthIndex]}`;
    const key = keyDate + '|' + item.domain;

    const formattedTime = formatDuration(item.timestamp);

    if (mapIndex[key]) {
      sheet.getRange(mapIndex[key], timestampCol).setValue(formattedTime);
    } else {
      sheet.appendRow([
        "",            // A (пусто)
        keyDate,       // B — дата в формате "16 июля"
        item.domain,   // C
        formattedTime  // D — форматированное время
      ]);
    }
  });

  // Сортировка: сначала по дате, затем по времени
  sortSheetByDateAndTimeDesc(sheet, headerRow, dateCol, domainCol, timestampCol);

  return ContentService.createTextOutput("Success");
}

/**
 * Преобразует миллисекунды → "1ч 23м", "4м 15с", "42с"
 */
function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;

  if (hours > 0) return `${hours}ч ${remMin}м`;
  if (minutes > 0) return `${minutes}м ${seconds}с`;
  return `${seconds}с`;
}

/**
 * Обратно парсит "2ч 4м" → миллисекунды
 */
function parseDurationToMs(str) {
  let ms = 0;
  const hoursMatch = str.match(/(\d+)ч/);
  const minutesMatch = str.match(/(\d+)м/);
  const secondsMatch = str.match(/(\d+)с/);

  if (hoursMatch) ms += parseInt(hoursMatch[1]) * 60 * 60 * 1000;
  if (minutesMatch) ms += parseInt(minutesMatch[1]) * 60 * 1000;
  if (secondsMatch) ms += parseInt(secondsMatch[1]) * 1000;

  return ms;
}

/**
 * Сортирует таблицу сначала по дате (свежие выше), потом по времени
 */
function sortSheetByDateAndTimeDesc(sheet, headerRow, dateCol, domainCol, timestampCol) {
  const startRow = headerRow + 1;
  const lastRow = sheet.getLastRow();
  const numRows = lastRow - headerRow;

  if (numRows <= 1) return;

  const range = sheet.getRange(startRow, dateCol, numRows, 3);
  const values = range.getValues();

  const monthOrder = {
    "января": 0, "февраля": 1, "марта": 2, "апреля": 3,
    "мая": 4, "июня": 5, "июля": 6, "августа": 7,
    "сентября": 8, "октября": 9, "ноября": 10, "декабря": 11
  };

  const parseDate = (str) => {
    const [dayStr, monthStr] = str.split(" ");
    const day = parseInt(dayStr);
    const month = monthOrder[monthStr];
    if (isNaN(day) || month === undefined) return new Date(0); // некорректные данные → низ
    return new Date(new Date().getFullYear(), month, day);
  };

  const parsed = values.map(row => {
    const [date, domain, timeStr] = row;
    return {
      row,
      dateObj: parseDate(date),
      durationMs: parseDurationToMs(timeStr)
    };
  });

  parsed.sort((a, b) => {
    if (b.dateObj - a.dateObj !== 0) {
      return b.dateObj - a.dateObj; // дата по убыванию
    }
    return b.durationMs - a.durationMs; // время по убыванию
  });

  const sortedValues = parsed.map(p => p.row);
  range.setValues(sortedValues);
}


/**
 * Преобразует "16 июля" → Date (для сортировки)
 */
function parseDateStrToComparable(str) {
  const [day, monthName] = str.split(" ");
  const months = {
    "января": 0, "февраля": 1, "марта": 2, "апреля": 3,
    "мая": 4, "июня": 5, "июля": 6, "августа": 7,
    "сентября": 8, "октября": 9, "ноября": 10, "декабря": 11
  };

  const monthIndex = months[monthName.toLowerCase()];
  if (monthIndex === undefined) return 0;

  const year = new Date().getFullYear(); // Считаем текущий год
  return new Date(year, monthIndex, parseInt(day));
}
