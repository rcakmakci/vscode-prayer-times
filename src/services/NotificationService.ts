import * as vscode from "vscode";

// Türkçe namaz isimleri
const PRAYER_NAMES_TR: Record<string, string> = {
    Fajr: "İmsak",
    Sunrise: "Güneş",
    Dhuhr: "Öğle",
    Asr: "İkindi",
    Maghrib: "Akşam",
    Isha: "Yatsı"
};

export class NotificationService {
    constructor() {}

    public showPrayerApproachingNotification(prayerName: string, minutesLeft: number) {
        const prayerNameTr = PRAYER_NAMES_TR[prayerName] || prayerName;

        if (minutesLeft === 30) {
            vscode.window.showInformationMessage(
                `🕌 ${prayerNameTr} namazına 30 dakika kaldı!`,
                "Tamam"
            );
        } else if (minutesLeft === 10) {
            vscode.window.showWarningMessage(
                `⏰ ${prayerNameTr} namazına 10 dakika kaldı!`,
                "Tamam"
            );
        }
    }

    public showPrayerTimeNotification(prayerName: string) {
        const prayerNameTr = PRAYER_NAMES_TR[prayerName] || prayerName;

        vscode.window.showInformationMessage(
            `🕌 ${prayerNameTr} vakti girdi!`,
            "Tamam"
        );
    }
}
