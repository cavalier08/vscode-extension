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
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
let fileCounter = 0;
let statusBarItem;
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    console.log('File Generate Button extension is now active');
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'file-generate-button.createFile';
    statusBarItem.text = "$(new-file) New File";
    statusBarItem.tooltip = "Click to create a new file";
    statusBarItem.show();
    // Register the create file command
    let createFileDisposable = vscode.commands.registerCommand('file-generate-button.createFile', () => {
        createNewFile();
    });
    context.subscriptions.push(createFileDisposable, statusBarItem);
}
async function createNewFile() {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder is open');
        return;
    }
    const config = vscode.workspace.getConfiguration('fileGenerateButton');
    const template = config.get('template') || 'newfile';
    fileCounter++;
    const fileName = `${template}${fileCounter}.txt`;
    const workspaceFolder = vscode.workspace.workspaceFolders[0];
    const filePath = vscode.Uri.joinPath(workspaceFolder.uri, fileName);
    try {
        // Create a new file with some default content
        const content = new TextEncoder().encode(`This is file #${fileCounter}\nCreated at: ${new Date().toISOString()}\n`);
        await vscode.workspace.fs.writeFile(filePath, content);
        // Open the new file in the editor
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage(`Created new file: ${fileName}`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to create file: ${error}`);
    }
}
// This method is called when your extension is deactivated
function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
//# sourceMappingURL=extension.js.map