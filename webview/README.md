# File Regex Manager

A VS Code extension that allows you to create, delete, and modify files using @ regex commands through a sidebar interface.

## Features

- **Google Docs-style Interface**: Use @ commands in a clean sidebar interface
- **Create Files**: Create new files with custom content using `@create`
- **Delete Files**: Safely delete files with confirmation using `@delete`
- **Modify Files with Regex**: Use regex patterns to find and replace text using `@modify`
- **List Files**: Search and list files using glob patterns with `@list`
- **Modern UI**: Clean, responsive sidebar interface that adapts to VS Code themes

## Usage

### Opening the Extension

1. Open VS Code
2. Press `F5` to launch the extension in development mode
3. Look for the "File Regex Manager" icon in the left sidebar (activity bar)
4. Click the icon to open the sidebar panel

### @ Commands

The extension uses a Google Docs-style command interface with @ commands:

#### @create - Create Files
```
@create filepath [content]
```

**Examples:**
- `@create hello.txt Hello World`
- `@create src/components/App.tsx import React from 'react'`
- `@create config.json {"name": "my-app"}`

#### @delete - Delete Files
```
@delete filepath
```

**Examples:**
- `@delete oldfile.txt`
- `@delete src/components/OldComponent.tsx`

#### @modify - Modify Files with Regex
```
@modify filepath "regex" "replacement"
```

**Examples:**
- `@modify config.json "old-value" "new-value"`
- `@modify src/App.tsx "import React" "import React, { useState }"`
- `@modify package.json "1.0.0" "1.1.0"`

#### @list - List Files
```
@list [pattern]
```

**Examples:**
- `@list **/*.ts` - All TypeScript files
- `@list **/*.js` - All JavaScript files
- `@list src/**/*` - All files in src directory
- `@list **/*.{ts,js}` - All TypeScript and JavaScript files

#### @help - Show Help
```
@help
```

Shows all available commands and examples.

## How to Use

1. **Open the sidebar**: Click the File Regex Manager icon in the activity bar
2. **Type a command**: Use the command input field at the top
3. **Press Enter**: Execute the command
4. **Click examples**: Click on any example to quickly fill the command input

## Installation

### From Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to compile TypeScript
4. Press `F5` in VS Code to launch the extension in a new Extension Development Host window

### Development

```bash
npm install
npm run build
npm run watch  # For development with auto-compilation
```

## Requirements

- VS Code 1.74.0 or higher
- Node.js 16.x or higher

## Security

This extension has access to file system operations within your workspace. Always review file paths and regex patterns before executing operations.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License 