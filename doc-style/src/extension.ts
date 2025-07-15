// @ts-ignore
import * as fs from 'fs';
// @ts-ignore
import * as path from 'path';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'docStyleChatView',
      new DocStyleSidebarProvider(context.extensionUri, context)
    )
  );
}

class DocStyleSidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _log: string[] = [];
  private _extensionUri: vscode.Uri;
  private _context: vscode.ExtensionContext;

  constructor(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    this._extensionUri = extensionUri;
    this._context = context;
    // Load log from workspaceState
    this._log = this._context.workspaceState.get<string[]>('docStyleChatLog', []);
  }

  public resolveWebviewView(
    view: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this._view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'src', 'webview')]
    };
    view.webview.html = this._getHtmlForWebview(view.webview);
    view.webview.onDidReceiveMessage(async (message: { type: string; text: string }) => {
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

  private async _handleCommand(text: string): Promise<string[]> {
    const log: string[] = [text];
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
      } catch (e) {
        log.push(`error creating file ${filename}: ${e}`);
      }
    } else if (clearMatch) {
      this._log = [];
      await this._context.workspaceState.update('docStyleChatLog', this._log);
      if (this._view) {
        this._view.webview.postMessage({ type: 'log', log: this._log });
      }
      log.push('log cleared');
    } else if (lineEditMatch) {
      const [, filename, lineStr, replacement] = lineEditMatch;
      const filePath = path.join(workspacePath, filename);
      const lineNum = parseInt(lineStr, 10);
      try {
        console.log('Editing line', lineNum, 'in', filePath);
        if (!fs.existsSync(filePath)) {
          log.push(`file not found: ${filename}`);
          console.log('File not found:', filePath);
        } else {
          const data = fs.readFileSync(filePath, 'utf8');
          const lines = data.split(/\r?\n/);
          if (lineNum < 1 || lineNum > lines.length) {
            log.push(`invalid line number: ${lineNum}`);
            console.log('Invalid line number:', lineNum, 'File has', lines.length, 'lines');
          } else {
            console.log('Old line:', lines[lineNum - 1]);
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
                backgroundColor: '#965f89',
                isWholeLine: true
              });
              const lineLength = lines[lineNum - 1] ? lines[lineNum - 1].length : 0;
              const range = new vscode.Range(lineNum - 1, 0, lineNum - 1, lineLength);
              activeEditor.setDecorations(decorationType, [range]);
              setTimeout(() => {
                decorationType.dispose();
              }, 2000);
            } else {
              console.log('No visible editor found for', filePath);
            }
          }
        }
      } catch (e) {
        log.push(`error editing line ${lineNum} in file ${filename}: ${e}`);
        console.log('Error editing line:', e);
      }
    } else if (editMatch) {
      const [, filename, regex, replacement] = editMatch;
      const filePath = path.join(workspacePath, filename);
      try {
        if (!fs.existsSync(filePath)) {
          log.push(`file not found: ${filename}`);
        } else {
          const data = fs.readFileSync(filePath, 'utf8');
          const lines = data.split(/\r?\n/);
          const re = new RegExp(regex, 'g');
          let editedLines: number[] = [];
          const newLines = lines.map((line: string, idx: number) => {
            if (re.test(line)) {
              editedLines.push(idx + 1);
              return line.replace(re, replacement);
            }
            return line;
          });
          fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
          if (editedLines.length > 0) {
            editedLines.forEach((l: number) => log.push(`edited line ${l} ${filename}`));
          } else {
            log.push(`no lines edited in ${filename}`);
          }
        }
      } catch (e) {
        log.push(`error editing file ${filename}: ${e}`);
      }
    } else if (deleteMatch) {
      const [, filename] = deleteMatch;
      const filePath = path.join(workspacePath, filename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          log.push(`deleted file ${filename}`);
        } else {
          log.push(`file not found: ${filename}`);
        }
      } catch (e) {
        log.push(`error deleting file ${filename}: ${e}`);
      }
    } else {
      log.push('unrecognized command');
    }
    return log;
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
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
}

export function deactivate() {} 