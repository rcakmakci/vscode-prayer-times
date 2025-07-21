export interface Location {
    Country: string;
    City: string;
}

export interface PrayerTimings {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Sunset: string;
    Maghrib: string;
    Isha: string;
}

export interface DateInfo {
    timestamp: number;
    date: string;
    weekday: string;
}

export interface PrayerTimes {
    code: number;
    status: string;
    data: {
        date: DateInfo;
        timings: PrayerTimings;
    };
}

export interface GeoIPResponse {
    country_name?: string;
    country?: string;
    city?: string;
}

export interface WebViewMessage {
    command: string;
    [key: string]: any;
}

export interface ExtensionConfig {
    defaultLocation: Location;
    apiEndpoints: string[];
    cacheExpirationHours: number;
    retryAttempts: number;
}

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

export enum PrayerTimeNames {
    FAJR = 'Fajr',
    SUNRISE = 'Sunrise', 
    DHUHR = 'Dhuhr',
    ASR = 'Asr',
    SUNSET = 'Sunset',
    MAGHRIB = 'Maghrib',
    ISHA = 'Isha'
}