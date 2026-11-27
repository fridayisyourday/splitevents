/* Shared validation for profile media returned by the API. */
import { getSafeImageKitUrl } from "../media.js?v=20261127-2";

export function getSafeProfileImageUrl(value) {
    return getSafeImageKitUrl(value, "profile");
}
