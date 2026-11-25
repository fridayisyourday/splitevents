SplitEvents — modular GitHub Pages build

File structure:

index.html
style.css
app.js
js/telegram.js
js/menu.js
js/profile.js
js/storage.js

No build tool, package manager, paid hosting, or backend is required for this version.
The app uses native JavaScript ES modules, supported by GitHub Pages over HTTPS.

GitHub installation:
1. Create the four files inside the js folder first. In GitHub's Add file > Create new file page,
   enter a path such as js/telegram.js; GitHub will create the folder automatically.
2. Replace app.js and style.css in the repository root.
3. Replace index.html last, after all module files exist.
4. Keep filenames and lowercase js folder exactly as shown.
5. Commit changes and wait for GitHub Pages deployment.
6. Fully close and reopen the Telegram Mini App.

Menu order:
1. Profile / Home (dynamic label and icon)
2. Events (currently routes to the existing home screen)
3. Servers (opens a simple placeholder screen; server functionality is not connected yet)
4. Human Glaze (disabled, marked as coming soon)

Profile names and images remain stored locally on the user's device, as in the previous version.
The app does not yet have a backend or cross-device synchronization.
