import * as vscode from "vscode";
import { PrayerTimes, Location } from "../types";
import { GeoLocationProvider } from "./GeoLocationProvider";
import { CacheService } from "../services/CacheService";
import { HttpService } from "../services/HttpService";
import { EXTENSION_CONFIG, CACHE_KEYS } from "../config/extension.config";

interface AladhanApiResponse {
    code: number;
    status: string;
    data: {
        date: {
            timestamp: string;
            gregorian: {
                date: string;
                weekday: {
                    en: string;
                };
            };
        };
        timings: {
            Fajr: string;
            Sunrise: string;
            Dhuhr: string;
            Asr: string;
            Sunset: string;
            Maghrib: string;
            Isha: string;
        };
    };
}

export class PrayerTimesProvider {
    private readonly httpService: HttpService;
    private readonly cacheService: CacheService;

    constructor(
        private readonly geoLocationProvider: GeoLocationProvider,
        globalState: vscode.Memento
    ) {
        this.httpService = new HttpService();
        this.cacheService = new CacheService(globalState);
    }

    public async getPrayerTimes(): Promise<PrayerTimes> {
        const today = this.getTodayKey();
        
        // Try to get from cache first
        const cachedTimes = this.cacheService.get<PrayerTimes>(`${CACHE_KEYS.PRAYER_TIMES}_${today}`);
        if (cachedTimes) {
            return cachedTimes;
        }

        try {
            const location = await this.geoLocationProvider.getLocationFromIP();
            const prayerTimes = await this.fetchPrayerTimesFromAPI(location);
            
            // Cache the result
            this.cacheService.set(
                `${CACHE_KEYS.PRAYER_TIMES}_${today}`, 
                prayerTimes, 
                EXTENSION_CONFIG.cacheExpirationHours
            );
            
            return prayerTimes;
        } catch (error) {
            console.error('Error fetching prayer times:', error);
            return this.createFallbackPrayerTimes(today);
        }
    }

    private async fetchPrayerTimesFromAPI(location: Location): Promise<PrayerTimes> {
        const url = this.buildApiUrl(location);
        
        try {
            const apiResponse = await this.httpService.fetchWithRetry<AladhanApiResponse>(
                url, 
                EXTENSION_CONFIG.retryAttempts
            );

            if (apiResponse.code !== 200 || !apiResponse.data) {
                throw new Error(`Invalid response from prayer times API: ${apiResponse.status || 'Unknown error'}`);
            }

            return this.mapApiResponseToPrayerTimes(apiResponse);
        } catch (error) {
            throw new Error(`Failed to fetch prayer times from API: ${error}`);
        }
    }

    private buildApiUrl(location: Location): string {
        const baseUrl = 'https://api.aladhan.com/v1/timingsByCity';
        const params = new URLSearchParams({
            city: location.City,
            country: location.Country,
            method: '14' // Turkey Diyanet method
        });
        
        return `${baseUrl}?${params.toString()}`;
    }

    private mapApiResponseToPrayerTimes(apiResponse: AladhanApiResponse): PrayerTimes {
        return {
            code: apiResponse.code,
            status: apiResponse.status,
            data: {
                date: {
                    timestamp: Number(apiResponse.data.date.timestamp),
                    date: apiResponse.data.date.gregorian.date,
                    weekday: apiResponse.data.date.gregorian.weekday.en,
                },
                timings: {
                    Fajr: this.cleanTimeString(apiResponse.data.timings.Fajr),
                    Sunrise: this.cleanTimeString(apiResponse.data.timings.Sunrise),
                    Dhuhr: this.cleanTimeString(apiResponse.data.timings.Dhuhr),
                    Asr: this.cleanTimeString(apiResponse.data.timings.Asr),
                    Sunset: this.cleanTimeString(apiResponse.data.timings.Sunset),
                    Maghrib: this.cleanTimeString(apiResponse.data.timings.Maghrib),
                    Isha: this.cleanTimeString(apiResponse.data.timings.Isha),
                },
            },
        };
    }

    private cleanTimeString(timeString: string): string {
        // Remove timezone info and extra spaces
        return timeString.split(' ')[0]?.trim() ?? timeString;
    }

    private createFallbackPrayerTimes(dateKey: string): PrayerTimes {
        return {
            code: 0,
            status: "Error",
            data: {
                date: {
                    timestamp: Date.now() / 1000,
                    date: dateKey,
                    weekday: new Date().toLocaleDateString('en-US', { weekday: 'long' })
                },
                timings: {
                    Fajr: "--:--",
                    Sunrise: "--:--",
                    Dhuhr: "--:--",
                    Asr: "--:--",
                    Sunset: "--:--",
                    Maghrib: "--:--",
                    Isha: "--:--",
                }
            }
        };
    }

    private getTodayKey(): string {
        return new Date().toISOString().split("T")[0] ?? '';
    }

    public async refreshPrayerTimes(): Promise<PrayerTimes> {
        const today = this.getTodayKey();
        this.cacheService.delete(`${CACHE_KEYS.PRAYER_TIMES}_${today}`);
        return this.getPrayerTimes();
    }

    public clearCache(): void {
        // Clear all prayer times cache entries
        // Since we can't list all keys, we'll clear today's entry
        const today = this.getTodayKey();
        this.cacheService.delete(`${CACHE_KEYS.PRAYER_TIMES}_${today}`);
    }
}
