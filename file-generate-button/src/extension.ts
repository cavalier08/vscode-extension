// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let fileCounter = 0;
let statusBarItem: vscode.StatusBarItem;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('File Generate Button extension is now active');

	// Create status bar item
	statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		100
	);
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
	const template = config.get<string>('template') || 'newfile';
	
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
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to create file: ${error}`);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (statusBarItem) {
		statusBarItem.dispose();
	}
}
