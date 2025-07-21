import * as vscode from "vscode";
import { Location, GeoIPResponse } from "../types";
import { CacheService } from "../services/CacheService";
import { HttpService } from "../services/HttpService";
import { EXTENSION_CONFIG, GEO_API_ENDPOINTS, CACHE_KEYS } from "../config/extension.config";

export class GeoLocationProvider {
    private readonly httpService: HttpService;
    private readonly cacheService: CacheService;

    constructor(globalState: vscode.Memento) {
        this.httpService = new HttpService();
        this.cacheService = new CacheService(globalState);
    }

    public setLocation(location: Location): void {
        this.cacheService.set(CACHE_KEYS.LOCATION, location, EXTENSION_CONFIG.cacheExpirationHours);
    }

    public async getLocationFromIP(): Promise<Location> {
        // Try to get from cache first
        const cachedLocation = this.cacheService.get<Location>(CACHE_KEYS.LOCATION);
        if (cachedLocation) {
            return cachedLocation;
        }

        try {
            const location = await this.fetchLocationFromAPIs();
            this.setLocation(location);
            return location;
        } catch (error) {
            console.error('GeoLocationProvider: Failed to get location, using default.', error);
            return EXTENSION_CONFIG.defaultLocation;
        }
    }

    private async fetchLocationFromAPIs(): Promise<Location> {
        const endpoints = GEO_API_ENDPOINTS;
        
        try {
            const response = await this.httpService.tryMultipleEndpoints<GeoIPResponse>(
                endpoints, 
                EXTENSION_CONFIG.retryAttempts
            );

            return this.parseLocationResponse(response);
        } catch (error) {
            throw new Error(`All geolocation APIs failed: ${error}`);
        }
    }

    private parseLocationResponse(data: GeoIPResponse): Location {
        // Handle different API response formats
        let country = '';
        let city = '';

        if (data.country_name) {
            country = data.country_name;
            city = data.city || '';
        } else if (data.country) {
            country = data.country;
            city = data.city || '';
        }

        if (!country || !city) {
            throw new Error('Invalid location data received from API');
        }

        return {
            Country: country,
            City: city,
        };
    }

    public async refreshLocation(): Promise<Location> {
        this.cacheService.delete(CACHE_KEYS.LOCATION);
        return this.getLocationFromIP();
    }
}

