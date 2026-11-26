# SplitEvents

Telegram Mini App для совместных мероприятий, профилей и дружеских номинаций.

## Быстрые сведения

- Публикация: GitHub Pages из корня ветки `main`.
- Точка входа: `index.html` → `app.js`.
- Сборки и сторонних npm-зависимостей нет: браузер загружает ES-модули и CSS напрямую. Node.js используется только для проверки синтаксиса.
- Маршруты: `#/`, `#/profile`, `#/events`, `#/servers`, `#/nominations?event=...`.
- Backend: Cloudflare Worker (`worker/index.js`) + D1. Профиль пользователя, отображаемое имя, аватар и баннер синхронизируются с сервером после проверки Telegram `initData`.
- Изображения профиля хранятся в ImageKit Media Library; приватный ImageKit API key хранится только в секрете Worker. D1 хранит URL и file ID текущих изображений.
- Голосование пока работает только в памяти текущего запуска. Каталог номинантов и событий хранится в исходниках; локальный кэш изображений профиля — в IndexedDB, скрытые события — в localStorage.

## Структура

```text
/
├── index.html
├── app.js
├── README.md
├── assets/
│   ├── events/
│   └── nominees/
├── .github/
│   └── workflows/
│       └── quality.yml
├── css/
│   ├── base.css
│   ├── design-system.css
│   ├── notifications.css
│   ├── components.css
│   ├── layout.css
│   ├── pages.css
│   ├── menu.css
│   ├── profile.css
│   ├── events.css
│   ├── nominations.css
│   ├── nominations-carousel.css
│   ├── nominations-picker.css
│   └── nominations-cards.css
├── js/
│   ├── api.js
│   ├── dom.js
│   ├── notifications.js
│   ├── telegram.js
│   ├── menu.js
│   ├── profile.js
│   ├── storage.js
│   ├── nominations.js
│   ├── nominations/
│   │   ├── database/
│   │   │   ├── nominees.js
│   │   │   ├── definitions.js
│   │   │   └── validate.js
│   │   ├── state.js
│   │   └── model.js
│   ├── events/
│   │   ├── data.js
│   │   ├── storage.js
│   │   ├── hidden-state.js
│   │   └── active-state.js
│   └── pages/
│       ├── page-shell.js
│       ├── empty-state.js
│       ├── event-card.js
│       ├── events.js
│       └── servers.js
├── worker/
│   ├── index.js
│   └── migrations/
│       └── 0002_profile_media_file_ids.sql
├── package.json
├── scripts/
│   └── check-js.mjs
└── docs/
    ├── architecture.md
    ├── design-review.md
    └── events.md
```

## Где что менять

**Номинанты и номинации.** Каталог людей находится в `js/nominations/database/nominees.js`. Правила номинаций и списки допустимых участников — в `js/nominations/database/definitions.js`. Проверка ID и ссылок находится рядом в `validate.js`. Начальное изменяемое состояние создаёт `state.js`, расчёты и сборку локального бюллетеня выполняет `model.js`. DOM, окна выбора и карусель находятся в `js/nominations.js`.

**События.** Список событий — `js/events/data.js`; шаблон карточки — `js/pages/event-card.js`; локальное скрытие и расчёт активных событий — отдельные модули в `js/events/`.

**Профиль и API.** Интерфейс — `js/profile.js`; локальный кэш изображений — `js/storage.js`. Запросы к API — `js/api.js`; проверка Telegram `initData`, запись метаданных в D1 и серверная загрузка медиа в ImageKit — `worker/index.js`. Секрет `IMAGEKIT_PRIVATE_KEY` хранится только в Cloudflare Worker. Общие уведомления об ошибках и проблемах хранения — `js/notifications.js`.

**Визуал.** Общие цвета, радиусы, размеры, тени и состояния — `css/design-system.css`. Уведомления имеют отдельный слой `css/notifications.css`. Стили номинаций разделены по назначению: базовая структура, карусель, окно выбора и оформление самих карточек.

Подробная инструкция по добавлению нескольких событий и их обложек находится в [docs/events.md](docs/events.md).

## Добавление номинанта

1. Добавьте запись в `js/nominations/database/nominees.js`: уникальный `id`, имя, `gender` (`F`, `M` или `I`) и ссылку `avatar` (её можно оставить пустой).
2. Добавьте ID в `nomineeIds` нужной номинации в `definitions.js` или в `firstId` / `secondId` пары DUO.
3. Проверка базы автоматически выполняется при загрузке и сообщает о повторяющихся ID или ссылках на неизвестных людей.

Не храните текущий выбор пользователя в файлах базы: выбор создаётся отдельно для каждого экземпляра виджета.

## Правила изменения ресурсов

После правки CSS увеличивайте версию соответствующего файла в `index.html`. После правки JavaScript увеличивайте версию импорта этого модуля и версию `app.js` в `index.html`, если менялся список его импортов. Это сбрасывает старый кеш Telegram WebView.

Перед публикацией запускайте `npm run check`: команда проверяет синтаксис всех JavaScript-модулей без сборки и сторонних зависимостей. GitHub Actions выполняет ту же проверку для push и pull request в `main`.

Подробная карта модулей и границы ответственности описаны в [docs/architecture.md](docs/architecture.md). Визуальные правила и результаты аудита — в [docs/design-review.md](docs/design-review.md).
