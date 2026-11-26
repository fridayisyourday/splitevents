# SplitEvents

Telegram Mini App для совместных мероприятий, профилей и дружеских номинаций.

## Быстрые сведения

- Публикация: GitHub Pages из корня ветки `main`.
- Точка входа: `index.html` → `app.js`.
- Сборки и пакетного менеджера нет: браузер загружает ES-модули и CSS напрямую.
- Маршруты: `#/`, `#/profile`, `#/events`, `#/servers`, `#/nominations?event=...`.
- Серверной базы и синхронизации голосов пока нет. Каталог номинантов и событий хранится в исходниках; профиль и скрытые события — локально на устройстве.

## Структура

```text
/
├── index.html
├── app.js
├── README.md
├── css/
│   ├── base.css
│   ├── design-system.css
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
│   ├── dom.js
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
└── docs/
    ├── architecture.md
    └── design-review.md
```

## Где что менять

**Номинанты и номинации.** Каталог людей находится в `js/nominations/database/nominees.js`. Правила номинаций и списки допустимых участников — в `js/nominations/database/definitions.js`. Проверка ID и ссылок находится рядом в `validate.js`. Начальное изменяемое состояние создаёт `state.js`, расчёты и сборку локального бюллетеня выполняет `model.js`. DOM, окна выбора и карусель находятся в `js/nominations.js`.

**События.** Список событий — `js/events/data.js`; шаблон карточки — `js/pages/event-card.js`; локальное скрытие и расчёт активных событий — отдельные модули в `js/events/`.

**Профиль.** Интерфейс — `js/profile.js`; сохранение имени и изображений — `js/storage.js`.

**Визуал.** Общие цвета, радиусы, размеры, тени и состояния — `css/design-system.css`. Стили номинаций разделены по назначению: базовая структура, карусель, окно выбора и оформление самих карточек.

## Добавление номинанта

1. Добавьте запись в `js/nominations/database/nominees.js`: уникальный `id`, имя, `gender` (`F`, `M` или `I`) и ссылку `avatar` (её можно оставить пустой).
2. Добавьте ID в `nomineeIds` нужной номинации в `definitions.js` или в `firstId` / `secondId` пары DUO.
3. Проверка базы автоматически выполняется при загрузке и сообщает о повторяющихся ID или ссылках на неизвестных людей.

Не храните текущий выбор пользователя в файлах базы: выбор создаётся отдельно для каждого экземпляра виджета.

## Правила изменения ресурсов

После правки CSS увеличивайте версию соответствующего файла в `index.html`. После правки JavaScript увеличивайте версию импорта этого модуля и версию `app.js` в `index.html`, если менялся список его импортов. Это сбрасывает старый кеш Telegram WebView.

Подробная карта модулей и границы ответственности описаны в [docs/architecture.md](docs/architecture.md). Визуальные правила и результаты аудита — в [docs/design-review.md](docs/design-review.md).
