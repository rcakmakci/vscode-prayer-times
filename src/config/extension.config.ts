import { ExtensionConfig } from '../types';

export const EXTENSION_CONFIG: ExtensionConfig = {
    defaultLocation: {
        Country: "Turkey",
        City: "Istanbul"
    },
    apiEndpoints: [
        'https://api.aladhan.com/v1/timingsByCity',
        'https://api.pray.zone/v2/times/today.json'
    ],
    cacheExpirationHours: 24,
    retryAttempts: 3
};

export const GEO_API_ENDPOINTS = [
    'https://ipapi.co/json/',
    'https://ipinfo.io/json',
    'https://ip-api.com/json'
];

export const CACHE_KEYS = {
    LOCATION: 'location',
    PRAYER_TIMES: 'prayerTimesCache'
} as const;

export const COMMANDS = {
    REFRESH_PRAYER_TIMES: 'extension.refreshPrayerTimes'
} as const;

export const VIEW_IDS = {
    PRAYER_TIMES_VIEW: 'prayerTimesView'
} as const;