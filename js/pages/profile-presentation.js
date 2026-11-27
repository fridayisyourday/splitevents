/* Shared validation for profile media returned by the API. */
import { getSafeImageKitUrl, IMAGEKIT_FOLDERS } from "../media.js?v=20261127-3";

export function getSafeProfileImageUrl(value) {
    return getSafeImageKitUrl(value, IMAGEKIT_FOLDERS.profile);
}
