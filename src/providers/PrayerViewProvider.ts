import * as vscode from "vscode";
import { PrayerTimes } from "../models/PrayerTimes";
import { join } from "path";

export class PrayerViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _isViewReady = false;
    private _pendingMessages: any[] = [];

    constructor(
        private readonly context: vscode.ExtensionContext
    ) { }

    async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(join(this.context.extensionPath, 'src', 'webview'))
            ]
        };

        await this.loadWebviewContent();

        // Add a message handler to receive ready signal from webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            console.log('WebView message received:', message);

            if (message.command === 'ready') {
                this._isViewReady = true;
                console.log('WebView is ready, processing pending messages');
                // Process any pending messages
                this._pendingMessages.forEach(pendingMsg => {
                    this.sendMessageToWebView(pendingMsg);
                });
                this._pendingMessages = [];
            } else if (message.command === 'refresh') {
                // Notify extension to refresh prayer times
                vscode.commands.executeCommand('extension.refreshPrayerTimes');
            }
        });
    }

    // Update the webview with new prayer times
    public updatePrayerTimes(prayerTimes: PrayerTimes) {
        console.log('updatePrayerTimes called with data:', prayerTimes.code);

        const message = {
            command: 'updatePrayerTimes',
            prayerTimes: prayerTimes
        };

        if (this._isViewReady) {
            this.sendMessageToWebView(message);
        } else {
            console.log('WebView not ready, queueing message');
            this._pendingMessages.push(message);
        }
    }

    private sendMessageToWebView(message: any) {
        if (this._view) {
            console.log('Sending message to WebView:', message.command);
            this._view.webview.postMessage(message);
        } else {
            console.error('WebView not available');
        }
    }

    private async loadWebviewContent() {
        if (!this._view) {
            return;
        }

        try {
            const htmlPath = join(this.context.extensionPath, 'src', 'webview', 'index.html');
            console.log('Loading HTML from:', htmlPath);

            const htmlContent = await this.getFileContent(htmlPath);

            const scriptUri = this._view.webview.asWebviewUri(
                vscode.Uri.file(join(this.context.extensionPath, 'src', 'webview', 'script.js'))
            );

            const styleUri = this._view.webview.asWebviewUri(
                vscode.Uri.file(join(this.context.extensionPath, 'src', 'webview', 'style.css'))
            );

            console.log('Script URI:', scriptUri.toString());
            console.log('Style URI:', styleUri.toString());

            // Replace resource paths in HTML
            const content = htmlContent
                .replace('{{scriptUri}}', scriptUri.toString())
                .replace('{{styleUri}}', styleUri.toString());

            this._view.webview.html = content;
        } catch (error) {
            console.error('Error loading webview content:', error);
            this._view.webview.html = `<h1>Error loading prayer times view</h1><p>${error}</p>`;
        }
    }

    private async getFileContent(path: string): Promise<string> {
        try {
            const uri = vscode.Uri.file(path);
            const content = await vscode.workspace.fs.readFile(uri);
            return Buffer.from(content).toString('utf-8');
        } catch (error) {
            console.error(`Error reading file ${path}:`, error);

            // Return a minimal HTML page that can load properly
            return `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Prayer Times</title>
                <link href="{{styleUri}}" rel="stylesheet">
            </head>
            <body>
                <div class="container">
                    <h1>Prayer Times</h1>
                    <div id="prayer-times"></div>
                    <button id="refresh-button">Refresh</button>
                </div>
                <script src="{{scriptUri}}"></script>
            </body>
            </html>`;
        }
    }
}
