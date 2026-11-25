/* Local nickname and IndexedDB image storage. */

const databaseName = "splitevents-profile";
const storeName = "images";
let databasePromise = null;

export function readNickname(userId) {
    const key = `splitevents.nickname.v2.${userId}`;
    const legacyKey = "splitevents.nickname.v1";

    try {
        const current = window.localStorage.getItem(key);
        if (current !== null) return current.trim();

        // Migrate the nickname used by the previous app version.
        const legacy = window.localStorage.getItem(legacyKey);
        if (legacy !== null && legacy.trim()) {
            window.localStorage.setItem(key, legacy.trim());
            window.localStorage.removeItem(legacyKey);
            return legacy.trim();
        }
    } catch (error) {
        console.warn("SplitEvents: nickname storage unavailable", error);
    }

    return "";
}

export function writeNickname(userId, value) {
    const key = `splitevents.nickname.v2.${userId}`;

    try {
        if (value) window.localStorage.setItem(key, value);
        else window.localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.warn("SplitEvents: could not save nickname", error);
        return false;
    }
}

function openDatabase() {
    if (!window.indexedDB) {
        return Promise.reject(new Error("IndexedDB is unavailable"));
    }

    if (databasePromise) return databasePromise;

    databasePromise = new Promise((resolve, reject) => {
        let request;

        try {
            request = window.indexedDB.open(databaseName, 1);
        } catch (error) {
            reject(error);
            return;
        }

        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(storeName)) {
                database.createObjectStore(storeName);
            }
        };

        request.onsuccess = () => {
            const database = request.result;
            database.onversionchange = () => {
                database.close();
                databasePromise = null;
            };
            resolve(database);
        };

        request.onerror = () => {
            reject(request.error || new Error("Database open failed"));
        };

        request.onblocked = () => {
            reject(new Error("Database open was blocked"));
        };
    }).catch((error) => {
        databasePromise = null;
        throw error;
    });

    return databasePromise;
}

export function readImage(key) {
    return openDatabase().then((database) => new Promise((resolve, reject) => {
        let transaction;

        try {
            transaction = database.transaction(storeName, "readonly");
        } catch (error) {
            reject(error);
            return;
        }

        const request = transaction.objectStore(storeName).get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => {
            reject(request.error || new Error("Image read failed"));
        };
    }));
}

export function writeImage(key, blob) {
    return openDatabase().then((database) => new Promise((resolve, reject) => {
        let transaction;

        try {
            transaction = database.transaction(storeName, "readwrite");
        } catch (error) {
            reject(error);
            return;
        }

        transaction.objectStore(storeName).put(blob, key);
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => {
            reject(transaction.error || new Error("Image save failed"));
        };
        transaction.onabort = () => {
            reject(transaction.error || new Error("Image save aborted"));
        };
    }));
}

export function optimizeImage(file, maxDimension) {
    return new Promise((resolve, reject) => {
        let sourceUrl;

        try {
            sourceUrl = URL.createObjectURL(file);
        } catch (error) {
            reject(error);
            return;
        }

        const image = new Image();

        image.onload = () => {
            try {
                const width = image.naturalWidth;
                const height = image.naturalHeight;

                if (!width || !height) {
                    throw new Error("Invalid image dimensions");
                }

                const scale = Math.min(
                    1,
                    maxDimension / Math.max(width, height)
                );

                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(width * scale));
                canvas.height = Math.max(1, Math.round(height * scale));

                const context = canvas.getContext("2d");
                if (!context || typeof canvas.toBlob !== "function") {
                    throw new Error("Canvas export is not supported");
                }

                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Image conversion failed"));
                }, "image/jpeg", 0.86);
            } catch (error) {
                reject(error);
            } finally {
                URL.revokeObjectURL(sourceUrl);
            }
        };

        image.onerror = () => {
            URL.revokeObjectURL(sourceUrl);
            reject(new Error("Unsupported image format"));
        };

        image.src = sourceUrl;
    });
}
