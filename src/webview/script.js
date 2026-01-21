// Acquire the VS Code API
const vscode = acquireVsCodeApi();

// Track if we've received data
let hasReceivedData = false;

// Türkçe namaz isimleri
const PRAYER_NAMES_TR = {
	Fajr: "İmsak",
	Sunrise: "Güneş",
	Dhuhr: "Öğle",
	Asr: "İkindi",
	Sunset: "Gün Batımı",
	Maghrib: "Akşam",
	Isha: "Yatsı"
};

// Türkçe gün isimleri
const WEEKDAY_NAMES_TR = {
	Monday: "Pazartesi",
	Tuesday: "Salı",
	Wednesday: "Çarşamba",
	Thursday: "Perşembe",
	Friday: "Cuma",
	Saturday: "Cumartesi",
	Sunday: "Pazar"
};

// Debug log fonksiyonu
function logDebug(...args) {
	const debugOutput = document.getElementById("debug-output");
	if (debugOutput) {
		const message = args
			.map((arg) =>
				typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
			)
			.join(" ");
		const entry = document.createElement("div");
		entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
		debugOutput.appendChild(entry);
		debugOutput.scrollTop = debugOutput.scrollHeight;
	}
	console.log(...args);
}

// Namaz vakitlerini başlat ve göster
function initializePrayerTimes(prayerTimes) {
	logDebug("Initializing prayer times:", prayerTimes.status);

	const container = document.getElementById("prayer-times");
	const locationEl = document.getElementById("location");
	const dateEl = document.getElementById("date");

	if (!container) {
		logDebug("Error: prayer-times container not found");
		return;
	}

	// Hata durumu kontrolü
	if (prayerTimes.status === "Error" || prayerTimes.code !== 200) {
		container.innerHTML = `
			<div class="error-message">
				<p>Namaz vakitleri alınamadı</p>
				<p class="error-help">Lütfen internet bağlantınızı kontrol edin ve yenileyin.</p>
			</div>
		`;
		return;
	}

	// Lokasyon ve tarih bilgisi
	if (locationEl) {
		locationEl.textContent = "Konum algılandı";
	}

	if (dateEl && prayerTimes.data.date) {
		const weekdayTr = WEEKDAY_NAMES_TR[prayerTimes.data.date.weekday] || prayerTimes.data.date.weekday;
		dateEl.textContent = `${prayerTimes.data.date.date} - ${weekdayTr}`;
	}

	// Sonraki namazı bul
	const nextPrayerName = getNextPrayerName(prayerTimes.data.timings);

	// Namaz vakitlerini göster (Sunrise ve Sunset hariç)
	const timings = prayerTimes.data.timings;
	const prayerOrder = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

	container.innerHTML = "";

	prayerOrder.forEach((prayer) => {
		const time = timings[prayer];
		if (!time) {
			return;
		}

		// Saat formatını temizle (timezone bilgisini kaldır)
		const cleanTime = time.split(" ")[0];
		const prayerNameTr = PRAYER_NAMES_TR[prayer] || prayer;
		const isNextPrayer = prayer === nextPrayerName;

		const prayerDiv = document.createElement("div");
		prayerDiv.className = `prayer-time${isNextPrayer ? " next-prayer" : ""}`;
		prayerDiv.innerHTML = `
			<span class="prayer-name">${isNextPrayer ? "▶ " : ""}${prayerNameTr}</span>
			<span class="prayer-time-value">${cleanTime}</span>
		`;
		container.appendChild(prayerDiv);
	});

	logDebug("Prayer times rendered successfully");
}

// Sonraki namazı bul
function getNextPrayerName(timings) {
	const now = new Date();
	const prayerOrder = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

	for (const prayer of prayerOrder) {
		const timeStr = timings[prayer];
		if (!timeStr || timeStr === "--:--") {
			continue;
		}

		const cleanTime = timeStr.split(" ")[0];
		const [hours, minutes] = cleanTime.split(":").map(Number);

		const prayerDate = new Date(now);
		prayerDate.setHours(hours, minutes, 0, 0);

		if (prayerDate > now) {
			return prayer;
		}
	}

	return null; // Tüm namazlar geçmiş
}

// Listen for messages from the extension
window.addEventListener("message", (event) => {
	const message = event.data;
	logDebug("Received message:", message.command);

	switch (message.command) {
		case "updatePrayerTimes":
			hasReceivedData = true;
			if (message.prayerTimes) {
				initializePrayerTimes(message.prayerTimes);
			} else {
				logDebug("Received updatePrayerTimes but no prayer data");
			}
			break;
		default:
			logDebug("Unknown command received:", message.command);
	}
});

// Set up event listeners when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
	logDebug("DOM loaded, setting up event listeners");

	const refreshButton = document.getElementById("refresh-button");
	if (refreshButton) {
		refreshButton.addEventListener("click", () => {
			logDebug("Refresh button clicked");
			vscode.postMessage({
				command: "refresh",
			});
		});
	} else {
		logDebug("Warning: Refresh button not found in DOM");
	}

	// Signal extension that we're ready
	vscode.postMessage({
		command: "ready",
	});
	logDebug("Ready signal sent to extension");
});
