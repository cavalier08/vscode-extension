import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    
    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'create-file': {
                    const fileName = data.fileName;
                    const content = data.content;
                    
                    if (!fileName) {
                        vscode.window.showErrorMessage('Please provide a file name');
                        return;
                    }

                    try {
                        const workspaceFolders = vscode.workspace.workspaceFolders;
                        if (!workspaceFolders) {
                            throw new Error('No workspace folder found');
                        }

                        const filePath = path.join(workspaceFolders[0].uri.fsPath, fileName);
                        fs.writeFileSync(filePath, content || '');
                        vscode.window.showInformationMessage(`File ${fileName} created successfully!`);
                    } catch (err) {
                        vscode.window.showErrorMessage(`Error creating file: ${err}`);
                    }
                    break;
                }
                case 'edit-file': {
                    const fileName = data.fileName;
                    const content = data.content;
                    
                    if (!fileName) {
                        vscode.window.showErrorMessage('Please provide a file name');
                        return;
                    }

                    try {
                        const workspaceFolders = vscode.workspace.workspaceFolders;
                        if (!workspaceFolders) {
                            throw new Error('No workspace folder found');
                        }

                        const filePath = path.join(workspaceFolders[0].uri.fsPath, fileName);
                        if (!fs.existsSync(filePath)) {
                            throw new Error('File does not exist');
                        }

                        fs.writeFileSync(filePath, content || '');
                        vscode.window.showInformationMessage(`File ${fileName} updated successfully!`);
                    } catch (err) {
                        vscode.window.showErrorMessage(`Error updating file: ${err}`);
                    }
                    break;
                }
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>File Editor</title>
                <style>
                    body {
                        padding: 10px;
                        color: var(--vscode-foreground);
                        font-family: var(--vscode-font-family);
                    }
                    input, textarea {
                        width: 100%;
                        padding: 5px;
                        margin: 5px 0;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                    }
                    button {
                        margin: 5px 0;
                        padding: 5px 10px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        cursor: pointer;
                    }
                    button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <h3>Create New File</h3>
                <input type="text" id="newFileName" placeholder="Enter file name">
                <textarea id="newFileContent" rows="5" placeholder="Enter file content"></textarea>
                <button onclick="createFile()">Create File</button>

                <h3>Edit Existing File</h3>
                <input type="text" id="editFileName" placeholder="Enter file name">
                <textarea id="editFileContent" rows="5" placeholder="Enter new content"></textarea>
                <button onclick="editFile()">Update File</button>

                <script>
                    const vscode = acquireVsCodeApi();

                    function createFile() {
                        const fileName = document.getElementById('newFileName').value;
                        const content = document.getElementById('newFileContent').value;
                        vscode.postMessage({
                            type: 'create-file',
                            fileName,
                            content
                        });
                    }

                    function editFile() {
                        const fileName = document.getElementById('editFileName').value;
                        const content = document.getElementById('editFileContent').value;
                        vscode.postMessage({
                            type: 'edit-file',
                            fileName,
                            content
                        });
                    }
                </script>
            </body>
            </html>
        `;
    }
} 