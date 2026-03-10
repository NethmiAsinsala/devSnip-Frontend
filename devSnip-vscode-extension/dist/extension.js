"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const http = __importStar(require("http"));
function activate(context) {
    console.log('devSnip companion is now active!');
    let disposable = vscode.commands.registerCommand('devsnip.sendToVault', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active text editor found.");
            return;
        }
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        if (!text.trim()) {
            vscode.window.showErrorMessage("Highlight some code first before sending to Snippet Vault!");
            return;
        }
        const language = editor.document.languageId;
        const config = vscode.workspace.getConfiguration('devSnip');
        const apiUrl = config.get('apiUrl') || 'http://localhost:8080/api';
        // 1. Prompt for Title
        const title = await vscode.window.showInputBox({
            prompt: "Enter a title for this snippet",
            placeHolder: "e.g., Express JS Setup"
        });
        if (!title)
            return; // User cancelled
        // 2. Fetch Folders
        let folders = [];
        try {
            folders = await fetchFolders(apiUrl);
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to connect to devSnip API at ${apiUrl}. Is it running?`);
            return;
        }
        if (folders.length === 0) {
            vscode.window.showErrorMessage("You don't have any folders in Snippet Vault yet! Create one first.");
            return;
        }
        // 3. Prompt for Folder Selection
        const folderItems = folders.map(f => ({
            label: `📁 ${f.name}`,
            description: `ID: ${f.folderId}`,
            folderId: f.folderId
        }));
        const selectedFolder = await vscode.window.showQuickPick(folderItems, {
            placeHolder: 'Select a destination folder'
        });
        if (!selectedFolder)
            return;
        // 4. Optionally prompt for a description (or skip to save clicks)
        const description = await vscode.window.showInputBox({
            prompt: "Enter a brief description (optional)",
            placeHolder: "Description..."
        });
        // 5. Send to API
        const snippetData = {
            title: title,
            description: description || "",
            language: language,
            code_content: text,
            tagName: language, // default tag to language
            folderId: selectedFolder.folderId
        };
        try {
            await saveSnippet(apiUrl, snippetData);
            vscode.window.showInformationMessage(`Successfully sent "${title}" to your Snippet Vault!`);
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to save snippet: ${err.message}`);
        }
    });
    context.subscriptions.push(disposable);
}
// Simple HTTP wrappers to avoid external node-fetch dependencies in a lightweight extension
function fetchFolders(baseUrl) {
    return new Promise((resolve, reject) => {
        http.get(`${baseUrl}/folder/get-all`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200)
                    reject(new Error(`Status ${res.statusCode}`));
                try {
                    resolve(JSON.parse(data));
                }
                catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}
function saveSnippet(baseUrl, data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };
        const req = http.request(`${baseUrl}/snippets/add`, options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    resolve();
                }
                else {
                    reject(new Error(`Status ${res.statusCode}: ${responseData}`));
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}
function deactivate() { }
//# sourceMappingURL=extension.js.map