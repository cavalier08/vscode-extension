import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
    const sidebarProvider = new SidebarProvider(context.extensionUri);
    
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            "file-editor-sidebar.sidebarView",
            sidebarProvider
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('file-editor-sidebar.showSidebar', () => {
            vscode.commands.executeCommand('workbench.view.extension.file-editor-sidebar-view');
        })
    );
}

export function deactivate() {} 