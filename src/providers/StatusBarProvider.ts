import * as vscode from "vscode";
import { PrayerTimes } from "../models/PrayerTimes";

interface NextPrayer {
    name: string;
    time: string;
    remainingMs: number;
}

// Türkçe namaz isimleri
const PRAYER_NAMES_TR: Record<string, string> = {
    Fajr: "İmsak",
    Sunrise: "Güneş",
    Dhuhr: "Öğle",
    Asr: "İkindi",
    Maghrib: "Akşam",
    Isha: "Yatsı"
};

export class StatusBarProvider {
    private statusBarItem: vscode.StatusBarItem;
    private updateInterval: NodeJS.Timeout | null = null;
    private currentPrayerTimes: PrayerTimes | null = null;
    private onPrayerApproachingCallback: ((prayerName: string, minutesLeft: number) => void) | null = null;
    private notifiedPrayers: Set<string> = new Set();

    constructor() {
        // Sol tarafta, yüksek öncelikli bir status bar item oluştur
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = "extension.refreshPrayerTimes";
        this.statusBarItem.tooltip = "Tıklayarak namaz vakitlerini yenileyin";
        this.statusBarItem.show();
    }

    public setPrayerTimes(prayerTimes: PrayerTimes) {
        this.currentPrayerTimes = prayerTimes;
        this.notifiedPrayers.clear(); // Yeni günde bildirimleri sıfırla
        this.startCountdown();
    }

    public onPrayerApproaching(callback: (prayerName: string, minutesLeft: number) => void) {
        this.onPrayerApproachingCallback = callback;
    }

    private startCountdown() {
        // Mevcut interval'i temizle
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Hemen bir güncelleme yap
        this.updateStatusBar();

        // Her saniye güncelle
        this.updateInterval = setInterval(() => {
            this.updateStatusBar();
        }, 1000);
    }

    private updateStatusBar() {
        if (!this.currentPrayerTimes || this.currentPrayerTimes.status === "Error") {
            this.statusBarItem.text = "$(clock) Namaz vakitleri yükleniyor...";
            return;
        }

        const nextPrayer = this.getNextPrayer();

        if (!nextPrayer) {
            this.statusBarItem.text = "$(clock) Bugünkü namazlar tamamlandı";
            return;
        }

        const remainingStr = this.formatRemainingTime(nextPrayer.remainingMs);
        const prayerNameTr = PRAYER_NAMES_TR[nextPrayer.name] || nextPrayer.name;

        this.statusBarItem.text = `$(clock) ${prayerNameTr}: ${nextPrayer.time} (${remainingStr})`;

        // Bildirim kontrolü
        const minutesLeft = Math.floor(nextPrayer.remainingMs / 60000);
        this.checkNotifications(nextPrayer.name, minutesLeft);
    }

    private checkNotifications(prayerName: string, minutesLeft: number) {
        if (!this.onPrayerApproachingCallback) {
            return;
        }

        // 30 dakika kala bildirim
        const key30 = `${prayerName}_30`;
        if (minutesLeft <= 30 && minutesLeft > 29 && !this.notifiedPrayers.has(key30)) {
            this.notifiedPrayers.add(key30);
            this.onPrayerApproachingCallback(prayerName, 30);
        }

        // 10 dakika kala bildirim
        const key10 = `${prayerName}_10`;
        if (minutesLeft <= 10 && minutesLeft > 9 && !this.notifiedPrayers.has(key10)) {
            this.notifiedPrayers.add(key10);
            this.onPrayerApproachingCallback(prayerName, 10);
        }
    }

    private getNextPrayer(): NextPrayer | null {
        if (!this.currentPrayerTimes) {
            return null;
        }

        const timings = this.currentPrayerTimes.data.timings;
        const now = new Date();

        // Namaz sırası (Sunrise/Güneş doğuşu hariç - namaz değil)
        const prayerOrder = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

        for (const prayer of prayerOrder) {
            const timeStr = timings[prayer as keyof typeof timings];
            if (!timeStr || timeStr === "--:--") {
                continue;
            }

            // Saat formatını parse et (HH:MM veya HH:MM (TZD))
            const cleanTime = timeStr.split(" ")[0]; // Timezone bilgisini kaldır
            const [hours, minutes] = cleanTime.split(":").map(Number);

            const prayerDate = new Date(now);
            prayerDate.setHours(hours, minutes, 0, 0);

            const remainingMs = prayerDate.getTime() - now.getTime();

            if (remainingMs > 0) {
                return {
                    name: prayer,
                    time: cleanTime,
                    remainingMs
                };
            }
        }

        return null; // Bugün için tüm namazlar geçti
    }

    private formatRemainingTime(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}sa ${minutes}dk`;
        } else if (minutes > 0) {
            return `${minutes}dk ${seconds}sn`;
        } else {
            return `${seconds}sn`;
        }
    }

    public dispose() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.statusBarItem.dispose();
    }
}
