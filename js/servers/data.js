import {
    getServerBannerUrl,
    getServerGalleryImageUrl
} from "../media.js?v=20261127-3";

export const SERVERS = [
    {
        id: "technocracy",
        name: "TECHNOCRACY",
        description: "сервер Minecraft",
        banner: getServerBannerUrl("technocracy"),
        gallery: [
            getServerGalleryImageUrl("technocracy", "gallery-01.webp"),
            getServerGalleryImageUrl("technocracy", "gallery-02.webp"),
            getServerGalleryImageUrl("technocracy", "gallery-03.webp")
        ],
        address: "26.135.106.225:4444",
        loader: "neoforge",
        version: "21.1",
        modpackUrl: "https://drive.google.com/drive/folders/1YmdjPFOAKPpo0AKIUSurRo5AMLkzZPdX?hl=ru&sort=13&direction=a"
    }
];
