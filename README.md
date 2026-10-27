# HTML to App Examples

Editable HTML examples and a JavaScript bridge reference for [HTML to App](https://htmltoapp.app), a Mac workspace for creating, editing, previewing, and exporting local HTML projects as standalone `.app` bundles for personal use and local testing.

[Download HTML to App on the Mac App Store](https://apps.apple.com/app/apple-store/id6796812125?pt=127627850&ct=github&mt=8)

HTML to App is available for $9.99 USD. Regional prices and availability may vary. The builder requires macOS 12 or newer. The current exported launcher separately targets macOS 12 or newer and uses the system WebKit engine.

This repository contains editable HTML examples, not the source code of the macOS builder. Start with a text editor, media player, camera tool, drawing app, or menu bar utility, then adapt it to your own project.

## Start with a Project

The main window keeps your projects in a sidebar alongside a source editor and Checks & Output. Open the + menu beside Projects and choose a starting point.

- **New Project** creates a folder containing an editable notes app with `index.html`, `style.css`, `app.js`, and a README.
- **Add Project Folder** opens an existing website folder with `index.html` at its root. It uses the folder in place without copying it. For projects built with other tools, choose the generated website folder containing the HTML and assets.
- **Example Gallery** lets you browse the bundled examples and choose Create Project to save an editable copy in a new folder.

Select a source file to edit HTML, CSS, JavaScript, JSON, Markdown, or other supported UTF-8 text. Save or Command-S writes to the original project folder. Use Command-F to find text and Project's Reload Files command after external changes.

Choose Run to open a preview. Save your edits and run again to see changes. Checks & Output collects JavaScript errors and console messages. Check Project reports missing static HTML and CSS resources, paths outside the project folder, and external URLs. It does not test JavaScript-generated paths or replace testing the app's behavior.

Duplicate Project makes a separate copy for experiments. Remove from List only removes the workspace entry, not your files. Reconnect Folder restores access to an unavailable folder, and Show in Finder opens its location. Project settings are kept for later previews and exports.

If you already have a finished HTML file or folder, use **Convert HTML to App** without adding it to the project workspace.

## Export Your Own Mac Tool

Choose Export App for the selected project, or start a direct conversion. Set the app name, window title, icon, optional Dock label and animation effects, Finder Open With settings, and any required capabilities. On Ready to Export, choose Save HTML App and a destination.

HTML Source and Packaging offers two content modes.

- **Embed the website** copies the HTML, CSS, JavaScript, images, and other assets into the app bundle. A self-contained project works offline. Export again when you want to include source changes.
- **Use the original location** keeps the app connected to your source folder. Save changes in your usual editor, then relaunch the exported app to load the latest files without exporting again. The source folder must remain available. This is not automatic live reload of an already-open page.

The exported app opens in its own window with its own Dock icon, without a local HTTP server for compatible local HTML projects. It runs browser JavaScript using macOS WebKit, not a Node.js or PHP backend. Web features and media codecs depend on the macOS version, so test your project on the system you use.

Remote APIs, scripts, fonts, media, and other online resources still need a network connection. An online page embedded in an `iframe` only works when the destination permits embedding. HTML to App does not bypass `X-Frame-Options` or Content-Security-Policy `frame-ancestors` restrictions.

## What HTML to App Can Do

- Launch apps with a native window, standard menu bar, copy/paste shortcuts, and normal text editing behavior inside web content.
- Give personal tools their own app icon, Dock label, and optional Dock animations.
- Register the generated app as a Finder handler for selected file extensions or folders.
- Open compatible files and folders directly from Finder into the web app.
- Pass opened items into JavaScript through the built-in bridge.
- Expose scoped read and write APIs so editor-role apps can save back to opened files or folders.
- Use native open and save dialogs for files your project works with.
- Preselect camera, microphone, or location capabilities from HTML metadata. The exported app still needs the user's permission to access protected resources.
- Send local native macOS notifications with the standard `Notification` API after permission is granted.
- Control the Dock badge from JavaScript through `window.HTMLtoApp.setBadge()` and `window.HTMLtoApp.clearBadge()` after notification permission is granted.
- Create a JavaScript-controlled menu bar icon, regenerate its menu on every popup, handle menu item clicks, show menu bar badges, and keep the app running in the background after the window closes.
- Use drag and drop inside the example apps for local files and folders.
- Support media-style apps such as image viewers, video players, audio players, and folder browsers.
- Support canvas-style tools such as annotation or geometry drawing apps, plus document-style editors.

Your HTML and JavaScript must implement the tool's interface and call the relevant APIs. Converting an arbitrary page does not automatically turn it into an editor, player, or camera app.

### Preview Limitations

The workspace preview supports layout, navigation, local content, and supported bridge features. Test camera, microphone, location, notifications, Dock badges, Finder Open With registration, and close-to-menu-bar behavior in the exported app. Preview storage and exported app storage are separate. A regular browser does not provide the `window.HTMLtoApp` native bridge.

## What Export Does and Does Not Do

Export copies the bundled, precompiled launcher and configures its name, icon, resources, and settings. It embeds your content or references its original location. It does not compile new native code. The export process includes an ad hoc signing step that requires macOS 12 or newer.

Exported bundles are ad hoc signed for personal use and local testing. They are not Developer ID signed, notarized, submitted to App Review, or ready for public distribution as exported. HTML to App does not replace the Apple Developer Program or Apple's signing, notarization, and review requirements.

HTML to App's Mac App Store availability and approval apply to the builder, not to the apps you export.

### First Launch and Optional Automation

Choose Open App on the export completion screen, or Show in Finder to locate the saved bundle. If macOS requires local launch confirmation, follow the completion screen's manual guidance for your own trusted export. If macOS reports damage or malicious software, stop and investigate instead of approving it.

The completion screen also offers an optional script for local launch handling.

1. Use View Script to review it, then choose Install Script if you want to enable it. Keep the exact Application Scripts destination and the name `HTMLtoAppApproval` shown in the dialog.
2. Installation handles the current export. Once installed and up to date, the script runs automatically after subsequent exports. Use Update Script when offered to resume automation.
3. If approval fails or is cancelled, the exported app remains saved. Use Retry Approval or the manual guidance. To disable automation, open Scripts Folder and remove `HTMLtoAppApproval`.

The script runs outside the App Sandbox and removes quarantine from the specific exported bundle. It does not change the signature, grant privacy permissions, or disable Gatekeeper across your Mac. Local launch approval is not Developer ID signing, notarization, an Apple malware review, or App Store approval.

See the [first-launch guide](https://htmltoapp.app/documentation/#first-launch) for the full workflow and manual options.

## Privacy and File Access

Project creation, editing, and export happen locally. HTML to App does not upload your project files or collect usage analytics. Previews and exported apps can still make network requests when your HTML includes remote resources or APIs.

The builder and exported apps are sandboxed. Besides its own app container, every export includes read-only permission for the Downloads folder by default, even when individual Downloads files have not been selected. This does not grant write access to Downloads, and macOS privacy protections still apply.

Reference-mode apps also have read-only access to the selected source folder. Native open and save dialogs can authorize other locations. Editor-role Open With handling allows scoped write-back to the specific file or folder opened into the app, not arbitrary filesystem access. See the [privacy policy](https://htmltoapp.app/privacy-policy/) for details.

## Opened Files and Permissions

Generated apps can be configured with **Open With** settings so macOS sends matching files or folders into the app. The launcher exposes opened items, runtime settings, and file operations to page JavaScript through the following properties and events.

- `window.HTMLtoApp.launchItems`
- `window` event `htmltoapp-open`
- `window.HTMLtoApp.runtime`
- `window` event `htmltoapp-runtime`
- `window.HTMLtoApp.fs`

For file-backed apps, this makes it possible to build viewers, players, and editors that react to real Finder-opened content instead of only loading bundled assets.

Read `launchItems` for items already delivered and listen for `htmltoapp-open` to handle later items while the app is running. The event's `detail.items` contains the delivered items and `detail.replaceExisting` indicates whether to replace the current list. Listen for `htmltoapp-runtime` when your interface depends on runtime settings that can change.

HTML to App can also auto-detect recommended Open With settings and app permissions from your main HTML file. Add metadata in the document `<head>`.

```html
<meta name="htmltoapp:open-with" content="role=viewer; files=jpg,jpeg,png; folders=true; permissions=camera">
```

Supported keys

- `role=viewer` or `role=editor`
- `files=ext1,ext2,ext3`
- `folders=true` or `folders=false`
- `permissions=camera,microphone,location`
- `camera=true`, `microphone=true`, or `location=true` as explicit booleans
- `mic`, `audio`, `geolocation`, and `gps` are accepted aliases

When someone browses that HTML source in HTML to App, the app can automatically enable Open With, prefill the role, file extensions, and files/folders options, and preselect requested app capabilities in Advanced Settings. Metadata does not grant macOS privacy permission on the user's behalf.

## Scoped File Bridge

`window.HTMLtoApp.runtime` reports whether the exported app is configured as a viewer or editor, and whether write-back is available.

- `enabled`
- `role`
- `allowFiles`
- `allowFolders`
- `canWriteBack`

`window.HTMLtoApp.fs` accepts either a launch item object, a folder entry object, or an opened-item id string. Read methods work in both viewer and editor mode. Mutating methods only work when Open With is enabled and the role is `editor`.

This snippet assumes an existing textarea referenced by `editor`. It reads the current launch items and runtime settings each time a function is called.

```html
<script>
  const appBridge = window.HTMLtoApp;

  function firstItem(isDirectory) {
    return (appBridge?.launchItems || []).find((item) => !!item.isDirectory === isDirectory);
  }

  async function openFirstTextFile() {
    const fileItem = firstItem(false);
    if (!fileItem) return;

    const opened = await window.HTMLtoApp.fs.readText(fileItem.id);
    editor.value = opened.text;
  }

  async function saveBackToOpenedFile() {
    const fileItem = firstItem(false);
    if (!fileItem || !appBridge?.runtime?.canWriteBack) return;

    await window.HTMLtoApp.fs.writeText(fileItem.id, editor.value);
  }

  async function createNoteInOpenedFolder() {
    const folderItem = firstItem(true);
    if (!folderItem || !appBridge?.runtime?.canWriteBack) return;

    await window.HTMLtoApp.fs.createDirectory(folderItem.id, "Drafts");
    await window.HTMLtoApp.fs.writeText(folderItem.id, "# New note\n", "Drafts/today.md");
  }
</script>
```

Available methods

- `stat(itemOrId, relativePath?)`
- `list(itemOrId, relativePath?)`
- `readText(itemOrId, relativePath?, options?)`
- `readData(itemOrId, relativePath?)`
- `writeText(itemOrId, text, relativePath?, options?)`
- `writeData(itemOrId, base64Data, relativePath?, options?)`
- `createDirectory(itemOrId, relativePath, options?)`
- `remove(itemOrId, relativePath?, options?)`
- `move(itemOrId, fromRelativePath, toRelativePath, options?)`

File operation notes

- A file item can be read or overwritten directly with no relative path.
- A folder item uses relative paths inside that opened folder tree only.
- `writeText` supports `encoding`, `atomic`, and `createIntermediates`.
- `writeData` supports `atomic` and `createIntermediates`.
- `createDirectory` supports `createIntermediates`.
- `remove` supports `recursive` for non-empty folders.
- `move` supports `createIntermediates` and `overwrite`.
- The bridge does not grant arbitrary filesystem access outside the exact opened file or folder scope.

## Notifications and Dock Badge

Generated apps can pass notification requests from local HTML to native macOS notifications. This is local notification passthrough from the exported app, not APNs or server-delivered remote push. Use the standard browser-style `Notification` API.

```html
<script>
  async function sendNotification() {
    if (!("Notification" in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    new Notification("HTML to App", {
      body: "This notification was sent from local HTML.",
      tag: "html-to-app-demo"
    });
  }
</script>
```

Generated apps can also control their Dock badge from JavaScript. On macOS, Dock badge visibility is tied to notification authorization for the generated app, so request notification permission before enabling badge controls in your UI.

```html
<script>
  const appBridge = window.HTMLtoApp;

  async function updateDockBadge(value) {
    const permission = "Notification" in window
      ? await Notification.requestPermission()
      : "denied";
    if (permission !== "granted") return;

    if (appBridge && typeof appBridge.setBadge === "function") {
      appBridge.setBadge(value);
    }
  }

  function clearDockBadge() {
    if (appBridge && typeof appBridge.clearBadge === "function") {
      appBridge.clearBadge();
    }
  }

  updateDockBadge("3");
</script>
```

Badge values are strings, so you can use numbers, short labels, or clear the badge when there is no active state to show. If permission is denied, keep both notification and Dock badge controls disabled or show the user where to re-enable notifications in System Settings. The bridge namespace is exactly `window.HTMLtoApp`.

## Menu Bar and Window Controls

Generated apps can create a menu bar icon from JavaScript. The native launcher asks JavaScript for the menu each time the icon is clicked, so the page can rebuild the menu from current state before the popup appears. Menu items support separators, checked state, toggle callbacks, and recursive submenus.

```html
<script>
  const appBridge = window.HTMLtoApp;
  let paused = false;

  appBridge?.menuBar?.setIcon({
    title: "TA",
    tooltip: "Task Agent",
    imagePosition: "left",
    closeToMenuBarOnWindowClose: true
  });

  appBridge?.menuBar?.setBadge("4");

  appBridge?.menuBar?.setMenu(() => [
    { id: "open", title: "Open Window" },
    { type: "separator" },
    { id: "paused", title: "Paused", checked: paused, toggle: true },
    {
      title: "Queues",
      submenu: [
        { id: "inbox", title: "Inbox" },
        { id: "done", title: "Done" }
      ]
    },
    { type: "separator" },
    { id: "quit", title: "Quit" }
  ]);

  appBridge?.menuBar?.onItemClick((event) => {
    if (event.id === "open") appBridge.showWindow();
    if (event.id === "paused") paused = event.checked;
    if (event.id === "quit") appBridge.quit();
  });
</script>
```

The generated app icon is shown by default. If `title` is also set, the status item shows icon and title together. Use `imagePosition: "left"` or `imagePosition: "right"` to choose the side. Set `imageVisible: false` for a text-only menu bar item. Menu bar badges draw on the image icon and are not appended to text-only titles.

Use `window.HTMLtoApp.setWindowTitle(title)` to control the native window title. `window.HTMLtoApp.showWindow()`, `window.HTMLtoApp.hideWindow()`, and `window.HTMLtoApp.quit()` are useful from menu item callbacks. Only expose window hide/show controls when a menu bar item exists, so the user has a visible way to restore the app. Use `window.HTMLtoApp.menuBar.hideIcon()` or `menuBar.configure({ visible: false })` to remove the menu bar item and let the user start the menu bar flow again. When `closeToMenuBarOnWindowClose` is enabled and the menu bar icon is visible, closing the generated app window hides the window and Dock icon while the WebView keeps running. The app shows a one-time native message explaining that it is still running in the menu bar.

## Examples

These examples are drawn from the app's built-in Example Gallery.

Each example below is a single HTML file you can convert directly with HTML to App. Download or clone the repository to work with the actual files, not the GitHub page displaying their source. To use the project workspace instead, create an editable copy from the built-in Example Gallery or put an example in its own folder as `index.html` and add that folder.

Use disposable files when testing editor examples because Save can change the file you opened. Media files are not included. Camera access, notifications, Dock badges, and Finder registration need testing in an exported app.

### [Image Viewer](./examples/ImageViewer.html)

Local gallery viewer for images opened from Finder or from a folder.

Recommended Open With setup

- Use the `Viewer` role and accept files and folders.
- Register `jpg, jpeg, png, gif, webp, bmp, tif, tiff`.
- No camera, microphone, or location capability is required.

### [Geometry Pad](./examples/GeometryPad.html)

Canvas app for drawing rectangles, circles, arrows, lines, and labels. It can also use an opened image as the background.

Recommended Open With setup

- Use the `Editor` role and accept files.
- Register `jpg, jpeg, png, webp`.
- No camera, microphone, or location capability is required.

### [Text Editor](./examples/TextEditor.html)

Text editor that opens Finder-selected files as text, saves directly back to the opened file, and can create or remove files and folders when launched on a folder.

Recommended Open With setup

- Use the `Editor` role and accept files and folders.
- Register `txt, md, html, htm, css, js, json, xml, csv, log`.
- No camera, microphone, or location capability is required.

### [Video Player](./examples/VideoPlayer.html)

Local video player with playlist-style navigation for one file or a whole folder.

Recommended Open With setup

- Use the `Viewer` role and accept files and folders.
- Register `mp4, mov, m4v`.
- No camera, microphone, or location capability is required.

### [Audio Player](./examples/AudioPlayer.html)

Simple local audio player with queue support for tracks or album folders.

Recommended Open With setup

- Use the `Viewer` role and accept files and folders.
- Register `mp3, m4a, aac, wav, aif, aiff`.
- No camera, microphone, or location capability is required.

### [Camera Viewer](./examples/CameraViewer.html)

Live camera viewer with device switching, mirroring, framing guides, still capture, and offline snapshots.

Open With registration is not needed. Keep `Camera Access` enabled when exporting, then allow access when the exported app asks. The workspace preview does not request camera access.

### [Notifications and Badge Demo](./examples/NotificationsBadge.html)

Demonstrates native notification passthrough from local HTML and Dock badge control from JavaScript after notification permission is granted.

Open With registration and camera, microphone, or location capabilities are not needed. Export the app and grant notification permission there before trying notifications or Dock badges.

### [Menu Bar Controls Demo](./examples/MenuBarControls.html)

Demonstrates JavaScript-controlled menu bar icons, image-plus-title placement, per-popup dynamic menu regeneration, status item and menu item callbacks, toggled items, recursive submenus, menu bar badges, hiding/removing the menu bar item, background menu bar behavior, and native window title control.

Open With registration and camera, microphone, or location capabilities are not needed. Preview can demonstrate menu bar controls, but test standalone launch and close-to-menu-bar behavior after export.

### [Folder Board](./examples/FolderBoard.html)

Mixed-media folder browser for quickly previewing assets such as images, video, audio, and text files.

Recommended Open With setup

- Use the `Viewer` role and accept folders.
- No file extensions need to be registered.
- No camera, microphone, or location capability is required.

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

## Links and Support

- [Mac App Store](https://apps.apple.com/app/apple-store/id6796812125?pt=127627850&ct=github&mt=8)
- [Website](https://htmltoapp.app/)
- [Documentation and native bridge](https://htmltoapp.app/documentation/)
- [FAQ](https://htmltoapp.app/faq/)
- [Privacy policy](https://htmltoapp.app/privacy-policy/)
- [Support](https://htmltoapp.app/support/)

## License

The example source code in this repository is available under the [MIT License](./LICENSE). This does not include the HTML to App builder or change the distribution requirements for its exported launcher.
