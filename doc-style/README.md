# Doc Style Chat Log VSCode Extension

This extension provides a chat-like log for file operations using `@` commands in a webview panel.

## Usage

- Open the command palette and run `Open Doc Style Chat Log`.
- Type commands like:
  - `@create hello.txt hello world`
  - `@edit hello.txt world universe`
  - `@delete hello.txt`
- The log will show what files and lines were created, edited, or deleted.

## Supported Commands

- `@create <filename> <content>`: Create a file with content.
- `@edit <filename> <regex> <replacement>`: Edit file lines matching regex.
- `@delete <filename>`: Delete a file.

## Development

- Run `npm install`
- Run `npm run watch` to compile
- Press `F5` in VSCode to launch the extension in a new Extension Development Host. 