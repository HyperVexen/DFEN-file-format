# DFN Novel Editor

A PowerPoint-style editor for novel writing using the DFN format. It features a slide-based interface where each slide represents a chapter or extract, enabling intuitive organization and visual management of complex narratives with a minimalist black and white theme.

## Features

- **Slide-Based Interface**: Organize your novel like a presentation. Each chapter and extract is a "slide".
- **Hierarchical Structure**: Nest extracts inside chapters for complex narratives.
- **Dual Editing Views**: Switch seamlessly between a WYSIWYG (visual) editor and a raw DFN code editor.
- **Drag & Drop**: Easily reorder chapters and extracts in the navigator.
- **Find & Replace**: Powerful search functionality across your entire novel.
- **AI-Powered Assistance**: Leverage Gemini to suggest compelling titles for your content.
- **Context Menus**: Right-click for quick access to actions like adding, deleting, cutting, copying, and pasting.
- **DFN Format Support**: Import and export your work in the simple `.dfn` text format.
- **Customizable Themes**: Choose from multiple themes to suit your writing environment.
- **Local Autosaving**: Your work is automatically saved to your browser's local storage.
- **Keyboard Shortcuts**: A comprehensive set of shortcuts to speed up your workflow.

## The DFN Format

DEFN/DFN (Dynamic Electronic Fiction Notation) is a simple, lightweight markup language designed for writers. It allows for rich text formatting using straightforward tags, similar to BBCode, while keeping the underlying text clean and portable.

The format uses headers like `---CHAPTER: ...---` to structure the document and inline tags like `[b]...[/b]` for styling.

**For a complete guide and technical specification for developers, please see the [DFN Format Documentation](DFN_FORMAT.md).**

## Project Structure

- `index.html`: The main entry point of the application.
- `index.tsx`: Mounts the React application.
- `App.tsx`: The root React component, managing state and logic.
- `components/`: Contains all React components.
  - `EditorPanel.tsx`: The main text editing area.
  - `SlideNavigator.tsx`: The left-hand panel for navigating chapters/extracts.
  - `Ribbon.tsx`: The top toolbar with formatting and view options.
  - `... and other UI components`
- `constants.ts`: Initial data for the application.
- `types.ts`: TypeScript type definitions for the data structures.
- `metadata.json`: Application metadata.

## Getting Started

No complex setup is required. Simply open the `index.html` file in a modern web browser (like Chrome, Firefox, or Edge) to start using the editor.
