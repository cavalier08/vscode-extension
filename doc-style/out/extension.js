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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// @ts-ignore
const fs = __importStar(require("fs"));
// @ts-ignore
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
function activate(context) {
    const provider = new DocStyleSidebarProvider(context.extensionUri, context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('docStyleChatView', provider));
    // Listen for file saves and log new content
    vscode.workspace.onDidSaveTextDocument((document) => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0)
            return;
        const workspacePath = workspaceFolders[0].uri.fsPath;
        if (!document.uri.fsPath.startsWith(workspacePath))
            return;
        const filename = path.relative(workspacePath, document.uri.fsPath);
        const content = document.getText();
        const lines = content.split(/\r?\n/);
        const prevLines = provider.getPreviousFileContent(filename);
        let changedLines = [];
        if (prevLines) {
            for (let i = 0; i < Math.max(prevLines.length, lines.length); i++) {
                if (prevLines[i] !== lines[i]) {
                    changedLines.push(`${i + 1}: ${prevLines[i] === undefined ? '' : prevLines[i]} => ${lines[i] === undefined ? '' : lines[i]}`);
                }
            }
        }
        else {
            // If no previous content, treat all lines as new
            for (let i = 0; i < lines.length; i++) {
                changedLines.push(`${i + 1}:  => ${lines[i]}`);
            }
        }
        provider.updateFileContent(filename, lines);
        if (changedLines.length > 0) {
            const summary = `Summary: File saved: ${filename}\nChanged lines:\n${changedLines.join('\n')}`;
            provider.appendToLogAndWebview(summary);
        }
    });
}
exports.activate = activate;
class DocStyleSidebarProvider {
    constructor(extensionUri, context) {
        this._log = [];
        this._fileContents = new Map();
        this._extensionUri = extensionUri;
        this._context = context;
        // Load log from workspaceState
        this._log = this._context.workspaceState.get('docStyleChatLog', []);
    }
    resolveWebviewView(view, context, token) {
        this._view = view;
        view.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'src', 'webview')]
        };
        view.webview.html = this._getHtmlForWebview(view.webview);
        view.webview.onDidReceiveMessage(async (message) => {
            if (message.type === 'command') {
                const result = await this._handleCommand(message.text);
                this._log.push(...result);
                // Save log to workspaceState
                await this._context.workspaceState.update('docStyleChatLog', this._log);
                view.webview.postMessage({ type: 'log', log: this._log });
            }
        });
        // Send initial log
        view.webview.postMessage({ type: 'log', log: this._log });
    }
    async _handleCommand(text) {
        const log = [text];
        const createMatch = text.match(/^@create\s+(\S+)\s+([\s\S]*)$/);
        const editMatch = text.match(/^@edit\s+(\S+)\s+(.+?)\s+([\s\S]*)$/);
        const deleteMatch = text.match(/^@delete\s+(\S+)$/);
        const lineEditMatch = text.match(/^@edit\s+(\S+)\s+line\s+(\d+)\s+([\s\S]*)$/i);
        const clearMatch = text.match(/^@clear$/i);
        // Get workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            log.push('No workspace folder open.');
            return log;
        }
        const workspacePath = workspaceFolders[0].uri.fsPath;
        if (createMatch) {
            const [, filename, content] = createMatch;
            const filePath = path.join(workspacePath, filename);
            try {
                fs.writeFileSync(filePath, content, 'utf8');
                log.push(`created file ${filename}`);
                log.push(`edited line 1 ${filename}`);
                // Send create summary to webview
                const summary = `Summary: Created file ${filename}\nContent:\n${content}`;
                log.push(summary);
                if (this._view) {
                    this._view.webview.postMessage({ type: 'editSummary', summary });
                }
            }
            catch (e) {
                const errorMsg = `error creating file ${filename}: ${e}`;
                log.push(errorMsg);
                console.log(errorMsg);
                if (this._view) {
                    this._view.webview.postMessage({ type: 'editSummary', summary: errorMsg });
                }
            }
        }
        else if (clearMatch) {
            this._log = [];
            await this._context.workspaceState.update('docStyleChatLog', this._log);
            if (this._view) {
                this._view.webview.postMessage({ type: 'log', log: this._log });
            }
            log.push('log cleared');
        }
        else if (lineEditMatch) {
            const [, filename, lineStr, replacement] = lineEditMatch;
            const filePath = path.join(workspacePath, filename);
            const lineNum = parseInt(lineStr, 10);
            try {
                console.log('Editing line', lineNum, 'in', filePath);
                if (!fs.existsSync(filePath)) {
                    log.push(`file not found: ${filename}`);
                    console.log('File not found:', filePath);
                }
                else {
                    const data = fs.readFileSync(filePath, 'utf8');
                    const lines = data.split(/\r?\n/);
                    if (lineNum < 1 || lineNum > lines.length) {
                        log.push(`invalid line number: ${lineNum}`);
                        console.log('Invalid line number:', lineNum, 'File has', lines.length, 'lines');
                    }
                    else {
                        const oldContent = lines[lineNum - 1];
                        console.log('Old line:', oldContent);
                        lines[lineNum - 1] = replacement;
                        fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
                        log.push(`edited line ${lineNum} ${filename}`);
                        console.log('New line:', lines[lineNum - 1]);
                        // Highlight the edited line in the editor
                        const fileUri = vscode.Uri.file(filePath);
                        const doc = await vscode.workspace.openTextDocument(fileUri);
                        const editor = await vscode.window.showTextDocument(doc, { preview: false });
                        // Wait for the editor to be visible before applying the decoration
                        await new Promise(resolve => setTimeout(resolve, 100));
                        // Find the correct editor instance
                        const activeEditor = vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === filePath);
                        if (activeEditor) {
                            const decorationType = vscode.window.createTextEditorDecorationType({
                                backgroundColor: '#c2185b',
                                isWholeLine: true
                            });
                            const lineLength = lines[lineNum - 1] ? lines[lineNum - 1].length : 0;
                            const range = new vscode.Range(lineNum - 1, 0, lineNum - 1, lineLength);
                            activeEditor.setDecorations(decorationType, [range]);
                            setTimeout(() => {
                                decorationType.dispose();
                            }, 2000);
                        }
                        else {
                            console.log('No visible editor found for', filePath);
                        }
                        // Send edit summary to webview
                        const summary = `Summary: Edited line ${lineNum} in ${filename}\nOld: ${oldContent}\nNew: ${replacement}`;
                        log.push(summary);
                        if (this._view) {
                            this._view.webview.postMessage({ type: 'editSummary', summary });
                        }
                    }
                }
            }
            catch (e) {
                log.push(`error editing line ${lineNum} in file ${filename}: ${e}`);
                console.log('Error editing line:', e);
            }
        }
        else if (editMatch) {
            const [, filename, regex, replacement] = editMatch;
            const filePath = path.join(workspacePath, filename);
            try {
                if (!fs.existsSync(filePath)) {
                    log.push(`file not found: ${filename}`);
                }
                else {
                    const data = fs.readFileSync(filePath, 'utf8');
                    const lines = data.split(/\r?\n/);
                    const re = new RegExp(regex, 'g');
                    let editedLines = [];
                    let editDetails = [];
                    const newLines = lines.map((line, idx) => {
                        if (re.test(line)) {
                            editedLines.push(idx + 1);
                            const oldLine = line;
                            const newLine = line.replace(re, replacement);
                            editDetails.push(`Line ${idx + 1}:\n  Old: ${oldLine}\n\n  New: ${newLine}`);
                            return line.replace(re, replacement);
                        }
                        return line;
                    });
                    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
                    if (editedLines.length > 0) {
                        editedLines.forEach((l) => log.push(`edited line ${l} ${filename}`));
                        // Send edit summary to webview
                        const summary = `Summary: Edited lines ${editedLines.join(', ')} in ${filename}\n${editDetails.join('\n')}`;
                        log.push(summary);
                        if (this._view) {
                            this._view.webview.postMessage({ type: 'editSummary', summary });
                        }
                    }
                    else {
                        log.push(`no lines edited in ${filename}`);
                    }
                }
            }
            catch (e) {
                log.push(`error editing file ${filename}: ${e}`);
            }
        }
        else if (deleteMatch) {
            const [, filename] = deleteMatch;
            const filePath = path.join(workspacePath, filename);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    log.push(`deleted file ${filename}`);
                }
                else {
                    log.push(`file not found: ${filename}`);
                }
            }
            catch (e) {
                log.push(`error deleting file ${filename}: ${e}`);
            }
        }
        else {
            log.push('unrecognized command');
        }
        return log;
    }
    _getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'main.js'));
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Doc Style Chat Log</title>
        <style>
          body { font-family: sans-serif; margin: 0; padding: 0; background: #1e1e1e; color: #d4d4d4; }
          #log { height: 80vh; overflow-y: auto; padding: 1em; background: #232323; border-bottom: 1px solid #333; }
          #input { width: 100%; box-sizing: border-box; padding: 1em; background: #1e1e1e; border: none; color: #d4d4d4; font-size: 1em; }
        </style>
      </head>
      <body>
        <div id="log"></div>
        <input id="input" type="text" placeholder="Type @create, @edit, or @delete commands..." autofocus />
        <script src="${scriptUri}"></script>
      </body>
      </html>
    `;
    }
    appendToLogAndWebview(summary) {
        this._log.push(summary);
        this._context.workspaceState.update('docStyleChatLog', this._log);
        if (this._view) {
            this._view.webview.postMessage({ type: 'log', log: this._log });
        }
    }
    updateFileContent(filename, lines) {
        this._fileContents.set(filename, lines);
    }
    getPreviousFileContent(filename) {
        return this._fileContents.get(filename);
    }
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map