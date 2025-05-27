import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('file-generator.generateFile', async () => {
        // Get the workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder is open');
            return;
        }

        // Get the filename from the user
        const fileName = await vscode.window.showInputBox({
            prompt: 'Enter the name of the file to generate',
            placeHolder: 'example.txt'
        });

        if (!fileName) {
            return;
        }

        // Create the full file path
        const filePath = path.join(workspaceFolders[0].uri.fsPath, fileName);

        try {
            // Check if file already exists
            if (fs.existsSync(filePath)) {
                const overwrite = await vscode.window.showQuickPick(['Yes', 'No'], {
                    placeHolder: 'File already exists. Do you want to overwrite it?'
                });
                
                if (overwrite !== 'Yes') {
                    return;
                }
            }

            // Get content from user
            const content = await vscode.window.showInputBox({
                prompt: 'Enter the content for the file',
                placeHolder: 'File content here...'
            });

            // Write the file
            fs.writeFileSync(filePath, content || '');
            
            // Open the file in the editor
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);

            vscode.window.showInformationMessage(`File ${fileName} has been created successfully!`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error creating file: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {} 