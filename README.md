# 🕒 Time Tab Tracker

**Time Tab Tracker** — это расширение для браузера Chrome, которое отслеживает, сколько времени вы провели на каждом сайте **только в активных вкладках**, и автоматически синхронизирует эту статистику с Google Таблицей.

---

## 🚀 Возможности

- 📌 Учёт времени **только на активных вкладках** (не учитываются фоновые или свернутые вкладки)
- 📊 Сбор статистики по сайтам в течение дня
- 🕑 Хранение данных за последние **2 дня**
- 🔄 Синхронизация с Google Таблицей каждые **2 минуты**
- ⏱️ Сайты с временем < 5 минут не записываются
- 🔁 Обновление строк без дублирования

---

## 📦 Установка расширения

1. Склонируйте или скачайте репозиторий:

    ```bash
    git clone https://github.com/Squizly/TabTrackerExtension.git
    ```

2. Откройте Chrome и перейдите по адресу:

    ```
    chrome://extensions/
    ```

3. Включите **режим разработчика** (в правом верхнем углу)

4. Нажмите **"Загрузить распакованное расширение"**

5. Укажите путь к папке, где находится `manifest.json`

6. Расширение появится в панели. Закрепите его при необходимости

---

## 📄 Настройка Google Таблицы

1. Создайте новую таблицу в Google Sheets с листом `ChromeActivity`

2. Добавьте заголовки в **строку 2** (строка 1 может быть пустой):

    | B (Дата)            | C (Домен)         | D (Время)       |
    |---------------------|-------------------|------------------|
    | `16 июля (вторник)` | `www.youtube.com` | `1 ч 42 мин`     |

3. Перейдите в меню: **Расширения → Apps Script**

4. Вставьте в редактор скрипт из `activity.gs` (лежит в этом репозитории), далее этот файл следует удалить, он больше не понадобится

5. Настройте доступы:
   - При первом запуске появится запрос на авторизацию
   - Дайте разрешение на доступ к таблице

6. Разверните как веб-приложение:
   - **Развертывание → Новое развертывание**
   - Тип: `Веб-приложение`
   - Выполнять от имени: `Вы сами`
   - Доступ: `Все, включая анонимных`
   - Нажмите **Развернуть** и скопируйте Web URL

7. Вставьте этот URL в `background.js` вместо `YOUR_WEBHOOK_URL`

---

## 📝 Пример отображения данных в таблице

| Дата    | Домен               | Время          |
|---------|---------------------|----------------|
| 16 июля | www.youtube.com     | 1 ч 23 мин     |
| 16 июля | chat.openai.com     | 42 мин 10 сек  |

---
