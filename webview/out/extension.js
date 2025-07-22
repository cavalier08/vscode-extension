"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
function activate(context) {
    console.log('File Regex Manager extension is now active!');
    // Create and register the webview view provider
    const provider = new FileRegexManagerViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('fileRegexManagerView', provider, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    }));
}
exports.activate = activate;
class FileRegexManagerViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'executeCommands':
                    await this.executeCommands(message.commands);
                    break;
                case 'executeSingleCommand':
                    await this.executeSingleCommand(message.text);
                    break;
            }
        });
    }
    async executeCommands(commands) {
        const results = [];
        for (const command of commands) {
            if (command.trim()) {
                try {
                    const result = await this.executeSingleCommand(command.trim());
                    results.push(`✅ ${command} - ${result}`);
                }
                catch (error) {
                    results.push(`❌ ${command} - Error: ${error}`);
                }
            }
        }
        // Show results in output
        if (results.length > 0) {
            vscode.window.showInformationMessage(`Executed ${results.length} commands. Check output for details.`);
            console.log('File Regex Manager Results:\n' + results.join('\n'));
        }
    }
    async executeSingleCommand(commandText) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }
        // Parse the @ command
        const command = this.parseCommand(commandText);
        if (!command) {
            throw new Error('Invalid command format. Use @command [args]');
        }
        switch (command.action) {
            case 'create':
                return await this.createFile(command.args, workspaceFolder);
            case 'delete':
                return await this.deleteFile(command.args, workspaceFolder);
            case 'modify':
                return await this.modifyFile(command.args, workspaceFolder);
            case 'list':
                return await this.listFiles(command.args, workspaceFolder);
            case 'help':
                return this.showHelp();
            default:
                throw new Error(`Unknown command: ${command.action}`);
        }
    }
    parseCommand(text) {
        const match = text.match(/^@(\w+)\s+(.+)$/);
        if (!match) {
            return null;
        }
        return {
            action: match[1],
            args: match[2].trim()
        };
    }
    async createFile(args, workspaceFolder) {
        const [filePath, ...contentParts] = args.split(' ');
        const content = contentParts.join(' ') || '';
        const fullPath = path.join(workspaceFolder.uri.fsPath, filePath);
        const dir = path.dirname(fullPath);
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, content);
        return `File created: ${filePath}`;
    }
    async deleteFile(args, workspaceFolder) {
        const filePath = args.trim();
        const fullPath = path.join(workspaceFolder.uri.fsPath, filePath);
        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const result = await vscode.window.showWarningMessage(`Are you sure you want to delete ${filePath}?`, 'Yes', 'No');
        if (result === 'Yes') {
            fs.unlinkSync(fullPath);
            return `File deleted: ${filePath}`;
        }
        else {
            return `Deletion cancelled: ${filePath}`;
        }
    }
    async modifyFile(args, workspaceFolder) {
        // Parse: filepath "regex" "replacement"
        const match = args.match(/^([^\s]+)\s+"([^"]+)"\s+"([^"]*)"$/);
        if (!match) {
            throw new Error('Usage: @modify filepath "regex" "replacement"');
        }
        const [, filePath, regexPattern, replacement] = match;
        const fullPath = path.join(workspaceFolder.uri.fsPath, filePath);
        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const content = fs.readFileSync(fullPath, 'utf8');
        const regex = new RegExp(regexPattern, 'g');
        const newContent = content.replace(regex, replacement);
        fs.writeFileSync(fullPath, newContent);
        return `File modified: ${filePath}`;
    }
    async listFiles(args, workspaceFolder) {
        const pattern = args.trim() || '**/*';
        const files = await vscode.workspace.findFiles(pattern);
        if (files.length === 0) {
            return 'No files found matching the pattern';
        }
        const fileList = files.map(file => vscode.workspace.asRelativePath(file));
        return `Found ${fileList.length} files: ${fileList.slice(0, 5).join(', ')}${fileList.length > 5 ? '...' : ''}`;
    }
    showHelp() {
        return `Available commands:
@create filepath content - Create a new file
@delete filepath - Delete a file
@modify filepath "regex" "replacement" - Modify file with regex
@list pattern - List files matching pattern
@help - Show help`;
    }
    _getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Regex Manager</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 16px;
            background-color: var(--vscode-sideBar-background);
            color: var(--vscode-sideBar-foreground);
            margin: 0;
        }
        .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .header {
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--vscode-sideBar-border);
        }
        .header h2 {
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--vscode-sideBarTitle-foreground);
        }
        .description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            line-height: 1.4;
        }
        .command-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            margin-bottom: 16px;
        }
        .command-input {
            flex: 1;
            min-height: 200px;
            padding: 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 13px;
            resize: vertical;
            box-sizing: border-box;
        }
        .command-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        .command-input::placeholder {
            color: var(--vscode-input-placeholderForeground);
        }
        .button-group {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            flex: 1;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        button.primary {
            background-color: var(--vscode-button-prominentBackground);
            color: var(--vscode-button-prominentForeground);
        }
        button.primary:hover {
            background-color: var(--vscode-button-prominentHoverBackground);
        }
        .examples {
            margin-top: 16px;
            padding: 12px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }
        .examples h4 {
            margin: 0 0 8px 0;
            font-size: 12px;
            font-weight: 600;
            color: var(--vscode-sideBarTitle-foreground);
        }
        .example {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 4px;
            cursor: pointer;
            padding: 2px 4px;
            border-radius: 2px;
        }
        .example:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .help-text {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            line-height: 1.4;
            margin-top: 8px;
        }
        .status {
            margin-top: 16px;
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
            display: none;
        }
        .status.success {
            background-color: var(--vscode-debugConsole-infoBackground);
            color: var(--vscode-debugConsole-infoForeground);
            border: 1px solid var(--vscode-debugConsole-infoBorder);
        }
        .status.error {
            background-color: var(--vscode-debugConsole-errorBackground);
            color: var(--vscode-debugConsole-errorForeground);
            border: 1px solid var(--vscode-debugConsole-errorBorder);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>File Regex Manager</h2>
            <div class="description">
                Type @ commands to manage files with regex patterns
            </div>
        </div>

        <div class="command-area">
            <textarea 
                id="commandInput" 
                class="command-input"
                placeholder="@create hello.txt Hello World&#10;@create src/components/App.tsx import React from 'react'&#10;@list **/*.ts&#10;@help"
                spellcheck="false"
            ></textarea>
            
            <div class="button-group">
                <button class="primary" onclick="executeCommands()">Execute All Commands</button>
                <button onclick="clearCommands()">Clear</button>
                <button onclick="loadExample()">Load Example</button>
            </div>
        </div>

        <div class="examples">
            <h4>Quick Examples:</h4>
            <div class="example" onclick="loadExample('create')">
                @create hello.txt Hello World
            </div>
            <div class="example" onclick="loadExample('modify')">
                @modify config.json "old-value" "new-value"
            </div>
            <div class="example" onclick="loadExample('list')">
                @list **/*.ts
            </div>
            <div class="example" onclick="loadExample('help')">
                @help
            </div>
        </div>

        <div class="help-text">
            <strong>Commands:</strong><br>
            @create - Create files<br>
            @delete - Delete files<br>
            @modify - Modify with regex<br>
            @list - List files<br>
            @help - Show help
        </div>

        <div id="status" class="status"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const commandInput = document.getElementById('commandInput');
        const status = document.getElementById('status');

        function showStatus(message, type) {
            status.textContent = message;
            status.className = \`status \${type}\`;
            status.style.display = 'block';
            
            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        }

        function executeCommands() {
            const commands = commandInput.value.split('\\n').filter(cmd => cmd.trim());
            
            if (commands.length === 0) {
                showStatus('No commands to execute', 'error');
                return;
            }
            
            vscode.postMessage({
                command: 'executeCommands',
                commands: commands
            });
            
            showStatus(\`Executing \${commands.length} commands...\`, 'success');
        }

        function clearCommands() {
            commandInput.value = '';
            commandInput.focus();
        }

        function loadExample(type = 'full') {
            const examples = {
                create: '@create hello.txt Hello World\\n@create src/components/App.tsx import React from \\'react\\'',
                modify: '@modify config.json "old-value" "new-value"\\n@modify package.json "1.0.0" "1.1.0"',
                list: '@list **/*.ts\\n@list src/**/*',
                help: '@help',
                full: '@create hello.txt Hello World\\n@create src/components/App.tsx import React from \\'react\\'\\n@list **/*.ts\\n@help'
            };
            
            commandInput.value = examples[type] || examples.full;
            commandInput.focus();
        }

        // Focus the input when the view becomes visible
        commandInput.focus();
    </script>
</body>
</html>`;
    }
}
FileRegexManagerViewProvider.viewType = 'fileRegexManagerView';
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map