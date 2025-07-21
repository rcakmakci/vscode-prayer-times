import * as vscode from 'vscode';
import { CacheEntry } from '../types';

export class CacheService {
    constructor(private readonly globalState: vscode.Memento) {}

    public set<T>(key: string, data: T, expirationHours: number = 24): void {
        const now = Date.now();
        const cacheEntry: CacheEntry<T> = {
            data,
            timestamp: now,
            expiresAt: now + (expirationHours * 60 * 60 * 1000)
        };
        
        this.globalState.update(key, cacheEntry);
    }

    public get<T>(key: string): T | null {
        const cacheEntry = this.globalState.get<CacheEntry<T>>(key);
        
        if (!cacheEntry) {
            return null;
        }

        // Check if cache has expired
        if (Date.now() > cacheEntry.expiresAt) {
            this.delete(key);
            return null;
        }

        return cacheEntry.data;
    }

    public delete(key: string): void {
        this.globalState.update(key, undefined);
    }

    public clear(): void {
        // Clear all cache entries by iterating through known keys
        // Note: VSCode doesn't provide a way to list all keys, so we'll clear known ones
        const knownKeys = ['location', 'prayerTimesCache'];
        knownKeys.forEach(key => this.delete(key));
    }

    public isExpired(key: string): boolean {
        const cacheEntry = this.globalState.get<CacheEntry<any>>(key);
        return !cacheEntry || Date.now() > cacheEntry.expiresAt;
    }
}