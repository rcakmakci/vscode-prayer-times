// Acquire the VS Code API
const vscode = acquireVsCodeApi();

// Track if we've received data
let hasReceivedData = false;
let currentPrayerTimes = null;

// Prayer time display names in Turkish
const prayerNames = {
    'Fajr': 'İmsak',
    'Sunrise': 'Güneş',
    'Dhuhr': 'Öğle',
    'Asr': 'İkindi',
    'Sunset': 'Günbatımı',
    'Maghrib': 'Akşam',
    'Isha': 'Yatsı'
};

// Prayer times order for display
const prayerOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Sunset', 'Maghrib', 'Isha'];

// Listen for messages from the extension
window.addEventListener("message", (event) => {
    const message = event.data;
    logDebug("Received message:", message.command);

    switch (message.command) {
        case "updatePrayerTimes":
            hasReceivedData = true;
            if (message.prayerTimes) {
                currentPrayerTimes = message.prayerTimes;
                initializePrayerTimes(message.prayerTimes);
            } else {
                logDebug("Received updatePrayerTimes but no prayer data");
                showError("Namaz vakitleri alınamadı");
            }
            break;
        default:
            logDebug("Unknown command received:", message.command);
    }
});

// Set up event listeners when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const refreshButton = document.getElementById("refresh-button");
    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            showLoading();
            vscode.postMessage({
                command: "refresh",
            });
        });
    } else {
        logDebug("Warning: Refresh button not found in DOM");
    }

    // Signal that the webview is ready
    vscode.postMessage({
        command: "ready",
    });

    // Show loading initially
    showLoading();
});

// Initialize and display prayer times
function initializePrayerTimes(prayerTimes) {
    try {
        logDebug("Initializing prayer times", prayerTimes);
        
        if (!prayerTimes || !prayerTimes.data) {
            showError("Geçersiz namaz vakti verisi");
            return;
        }

        updateLocationAndDate(prayerTimes.data);
        updatePrayerTimesDisplay(prayerTimes.data.timings);
        highlightCurrentPrayer(prayerTimes.data.timings);
        hideLoading();

    } catch (error) {
        logDebug("Error initializing prayer times:", error);
        showError("Namaz vakitleri gösterilirken hata oluştu");
    }
}

// Update location and date information
function updateLocationAndDate(data) {
    const locationElement = document.getElementById("location");
    const dateElement = document.getElementById("date");
    
    if (locationElement) {
        // We'll show a generic location since we don't have specific location data in the response
        locationElement.textContent = "Mevcut Konum";
    }
    
    if (dateElement && data.date) {
        const dateStr = formatDate(data.date.date, data.date.weekday);
        dateElement.textContent = dateStr;
    }
}

// Format date for display
function formatDate(dateStr, weekday) {
    try {
        const date = new Date(dateStr);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        };
        return date.toLocaleDateString('tr-TR', options);
    } catch (error) {
        return `${weekday}, ${dateStr}`;
    }
}

// Update prayer times display
function updatePrayerTimesDisplay(timings) {
    const container = document.getElementById("prayer-times");
    if (!container) {
        logDebug("Prayer times container not found");
        return;
    }

    container.innerHTML = '';

    prayerOrder.forEach(prayerKey => {
        if (timings[prayerKey]) {
            const prayerDiv = createPrayerTimeElement(prayerKey, timings[prayerKey]);
            container.appendChild(prayerDiv);
        }
    });
}

// Create individual prayer time element
function createPrayerTimeElement(prayerKey, time) {
    const prayerDiv = document.createElement('div');
    prayerDiv.className = 'prayer-item';
    prayerDiv.setAttribute('data-prayer', prayerKey);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'prayer-name';
    nameSpan.textContent = prayerNames[prayerKey] || prayerKey;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'prayer-time';
    timeSpan.textContent = formatTime(time);

    prayerDiv.appendChild(nameSpan);
    prayerDiv.appendChild(timeSpan);

    return prayerDiv;
}

// Format time for display
function formatTime(time) {
    if (!time || time === "--:--") {
        return "--:--";
    }
    
    // Remove any timezone or additional info
    const cleanTime = time.split(' ')[0];
    return cleanTime;
}

// Highlight current prayer time
function highlightCurrentPrayer(timings) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    let currentPrayer = null;
    let nextPrayer = null;

    // Convert prayer times to minutes for comparison
    const prayerMinutes = {};
    prayerOrder.forEach(prayer => {
        if (timings[prayer] && timings[prayer] !== "--:--") {
            const [hours, minutes] = timings[prayer].split(':').map(Number);
            prayerMinutes[prayer] = hours * 60 + minutes;
        }
    });

    // Find current prayer period
    for (let i = 0; i < prayerOrder.length; i++) {
        const prayer = prayerOrder[i];
        const nextPrayerIndex = (i + 1) % prayerOrder.length;
        const nextPrayerKey = prayerOrder[nextPrayerIndex];

        if (prayerMinutes[prayer] !== undefined) {
            if (currentTime >= prayerMinutes[prayer]) {
                currentPrayer = prayer;
                nextPrayer = nextPrayerKey;
            }
        }
    }

    // Apply highlighting
    document.querySelectorAll('.prayer-item').forEach(item => {
        item.classList.remove('current', 'next');
        
        const prayerKey = item.getAttribute('data-prayer');
        if (prayerKey === currentPrayer) {
            item.classList.add('current');
        } else if (prayerKey === nextPrayer) {
            item.classList.add('next');
        }
    });
}

// Show loading state
function showLoading() {
    const container = document.getElementById("prayer-times");
    if (container) {
        container.innerHTML = '<div class="loading">Namaz vakitleri yükleniyor...</div>';
    }
}

// Hide loading state
function hideLoading() {
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.remove();
    }
}

// Show error message
function showError(message) {
    const container = document.getElementById("prayer-times");
    if (container) {
        container.innerHTML = `<div class="error">${message}</div>`;
    }
}

// Debug logging function
function logDebug(message, data = null) {
    const debugOutput = document.getElementById("debug-output");
    if (debugOutput) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'debug-entry';
        
        let logText = `[${timestamp}] ${message}`;
        if (data) {
            logText += `: ${JSON.stringify(data, null, 2)}`;
        }
        
        logEntry.textContent = logText;
        debugOutput.appendChild(logEntry);
        
        // Keep only last 10 entries
        while (debugOutput.children.length > 10) {
            debugOutput.removeChild(debugOutput.firstChild);
        }
    }
    
    // Also log to console
    console.log(message, data);
}

// Auto-refresh every hour
setInterval(() => {
    if (hasReceivedData) {
        vscode.postMessage({
            command: "refresh",
        });
    }
}, 60 * 60 * 1000); // 1 hour

// Update current prayer highlighting every minute
setInterval(() => {
    if (currentPrayerTimes && currentPrayerTimes.data && currentPrayerTimes.data.timings) {
        highlightCurrentPrayer(currentPrayerTimes.data.timings);
    }
}, 60 * 1000); // 1 minute
