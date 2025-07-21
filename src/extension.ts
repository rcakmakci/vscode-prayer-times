import * as vscode from 'vscode';
import { GeoLocationProvider } from './providers/GeoLocationProvider';
import { PrayerTimesProvider } from './providers/PrayerTimesProvider';
import { PrayerViewProvider } from './providers/PrayerViewProvider';
import { CacheService } from './services/CacheService';
import { COMMANDS, VIEW_IDS } from './config/extension.config';

// Extension state management
class ExtensionState {
    private static instance: ExtensionState;
    
    public geoProvider!: GeoLocationProvider;
    public prayerProvider!: PrayerTimesProvider;
    public prayerViewProvider!: PrayerViewProvider;
    public cacheService!: CacheService;
    
    private context!: vscode.ExtensionContext;
    private disposables: vscode.Disposable[] = [];

    public static getInstance(): ExtensionState {
        if (!ExtensionState.instance) {
            ExtensionState.instance = new ExtensionState();
        }
        return ExtensionState.instance;
    }

    public initialize(context: vscode.ExtensionContext): void {
        this.context = context;
        this.cacheService = new CacheService(context.globalState);
        this.initializeProviders();
        this.registerCommands();
        this.registerViews();
    }

    private initializeProviders(): void {
        this.geoProvider = new GeoLocationProvider(this.context.globalState);
        this.prayerProvider = new PrayerTimesProvider(this.geoProvider, this.context.globalState);
        this.prayerViewProvider = new PrayerViewProvider(this.context);
    }

    private registerCommands(): void {
        // Register refresh command
        const refreshCommand = vscode.commands.registerCommand(
            COMMANDS.REFRESH_PRAYER_TIMES, 
            () => this.refreshPrayerTimes()
        );

        // Register clear cache command
        const clearCacheCommand = vscode.commands.registerCommand(
            'extension.clearCache',
            () => this.clearCache()
        );

        this.disposables.push(refreshCommand, clearCacheCommand);
        this.context.subscriptions.push(...this.disposables);
    }

    private registerViews(): void {
        // Register the WebView provider
        const prayerViewRegistration = vscode.window.registerWebviewViewProvider(
            VIEW_IDS.PRAYER_TIMES_VIEW,
            this.prayerViewProvider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        );

        this.disposables.push(prayerViewRegistration);
        this.context.subscriptions.push(prayerViewRegistration);
    }

    public async refreshPrayerTimes(): Promise<void> {
        try {
            console.log('Refreshing prayer times...');
            
            // Show status bar message
            const statusBarMessage = vscode.window.setStatusBarMessage(
                '$(sync~spin) Namaz vakitleri güncelleniyor...'
            );

            const prayerTimes = await this.prayerProvider.refreshPrayerTimes();
            console.log('Prayer times refreshed successfully');

            // Send updated prayer times to WebView
            this.prayerViewProvider.updatePrayerTimes(prayerTimes);

            statusBarMessage.dispose();
            
            // Show success message briefly
            vscode.window.setStatusBarMessage(
                '$(check) Namaz vakitleri güncellendi', 
                3000
            );

        } catch (error) {
            console.error('Failed to refresh prayer times:', error);
            vscode.window.showErrorMessage(
                'Namaz vakitleri güncellenemedi. Lütfen internet bağlantınızı kontrol edin.'
            );
        }
    }

    public async clearCache(): Promise<void> {
        try {
            this.cacheService.clear();
            await this.refreshPrayerTimes();
            vscode.window.showInformationMessage('Önbellek temizlendi ve veriler yenilendi.');
        } catch (error) {
            console.error('Failed to clear cache:', error);
            vscode.window.showErrorMessage('Önbellek temizlenirken hata oluştu.');
        }
    }

    public dispose(): void {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }
}

// Main activation function
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('PrayTime extension activating...');

    try {
        // Initialize extension state
        const extensionState = ExtensionState.getInstance();
        extensionState.initialize(context);

        // Initial prayer times load with delay to ensure WebView is ready
        setTimeout(async () => {
            try {
                await extensionState.refreshPrayerTimes();
                console.log('PrayTime extension activated successfully');
            } catch (error) {
                console.error('Failed to load initial prayer times:', error);
                // Don't show error immediately on startup as network might not be ready
            }
        }, 2000);

        // Setup periodic refresh (every 4 hours)
        const refreshInterval = setInterval(async () => {
            try {
                await extensionState.refreshPrayerTimes();
            } catch (error) {
                console.error('Periodic refresh failed:', error);
            }
        }, 4 * 60 * 60 * 1000); // 4 hours

        context.subscriptions.push({
            dispose: () => clearInterval(refreshInterval)
        });

    } catch (error) {
        console.error('Extension activation failed:', error);
        vscode.window.showErrorMessage('PrayTime uzantısı başlatılamadı.');
        throw error;
    }
}

// Deactivation function
export function deactivate(): void {
    console.log('PrayTime extension deactivating...');
    
    try {
        ExtensionState.getInstance().dispose();
        console.log('PrayTime extension deactivated successfully');
    } catch (error) {
        console.error('Error during deactivation:', error);
    }
}
