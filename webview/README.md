# WebView Editor Extension

A VS Code extension that provides in-browser document editing via webview with powerful @ commands for file and folder operations. Now includes a **sidebar webview** for seamless code editing!

## Features

- **Sidebar WebView Editor**: Edit code directly in a dedicated sidebar panel
- **In-browser editing**: Edit documents directly in a webview interface
- **@ Commands**: Use @ + commands to perform file operations
- **File Explorer**: View and navigate workspace files with click-to-open functionality
- **Real-time file operations**: Create, delete, and manage files and folders
- **File Reading**: Actually read and edit existing files (not just UI)
- **Modern UI**: Clean, responsive interface that adapts to VS Code themes
- **Save/Refresh Buttons**: Quick access to common operations

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` in VS Code to launch the extension in a new Extension Development Host window

## Usage

### Sidebar WebView Editor (Recommended)

1. **Open the Sidebar**: Look for the "WebView Editor" icon in the activity bar (left sidebar)
2. **Click the Icon**: This opens the "Code Editor" panel in the sidebar
3. **Start Editing**: 
   - Click on files in the file explorer to open them
   - Use @ commands to create/delete files and folders
   - Edit code directly in the textarea
   - Use Save/Refresh buttons for quick operations

### Traditional WebView Editor

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "Open WebView Editor" and select the command
3. Or right-click in the Explorer and select "Open WebView Editor"

### @ Commands

The extension supports the following @ commands:

#### File Operations
- `@create filename.txt` - Create a new file with the current editor content
- `@create folder/` - Create a new folder (note the trailing slash)
- `@delete filename.txt` - Delete a file
- `@delete folder/` - Delete a folder and all its contents

#### Editor Operations
- `@open filename.txt` - Open a file in the editor (now reads actual content!)
- `@save` - Save the current file content
- `@list` - Refresh the file explorer

### Examples

```bash
# Create a new text file
@create hello.txt

# Create a new folder
@create src/

# Create a file in a subfolder
@create src/main.js

# Delete a file
@delete old-file.txt

# Delete a folder
@delete temp/

# Save current content
@save

# Refresh file list
@list
```

## Interface

### Sidebar WebView Editor

The sidebar editor consists of:

1. **Header**: Shows the title and command help
2. **File Explorer**: Displays workspace files and folders (click to open)
3. **Toolbar**: Save and Refresh buttons for quick access
4. **Command Input**: Enter @ commands here
5. **Editor**: Main text editing area with syntax highlighting
6. **Status Bar**: Shows current status and feedback
7. **Command Examples**: Quick reference for available commands

### Key Features

- **Click-to-Open**: Simply click on any file in the explorer to open it
- **File Selection**: Selected files are highlighted in the explorer
- **Real File Reading**: Actually reads file contents, not just UI updates
- **Compact Design**: Optimized for sidebar space with smaller fonts and spacing
- **Quick Actions**: Save and Refresh buttons for common operations

## Development

### Project Structure

```
├── src/
│   └── extension.ts          # Main extension logic with sidebar support
├── package.json              # Extension manifest with sidebar contributions
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

### Building

```bash
npm install
npm run compile
```

### Development Mode

Press `F5` in VS Code to launch the extension in development mode.

## Requirements

- VS Code 1.74.0 or higher
- Node.js 16.x or higher

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Known Issues

- Large workspace directories may cause performance issues
- Some advanced file operations may need additional error handling

## Future Enhancements

- [ ] Add file search functionality
- [ ] Support for file templates
- [ ] Drag and drop file operations
- [ ] Syntax highlighting in the editor
- [ ] Multiple file tabs support
- [ ] Auto-save functionality
- [ ] File change detection 