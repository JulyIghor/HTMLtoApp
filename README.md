# HTML to App examples

[HTML to App](https://htmltoapp.app/) turns a local web project into a sandboxed Mac app. This repository contains editable examples from the **1.1.1** gallery, not the native builder or launcher source.

[Browse the examples and downloads](examples/README.md) · [Mac App Store](https://apps.apple.com/app/apple-store/id6796812125?pt=127627850&ct=github&mt=8) · [Setapp](https://setapp.com/apps/html-to-app)

## Try Field Guide on your Mac

1. With HTML to App installed, [download Field Guide](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/FieldGuide.htmltoapp) and double-click the file in Finder. This opens the converter. It does not run the project or add it to your library.
2. Choose **Export with Defaults**, or **Customize** to review the name, icon and permissions first. Field Guide needs no optional permissions. Save the app and open it.
3. Search for `blue`. You should see the Great Blue Heron and Belted Kingfisher. The search runs against the included JSON and SVG files, without an HTTP server or an internet connection.

To edit it, choose **+ > Example Gallery** in HTML to App, select **Field Guide** and choose **Create Project**. In its folder, change a field mark in `FieldGuide/birds.json`, save and choose **Run**. To edit a download instead, duplicate the `.htmltoapp` file, change the copy's extension to `.zip`, expand it in Finder and use **Add Project Folder** on the folder containing `index.html`.

## Start with an idea instead of a project

The [vibe coding guide](https://htmltoapp.app/vibe-coding/) shows how to make a Mac tool in an ordinary browser chat, including free Claude without Claude Code. It includes prompts for a first working project and an updated version. You can start on your phone and send the file to your Mac. No Xcode, Terminal or local coding agent is required.

Give the chat the [complete project-authoring guide](https://htmltoapp.app/documentation/agents.md) and ask for an editable `.htmltoapp` file, not an executable. HTML to App packages the web files on your Mac. Anything you send to the chat is shared with that provider, so use sample data there.

## Pick an example by what you want to learn

| If you want to | Start here | Try this |
| --- | --- | --- |
| Work with your own files | [CSV Cleaner](examples/CSVCleaner.html) or [Contact Sheet](examples/ContactSheet.html) | Clean a sample CSV without changing the original, or turn pictures into a labeled PNG. |
| Build a document editor | [Text Editor](examples/TextEditor.html) | Drop a disposable text file and use Save to write back to that specific file. |
| Put a tool in the menu bar | [Menu Bar Controls](examples/MenuBarControls.html) | Export it, choose **Show Dock icon**, then click the icon to see a reopen event in the log. Hide the icon again without hiding the window. |
| Draw in the Dock | [Desk Clock](examples/DeskClock.html) or [Focus Dial](examples/FocusDial.html) | Export with a visible Dock icon to see the clock face or remaining minutes and seconds update there. |
| Work across displays | [Edge Shelf](examples/EdgeShelf.html) or [Screen Ruler](examples/ScreenRuler.html) | Pin a shelf to a display edge or position a shaped ruler without covering the area you want to measure. |
| Use local media or the camera | [Video Player](examples/VideoPlayer.html) or [Camera Viewer](examples/CameraViewer.html) | Open a movie from Finder or capture a still after granting camera access. |

The links in this table show the HTML source. Use the [gallery download index](examples/README.md) for complete projects with their icons, stylesheets, scripts and sample files.

## Bring your own files

- **Convert without a project.** Use **Convert HTML to App** in the main window, or select a file or folder in Finder and choose **Services > Convert HTML to App**. Choose the whole folder if the entry page uses neighboring files.
- **Edit and preview.** Add a folder containing `index.html` to the workspace. **Run** opens it in WebKit. **Check Project** looks for missing static references, and **Checks & Output** shows diagnostics. Relative ES module imports and local JSON fetches work without a development server.
- **Embed or link.** Embed a snapshot to keep web files inside the exported app. Link a source folder to load its current contents after a reload or relaunch. A portable `.htmltoapp` document always exports with embedded files.
- **Share and update.** **Project > Share Project** saves editable source, not the app's saved records. The portable format accepts a single self-contained UTF-8 HTML file or a ZIP with `index.html` and its assets. The downloads here use ZIP so each includes its artwork. Preview and exports keep separate website data. When replacing a recognized export, **Keep Existing Data** preserves its storage. **Create a Fresh Copy** gives a separate app its own storage. **Reset Website Data** requires confirmation.

## Which features work where?

| Capability | What to expect |
| --- | --- |
| Windows and displays | Preview and exports can size and position windows, change their level and decoration, make shaped widgets and react to display changes. Projects can query the system Dock's display and edge, and estimate its size when available. |
| Dock and menu bar | Try menu bar controls in Preview. Set `htmltoapp:dock-visible` to `false` to start without flashing a Dock icon. An export can change its Dock visibility while the window stays open. Hiding its only window does not quit it. Reopen it from Finder or its visible Dock icon. Test live artwork and reopen events in an export. |
| Finder and files | An exported viewer or editor can receive compatible files and folders from Finder or its Dock icon. The bridge uses scoped opened items. Writing back requires Editor access to the item, while saving a new copy can use an ordinary download and save panel. |
| Installed apps | Listing apps and opening them are separate permissions. An allowed project can request icons for its list. Launching an app needs a user action and is subject to the user's confirmation choice. |
| Camera, microphone and location | Mac App Store Preview does not request these. Enable what you need on export and ask on a user action. Setapp Preview can request capabilities it advertises. Neither project metadata nor export settings grant macOS consent. |
| Notifications and badges | The gallery example leaves the builder's notification settings and Dock badge alone in Preview. Try notifications and badges in the exported app under its own identity. |

The [JavaScript bridge reference](https://htmltoapp.app/documentation/bridge/) gives the method signatures, events, permission checks and Preview differences. The [package guide](https://htmltoapp.app/documentation/authoring/) covers metadata, icons and file layout. Returning to an old export? Re-export from the current builder to get its newer launcher.

## What runs on your Mac

The builder and its exported launcher run in Apple's App Sandbox on macOS 12 or later. Export copies a fixed, precompiled launcher. WebKit runs your HTML, CSS and JavaScript as web content. Packaging does not run project build scripts or start a local server. There is no shell bridge or bundled Node.js, Python or PHP backend.

Your project is not uploaded to package it. Project code can still make network requests. Exports have read-only access to Downloads by default, plus access to locations and capabilities authorized for them. [Review the security boundaries](https://htmltoapp.app/security/#permissions).

Exported apps are ad hoc signed for personal use and local testing, not notarized for distribution. If macOS asks about your own trusted export, the Mac App Store edition offers manual approval or an optional bundled open-source script. Setapp uses a bundled service instead. Those approval helpers run outside the sandbox and do not grant privacy permissions. [Read the first-launch guide](https://htmltoapp.app/security/#first-launch).

[Documentation](https://htmltoapp.app/documentation/) · [Release notes](https://htmltoapp.app/changelog/) · [FAQ](https://htmltoapp.app/faq/) · [Support](https://htmltoapp.app/support/)

The examples are available under the [MIT License](LICENSE). This does not license the native builder or its launcher.
