# DFN (Dynamic Fiction Notation) Format Specification

## 1. Introduction

DFN (Dynamic Fiction Notation) is a simple, text-based markup language designed for writers and novelists. Its core principles are:

- **Human-Readable:** The raw DFN text is easy to read and write without special tools.
- **Portable:** As a plain text format, `.dfn` files can be opened and edited in any text editor.
- **Lightweight:** The syntax is minimal, focusing on common formatting needs for fiction writing.
- **Structured:** It provides a clear way to organize a manuscript into chapters and sub-sections (extracts).

This document provides a comprehensive specification for developers who wish to implement parsers or editors for the DFN format.

## 2. File Structure

A `.dfn` file is a plain text file, typically UTF-8 encoded. The structure is sequential, consisting of a single novel title followed by a series of chapter blocks. Chapter blocks can, in turn, contain extract blocks.

A typical structure looks like this:

```dfn
[title]The Title of the Novel[/title]

---CHAPTER: Chapter One---
[status]complete[/status]
Content for chapter one goes here...

---CHAPTER: Chapter Two---
[status]draft[/status]
This chapter has extracts. It cannot have content here.

---EXTRACT: Scene One---
[status]draft[/status]
Content for the first scene of chapter two...

---EXTRACT: Scene Two---
[status]needs review[/status]
Content for the second scene...

---CHAPTER: Chapter Three---
[status]draft[/status]
More content...
```

## 3. Structural Tags

These tags define the overall structure of the manuscript.

### `[title]...[/title]`
- **Purpose:** Defines the title of the entire novel.
- **Rules:**
    - Should appear only once per file.
    - Is typically the first non-whitespace content in the file.
- **Example:** `[title]The Crimson Chronicles[/title]`

### `---CHAPTER: {title}---`
- **Purpose:** Marks the beginning of a new chapter.
- **Rules:**
    - Chapters are the top-level content blocks after the novel title.
    - Each chapter block continues until the next `---CHAPTER: ...---` tag or the end of the file.
- **Example:** `---CHAPTER: The Beginning---`

### `---EXTRACT: {title}---`
- **Purpose:** Marks the beginning of a new extract (a sub-section of a chapter).
- **Rules:**
    - Extracts must be located within a chapter block. An extract tag appearing before any chapter tag is invalid.
    - An extract block continues until the next `---EXTRACT: ...---`, `---CHAPTER: ...---`, or the end of the file.
- **Example:** `---EXTRACT: A New Lead---`

### `[status]{status_value}[/status]`
- **Purpose:** Assigns a metadata status to the preceding chapter or extract.
- **Rules:**
    - This tag should appear on the line immediately following a `---CHAPTER---` or `---EXTRACT---` tag.
    - Accepted values are: `draft`, `complete`, `needs review`.
- **Example:**
    ```dfn
    ---CHAPTER: The Confrontation---
    [status]needs review[/status]
    ```

## 4. Inline Formatting Tags

These tags are used within content blocks to style text. They can be nested.

| Tag         | Description              | Syntax Example                                         | Rendered Example                                               |
|-------------|--------------------------|--------------------------------------------------------|----------------------------------------------------------------|
| `[b]`       | Bold                     | `[b]bold text[/b]`                                     | **bold text**                                                  |
| `[i]`       | Italic                   | `[i]italic text[/i]`                                   | *italic text*                                                  |
| `[u]`       | Underline                | `[u]underlined text[/u]`                               | <u>underlined text</u>                                          |
| `[s]`       | Strikethrough            | `[s]strikethrough text[/s]`                             | <s>strikethrough text</s>                                      |
| `[sub]`     | Subscript                | `H[sub]2[/sub]O`                                       | H<sub>2</sub>O                                                 |
| `[sup]`     | Superscript              | `E=mc[sup]2[/sup]`                                     | E=mc<sup>2</sup>                                               |
| `[color]`   | Text Color               | `[color=red]red text[/color]`                          | <span style="color:red;">red text</span>                        |
| `[bg]`      | Background Color         | `[bg=yellow]highlighted[/bg]`                          | <span style="background-color:yellow;">highlighted</span>      |
| `[font]`    | Font Family              | `[font=Courier New]courier[/font]`                      | <span style="font-family:'Courier New';">courier</span>         |
| `[size]`    | Font Size (in pixels)    | `[size=20]bigger text[/size]`                          | <span style="font-size:20px;">bigger text</span>                |

**Notes on Valued Tags (`color`, `bg`, `font`, `size`):**
- **Color Values:** `color` and `bg` tags accept standard CSS color values: named colors (`red`), hex codes (`#ff0000`), and RGB values (`rgb(255, 0, 0)`).
- **Font Values:** `font` accepts a CSS font-family string. For fonts with spaces, quoting is not necessary but may be good practice for some parsers (e.g., `'Times New Roman'`). The reference implementation does not require quotes.
- **Size Values:** `size` accepts a numeric value that should be interpreted as pixels.

## 5. Nesting and Special Rules

### Tag Nesting
Inline formatting tags can be nested to combine effects.
- **Correct:** `[b][i]This is bold and italic.[/i][/b]`
- **Incorrect (Overlapping):** `[b][i]This might not parse correctly.[/b][/i]` (Parsers should be robust, but correct nesting is recommended.)

### Container Chapters
A key structural rule is the concept of a "container chapter."
- If a `---CHAPTER---` block contains one or more `---EXTRACT---` blocks, it is considered a container.
- **A container chapter cannot have its own direct content.** Any text between the chapter's `[status]` tag and the first `---EXTRACT---` tag should be ignored by the parser.

```dfn
---CHAPTER: A Chapter With Extracts---
[status]draft[/status]
// THIS AREA MUST BE EMPTY

---EXTRACT: Scene One---
[status]draft[/status]
This is valid content within an extract.
```

### Whitespace
- Multiple blank lines between structural blocks (e.g., between two chapters) are ignored.
- Whitespace and newlines within a content block are generally preserved to maintain paragraph breaks.

## 6. Full `.dfn` Example

```dfn
[title]The Crimson Chronicles[/title]

---CHAPTER: Chapter 1: The Beginning---
[status]complete[/status]
"Hello," she [b]whispered[/b] in the [color=rgb(250,150,150)]moonlight[/color]. 
The ancient manuscript was written in [font=Cinzel]barely legible in the dim light[/font]. She found the [bg=white][color=black]important passage[/color][/bg] highlighted in the old book. The chemical formula H[sub]2[/sub]O appeared next to E=mc[sup]2[/sup].

---CHAPTER: Chapter 2: The Conspiracy---
[status]draft[/status]
This chapter serves as a container for its extracts.

---EXTRACT: The Discovery---
[status]complete[/status]
The first clue was a small, almost insignificant detail. A misplaced book, a faint scent of ozone. [i]Something was wrong.[/i] The detective spoke in [font=Times New Roman]formal tones[/font].

---EXTRACT: A New Lead---
[status]draft[/status]
The street kid replied with [font=Comic Sans MS]casual slang[/font], giving a description that opened up a new path in the investigation.

---CHAPTER: Chapter 3: The Confrontation---
[status]needs review[/status]
She read the [u][b]warning label[/b][/u] carefully: "[color=red]DANGER: Contains [font=Courier New][size=14]toxic substances[/size][/font][/color]."

This changed everything. The conspiracy was deeper than she could have ever imagined.
```

## 7. Implementation Notes for Developers

- **Parsing:** A parser can be implemented using regular expressions to identify and process tags sequentially, or by building a more complex state machine.
- **DFN to Data Structure:** A robust approach is to parse the `.dfn` file into a structured object model (e.g., a `Novel` object with an array of `Slide` objects) before rendering.
- **Reference Implementation:** The DFN Novel Editor project provides a reference implementation in TypeScript/React. Key files to inspect are:
    - `App.tsx`: Contains the `dfnToNovel` and `novelToDfn` functions for conversion between the format and the application's state.
    - `components/WysiwygEditor.tsx`: Contains `htmlToDfn` and `dfnToHtml` for live conversion in the visual editor.
