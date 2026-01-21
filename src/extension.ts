import * as vscode from 'vscode';
import { GeoLocationProvider } from './providers/GeoLocationProvider';
import { PrayerTimesProvider } from './providers/PrayerTimesProvider';
import { PrayerViewProvider } from './providers/PrayerViewProvider';
import { StatusBarProvider } from './providers/StatusBarProvider';
import { NotificationService } from './services/NotificationService';

// Singleton instances
let prayerProvider: PrayerTimesProvider;
let geoProvider: GeoLocationProvider;
let prayerViewProvider: PrayerViewProvider;
let statusBarProvider: StatusBarProvider;
let notificationService: NotificationService;

// Track the WebView panel
let prayerViewRegistration: vscode.Disposable | undefined;

// Gece yarısı yenileme için timer
let midnightTimer: NodeJS.Timeout | undefined;

export async function activate(context: vscode.ExtensionContext) {
    console.log('PrayTime extension activating...');

    // Initialize providers
    geoProvider = new GeoLocationProvider(context.globalState);
    prayerProvider = new PrayerTimesProvider(geoProvider, context.globalState);
    prayerViewProvider = new PrayerViewProvider(context);
    statusBarProvider = new StatusBarProvider();
    notificationService = new NotificationService();

    // Status bar'dan gelen bildirim olaylarını dinle
    statusBarProvider.onPrayerApproaching((prayerName, minutesLeft) => {
        notificationService.showPrayerApproachingNotification(prayerName, minutesLeft);
    });

    // Register the WebView provider
    prayerViewRegistration = vscode.window.registerWebviewViewProvider(
        'prayerTimesView',
        prayerViewProvider
    );

    context.subscriptions.push(prayerViewRegistration);

    // Register refresh command
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.refreshPrayerTimes', () => refreshPrayerTimes())
    );

    // StatusBarProvider'ı subscriptions'a ekle
    context.subscriptions.push({
        dispose: () => statusBarProvider.dispose()
    });

    // Wait a bit to ensure WebView is properly initialized before sending data
    setTimeout(async () => {
        await refreshPrayerTimes();
        console.log('PrayTime extension activated successfully');
    }, 1500);

    // Gece yarısı otomatik yenileme ayarla
    scheduleMidnightRefresh();
}

async function refreshPrayerTimes() {
    try {
        console.log('Refreshing prayer times...');
        const prayerTimes = await prayerProvider.getPrayerTimes();
        console.log('Prayer times fetched successfully');

        // Send updated prayer times to WebView
        prayerViewProvider.updatePrayerTimes(prayerTimes);

        // Update status bar
        statusBarProvider.setPrayerTimes(prayerTimes);
    } catch (err) {
        console.error('Namaz vakitleri alınamadı:', err);
        vscode.window.showErrorMessage('Namaz vakitleri alınamadı');
    }
}

function scheduleMidnightRefresh() {
    // Mevcut timer'ı temizle
    if (midnightTimer) {
        clearTimeout(midnightTimer);
    }

    // Gece yarısına kadar kalan süreyi hesapla
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 1, 0, 0); // 00:01'de yenile

    const msUntilMidnight = midnight.getTime() - now.getTime();

    midnightTimer = setTimeout(async () => {
        console.log('Midnight refresh triggered');
        await refreshPrayerTimes();
        // Bir sonraki gece yarısı için tekrar planla
        scheduleMidnightRefresh();
    }, msUntilMidnight);

    console.log(`Next midnight refresh scheduled in ${Math.round(msUntilMidnight / 60000)} minutes`);
}

export function deactivate() {
    console.log('PrayTime extension deactivating...');

    // Clean up resources
    if (prayerViewRegistration) {
        prayerViewRegistration.dispose();
        prayerViewRegistration = undefined;
    }

    if (midnightTimer) {
        clearTimeout(midnightTimer);
        midnightTimer = undefined;
    }

    if (statusBarProvider) {
        statusBarProvider.dispose();
    }
}
