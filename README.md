# HTML to App Community Demos

This repository is a small set of standalone HTML demos built for [HTML to App](https://htmltoapp.app).

HTML to App lets you turn an HTML file or folder into a native macOS app bundle. You can use it to package offline tools, media viewers, internal utilities, dashboards, launchers, and file-driven apps without rewriting them in AppKit or SwiftUI.

## What HTML to App Can Do

- Convert a local HTML file or an entire site folder into a macOS app.
- Bundle assets inside the app so the result works offline.
- Launch apps with a native window, standard menu bar, copy/paste shortcuts, and normal text editing behavior inside web content.
- Customize the generated app name, icon, and visual label treatment.
- Register the generated app as a Finder handler for selected file extensions or folders.
- Open compatible files and folders directly from Finder into the web app.
- Pass opened items into JavaScript through the built-in bridge.
- Expose scoped read and write APIs so editor-role apps can save back to opened files or folders.
- Preselect app permissions such as camera, microphone, or location services from HTML metadata.
- Use drag and drop inside the example apps for local files and folders.
- Support media-style apps such as image viewers, video players, audio players, and folder browsers.
- Support canvas-style tools such as annotation or geometry drawing apps, plus document-style editors.
- Export standalone app bundles that are easy to test, share, and submit.

## Opened Files and Permissions

Generated apps can be configured with **Open With** settings so macOS sends matching files or folders into the app. In the page JavaScript, the launcher provides launch items through:

- `window.HTMLToApp.launchItems`
- `window` event `htmltoapp-open`
- `window.HTMLToApp.runtime`
- `window` event `htmltoapp-runtime`
- `window.HTMLToApp.fs`

For file-backed apps, this makes it possible to build viewers, players, and editors that react to real Finder-opened content instead of only loading bundled assets.

HTML to App can also auto-detect recommended Open With settings and app permissions from your main HTML file. Add this in the document `<head>`:

```html
<meta name="htmltoapp:open-with" content="role=viewer; files=jpg,jpeg,png; folders=true; permissions=camera">
```

Supported keys:
- `role=viewer` or `role=editor`
- `files=ext1,ext2,ext3`
- `folders=true` or `folders=false`
- `permissions=camera,microphone,location`
- `camera=true`, `microphone=true`, or `location=true` as explicit booleans
- `mic`, `audio`, `geolocation`, and `gps` are accepted aliases

When someone browses that HTML source in HTML to App, the app can automatically enable Open With, prefill the role, file extensions, and files/folders options, and preselect requested app permissions in Advanced Settings.

## Scoped File Bridge

`window.HTMLToApp.runtime` reports whether the exported app is configured as a viewer or editor, and whether write-back is available:

- `enabled`
- `role`
- `allowFiles`
- `allowFolders`
- `canWriteBack`

`window.HTMLToApp.fs` accepts either a launch item object, a folder entry object, or an opened-item id string. Read methods work in both viewer and editor mode. Mutating methods only work when Open With is enabled and the role is `editor`.

```html
<script>
  const launchItems = (window.HTMLToApp && window.HTMLToApp.launchItems) || [];
  const runtime = (window.HTMLToApp && window.HTMLToApp.runtime) || {};

  async function openFirstTextFile() {
    const fileItem = launchItems.find((item) => !item.isDirectory);
    if (!fileItem) return;

    const opened = await window.HTMLToApp.fs.readText(fileItem.id);
    editor.value = opened.text;
  }

  async function saveBackToOpenedFile() {
    const fileItem = launchItems.find((item) => !item.isDirectory);
    if (!fileItem || !runtime.canWriteBack) return;

    await window.HTMLToApp.fs.writeText(fileItem.id, editor.value);
  }

  async function createNoteInOpenedFolder() {
    const folderItem = launchItems.find((item) => item.isDirectory);
    if (!folderItem || !runtime.canWriteBack) return;

    await window.HTMLToApp.fs.createDirectory(folderItem.id, "Drafts");
    await window.HTMLToApp.fs.writeText(folderItem.id, "# New note\n", "Drafts/today.md");
  }
</script>
```

Available methods:

- `stat(itemOrId, relativePath?)`
- `list(itemOrId, relativePath?)`
- `readText(itemOrId, relativePath?)`
- `readData(itemOrId, relativePath?)`
- `writeText(itemOrId, text, relativePath?, options?)`
- `writeData(itemOrId, base64Data, relativePath?, options?)`
- `createDirectory(itemOrId, relativePath, options?)`
- `remove(itemOrId, relativePath?, options?)`
- `move(itemOrId, fromRelativePath, toRelativePath, options?)`

Notes:

- A file item can be read or overwritten directly with no relative path.
- A folder item uses relative paths inside that opened folder tree only.
- `writeText` supports `encoding`, `atomic`, and `createIntermediates`.
- `writeData` supports `atomic` and `createIntermediates`.
- `createDirectory` supports `createIntermediates`.
- `remove` supports `recursive` for non-empty folders.
- `move` supports `createIntermediates` and `overwrite`.
- The bridge does not grant arbitrary filesystem access outside the exact opened file or folder scope.

## Examples

Each example below is a single HTML file you can package with HTML to App.

### [Image Viewer](./examples/ImageViewer.html)

Local gallery viewer for images opened from Finder or from a folder.

Recommended Open With setup:
- Role: `Viewer`
- Accept: files and folders
- Extensions: `jpg, jpeg, png, gif, webp, bmp, tif, tiff`
- Permissions: none

### [Geometry Pad](./examples/GeometryPad.html)

Canvas app for drawing rectangles, circles, arrows, lines, and labels. It can also use an opened image as the background.

Recommended Open With setup:
- Role: `Editor`
- Accept: files
- Extensions: `jpg, jpeg, png, webp`
- Permissions: none

### [Text Editor](./examples/TextEditor.html)

Text editor that opens Finder-selected files as text, saves directly back to the opened file, and can create or remove files and folders when launched on a folder.

Recommended Open With setup:
- Role: `Editor`
- Accept: files and folders
- Extensions: `txt, md, html, htm, css, js, json, xml, csv, log`
- Permissions: none

### [Video Player](./examples/VideoPlayer.html)

Local video player with playlist-style navigation for one file or a whole folder.

Recommended Open With setup:
- Role: `Viewer`
- Accept: files and folders
- Extensions: `mp4, mov, m4v`
- Permissions: none

### [Audio Player](./examples/AudioPlayer.html)

Simple local audio player with queue support for tracks or album folders.

Recommended Open With setup:
- Role: `Viewer`
- Accept: files and folders
- Extensions: `mp3, m4a, aac, wav, aif, aiff`
- Permissions: none

### [Camera Viewer](./examples/CameraViewer.html)

Live camera viewer with device switching, mirroring, framing guides, still capture, and offline snapshots.

Recommended Open With setup:
- None needed
- Permissions: `Camera Access`

### [Folder Board](./examples/FolderBoard.html)

Mixed-media folder browser for quickly previewing assets such as images, video, audio, and text files.

Recommended Open With setup:
- Role: `Viewer`
- Accept: folders
- Extensions: none
- Permissions: none

## Typical Uses

- Text editor
- Markdown notes app
- Image viewer
- Photo browser
- Video player
- Audio player
- Camera preview tool
- Asset browser
- Internal dashboard
- Presentation app
- Documentation shell
- Kiosk-style launcher
- Drawing or annotation utility

## Website

Made for [HTML to App](https://htmltoapp.app).
