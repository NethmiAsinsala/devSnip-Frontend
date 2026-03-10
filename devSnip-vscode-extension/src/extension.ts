import * as vscode from 'vscode';
import * as http from 'http';

export function activate(context: vscode.ExtensionContext) {
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
        const apiUrl = config.get<string>('apiUrl') || 'http://localhost:8080/api';

        // 1. Prompt for Title
        const title = await vscode.window.showInputBox({
            prompt: "Enter a title for this snippet",
            placeHolder: "e.g., Express JS Setup"
        });

        if (!title) return; // User cancelled

        // 2. Fetch Folders
        let folders: any[] = [];
        try {
            folders = await fetchFolders(apiUrl);
        } catch (err: any) {
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

        if (!selectedFolder) return;

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
        } catch (err: any) {
            vscode.window.showErrorMessage(`Failed to save snippet: ${err.message}`);
        }

    });

    context.subscriptions.push(disposable);
}

// Simple HTTP wrappers to avoid external node-fetch dependencies in a lightweight extension
function fetchFolders(baseUrl: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        http.get(`${baseUrl}/folder/get-all`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) reject(new Error(`Status ${res.statusCode}`));
                try {
                    resolve(JSON.parse(data));
                } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

function saveSnippet(baseUrl: string, data: any): Promise<void> {
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
                } else {
                    reject(new Error(`Status ${res.statusCode}: ${responseData}`));
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

export function deactivate() { }
