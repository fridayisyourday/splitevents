# SplitEvents

Telegram Mini App для совместных мероприятий, профилей и дружеских номинаций.

## Быстрые сведения

- Публикация: GitHub Pages через GitHub Actions; Vite собирает приложение в `dist/`.
- Точка входа: `index.html` → `src/main.js` → `src/App.vue`.
- Frontend: Vue 3 + Vite. Все страницы, шапка, навигация, карточки номинаций, карусель и окна выбора реализованы Vue-компонентами. Общие разбор и генерация hash-маршрутов находятся в `js/navigation.js`; каталог номинантов, состояние выбора и расчёт локального бюллетеня — в отдельных JS-модулях.
- Для разработки: `npm install`, затем `npm run dev`; production-сборка — `npm run build`.
- Маршруты: `#/`, `#/profile`, `#/friends`, `#/users/<public_id>`, `#/events`, `#/servers`, `#/nominations?event=...`.
- Backend: Cloudflare Worker (`worker/index.js`) + D1. Профиль пользователя, отображаемое имя, аватар и баннер синхронизируются с сервером после проверки Telegram `initData`.
- Собственный аватар ImageKit имеет приоритет; до его загрузки используется фото Telegram, полученное из подписанного `initData`. Баннеры и собственные аватары хранятся в ImageKit Media Library; приватный ImageKit API key хранится только в секрете Worker. D1 хранит ссылки, file ID и случайный стабильный публичный ID для перехода к профилю.
- Каталог друзей загружается из D1 через авторизованный Worker; текущий пользователь исключается из списка. Публичные ссылки используют случайные идентификаторы, а не Telegram ID.
- Голосование пока работает только в памяти текущего запуска. Каталог номинантов и событий хранится в исходниках; локальный кэш изображений профиля — в IndexedDB, скрытые события — в localStorage.

## Структура

```text
/
├── index.html
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── components/
│   │   ├── AppHeader.vue
│   │   ├── EventsPage.vue
│   │   ├── FriendsPage.vue
│   │   ├── HomePage.vue
│   │   ├── NominationCard.vue
│   │   ├── NominationsPage.vue
│   │   ├── NotificationRegion.vue
│   │   ├── NomineeVisual.vue
│   │   ├── ProfilePage.vue
│   │   ├── ServersPage.vue
│   │   └── UserProfilePage.vue
├── vite.config.js
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
│   ├── friends.css
│   ├── events.css
│   ├── nominations.css
│   ├── nominations-carousel.css
│   ├── nominations-picker.css
│   └── nominations-cards.css
├── js/
│   ├── navigation.js
│   ├── api.js
│   ├── telegram.js
│   ├── storage.js
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
│       ├── profile-presentation.js
├── worker/
│   ├── index.js
│   └── migrations/
│       ├── 0002_profile_media_file_ids.sql
│       └── 0003_public_user_ids.sql
├── package.json
├── scripts/
│   └── check-js.mjs
├── tests/
│   ├── navigation.test.js
│   ├── events.test.js
│   ├── nominations.test.js
│   └── profile-media.test.js
└── docs/
    ├── architecture.md
    ├── design-review.md
    └── events.md
```

## Стандарты оформления

Единый обязательный источник правил интерфейса — [docs/design-system.md](docs/design-system.md). Перед любым изменением внешнего вида сверяйтесь с ним. Реализация общих визуальных токенов и базовых правил находится в `css/design-system.css`; локальные CSS-файлы отвечают только за композицию конкретных компонентов и не должны переопределять общие стандарты. `docs/design-review.md` хранит заметки аудита и проверок, но не заменяет основной стандарт.

## Где что менять

**Номинанты и номинации.** Каталог людей находится в `js/nominations/database/nominees.js`. Правила номинаций и списки допустимых участников — в `js/nominations/database/definitions.js`. Проверка ID и ссылок находится рядом в `validate.js`. Начальное изменяемое состояние создаёт `state.js`, пары DUO, проверку завершённости и сборку локального бюллетеня выполняет `model.js`. Интерфейс, карусель и окна выбора находятся в `src/components/NominationsPage.vue`, повторно используемая карточка — в `NominationCard.vue`, отображение аватаров и изображений — в `NomineeVisual.vue`.

**События.** Страница и карточки — `src/components/EventsPage.vue`; каталог событий — `js/events/data.js`; локальное скрытие и расчёт активных событий — отдельные модули в `js/events/`.

**Страницы.** Главная, сервера и номинации имеют отдельные Vue-компоненты. Каждый раздел управляет своим состоянием и жизненным циклом через Vue.

**Профиль, друзья и API.** Интерфейс собственного профиля — `src/components/ProfilePage.vue`; каталог друзей — `src/components/FriendsPage.vue`; чужой профиль — `src/components/UserProfilePage.vue`; безопасная проверка URL изображений — `js/pages/profile-presentation.js`; локальный кэш изображений — `js/storage.js`. Запросы к API — `js/api.js`; проверка Telegram `initData`, запись метаданных в D1, выдача списка пользователей и серверная загрузка медиа в ImageKit — `worker/index.js`. Секрет `IMAGEKIT_PRIVATE_KEY` хранится только в Cloudflare Worker. Общие уведомления об ошибках и проблемах хранения — `src/components/NotificationRegion.vue`.

**Визуал.** Общие цвета, радиусы, размеры, тени и состояния — `css/design-system.css`. Уведомления имеют отдельный слой `css/notifications.css`. Стили номинаций разделены по назначению: базовая структура, карусель, окно выбора и оформление самих карточек.

Подробная инструкция по добавлению нескольких событий и их обложек находится в [docs/events.md](docs/events.md).

## Добавление номинанта

1. Добавьте запись в `js/nominations/database/nominees.js`: уникальный `id`, имя, `gender` (`F`, `M` или `I`) и ссылку `avatar` (её можно оставить пустой).
2. Добавьте ID в `nomineeIds` нужной номинации в `definitions.js` или в `firstId` / `secondId` пары DUO.
3. Проверка базы автоматически выполняется при загрузке и сообщает о повторяющихся ID или ссылках на неизвестных людей.

Не храните текущий выбор пользователя в файлах базы: выбор создаётся отдельно для каждого экземпляра виджета.

## Правила изменения ресурсов

После правки CSS увеличивайте версию соответствующего файла в `index.html`. После правки JavaScript увеличивайте версию импорта старого модуля, если он ещё подключается напрямую. Это сбрасывает старый кеш Telegram WebView.

Перед публикацией запускаются `npm run check`, `npm test` и `npm run build`. Первая команда проверяет синтаксис JavaScript-модулей, тесты проверяют маршруты, сроки событий и модель голосования, а сборка компилирует Vue-компоненты и формирует статический сайт в `dist/`. GitHub Actions выполняет все три проверки для pull request и публикует `dist/` в GitHub Pages после изменений в `main`.

Подробная карта модулей и границы ответственности описаны в [docs/architecture.md](docs/architecture.md). Визуальные правила и результаты аудита — в [docs/design-review.md](docs/design-review.md).


## Локальная разработка

1. Установите Node.js 22.
2. Выполните `npm install`.
3. Запустите `npm run dev` и откройте адрес, который покажет Vite.
4. Перед публикацией выполните `npm run check`, `npm test` и `npm run build`.

GitHub Pages должен использовать источник **GitHub Actions** в Settings → Pages. Production-сборка публикуется из папки `dist/`. Все страницы, маршруты и уведомления управляются Vue-компонентами; старые DOM-контроллеры страниц и переходные HTML-фрагменты удалены.
