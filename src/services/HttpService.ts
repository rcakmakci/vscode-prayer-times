export class HttpService {
    private readonly defaultHeaders = {
        'User-Agent': 'VSCode-PrayTime-Extension/0.0.1',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    public async fetchWithRetry<T>(
        url: string, 
        retryAttempts: number = 3,
        timeoutMs: number = 10000
    ): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                const response = await fetch(url, {
                    headers: this.defaultHeaders,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                return data as T;

            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                
                if (attempt < retryAttempts) {
                    // Exponential backoff: wait 1s, 2s, 4s between retries
                    const delayMs = Math.pow(2, attempt - 1) * 1000;
                    await this.delay(delayMs);
                    console.warn(`Attempt ${attempt} failed for ${url}, retrying in ${delayMs}ms...`, error);
                }
            }
        }

        throw new Error(`Failed to fetch after ${retryAttempts} attempts: ${lastError?.message}`);
    }

    public async tryMultipleEndpoints<T>(
        endpoints: string[],
        retryPerEndpoint: number = 2
    ): Promise<T> {
        let lastError: Error | null = null;

        for (const endpoint of endpoints) {
            try {
                return await this.fetchWithRetry<T>(endpoint, retryPerEndpoint);
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.warn(`Endpoint ${endpoint} failed:`, error);
            }
        }

        throw new Error(`All endpoints failed. Last error: ${lastError?.message}`);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}