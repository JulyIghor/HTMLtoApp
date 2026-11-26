# Example gallery

Each download is an editable project for HTML to App 1.1.1. Click **Download**, then double-click the saved `.htmltoapp` file in Finder. Choose **Export with Defaults** to try it, or **Customize** to review its settings first.

## Single-file examples from GitHub

These examples are not in the built-in gallery. Each download is the HTML source itself. To edit one, save a copy as `index.html` in its own folder and choose **Add Project Folder**. There is nothing to unzip.

| Example source | What you can try | Project |
| --- | --- | --- |
| [Aquarium Launchpad](AquariumLaunchpad.html) | Search a school of swimming app icons and click a fish to launch its app. The exported app also draws a swimming fish in the Dock. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/AquariumLaunchpad.htmltoapp) |

For Aquarium Launchpad, enable **List Installed Apps** to see your applications and **Open Installed Apps** to launch one. In a regular browser, you can search and page through sample fish without opening any apps.

## Built-in gallery examples

Choose **Create Project** in the app's Example Gallery to make an editable copy. To edit one of the downloads below, duplicate it, rename the copy to `.zip`, expand it and choose **Add Project Folder** on the folder containing `index.html`.

| Example source | What you can try | Project |
| --- | --- | --- |
| [Audio Player](AudioPlayer.html) | Play local audio files and browse tracks from folders using native file-opening integration. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/AudioPlayer.htmltoapp) |
| [Camera Viewer](CameraViewer.html) | A camera viewer with still capture, mirroring, frame guides, and image export. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/CameraViewer.htmltoapp) |
| [Contact Sheet](ContactSheet.html) | Arrange pictures and filenames on a single PNG sheet. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/ContactSheet.htmltoapp) |
| [CSV Cleaner](CSVCleaner.html) | Preview changes to a CSV and save a clean copy. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/CSVCleaner.htmltoapp) |
| [Cue Cards](CueCards.html) | Rehearse a talk one cue at a time, present on multiple displays, and share an editable, self-contained deck. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/CueCards.htmltoapp) |
| [Desk Clock](DeskClock.html) | A round analog clock that shows the same local time in its window and on its Dock icon. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/DeskClock.htmltoapp) |
| [Edge Shelf](EdgeShelf.html) | Keep your favorite apps in a strip of clickable icons along any display edge. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/EdgeShelf.htmltoapp) |
| [Field Guide](FieldGuide.html) | Explore an illustrated bird guide stored as local JSON. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/FieldGuide.htmltoapp) |
| [Focus Dial](FocusDial.html) | Run a focus timer and see the remaining minutes and seconds on the exported app's Dock icon. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/FocusDial.htmltoapp) |
| [Folder Board](FolderBoard.html) | Explore a folder and preview its images, audio, video, and text files through the local file bridge. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/FolderBoard.htmltoapp) |
| [Geometry Pad](GeometryPad.html) | Draw lines, shapes, arrows, and labels on a blank canvas or an image. Export your composition as a PNG. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/GeometryPad.htmltoapp) |
| [Icon Pairs](IconPairs.html) | Match pairs using sample artwork or installed app icons. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/IconPairs.htmltoapp) |
| [Image Viewer](ImageViewer.html) | Browse images from a file or folder with a focused image viewer and native launch-item support. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/ImageViewer.htmltoapp) |
| [Menu Bar Controls](MenuBarControls.html) | Experiment with a native menu bar item, menus, badges, window titles, and window visibility. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/MenuBarControls.htmltoapp) |
| [Notifications and Badge](NotificationsBadge.html) | Send native notifications and update the Dock badge from JavaScript. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/NotificationsBadge.htmltoapp) |
| [Screen Ruler](ScreenRuler.html) | Measure a layout with two graduated arms. The clear center lets you work with the window underneath. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/ScreenRuler.htmltoapp) |
| [Subtitle Repair](SubtitleRepair.html) | Adjust subtitle timing and save a corrected SRT copy. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/SubtitleRepair.htmltoapp) |
| [Text Editor](TextEditor.html) | A text editor that demonstrates reading, editing, and saving local files through the native file bridge. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/TextEditor.htmltoapp) |
| [Tracing Paper](TracingPaper.html) | Float a reference image over another app for tracing. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/TracingPaper.htmltoapp) |
| [Video Player](VideoPlayer.html) | Play local movies in a dedicated viewer with support for files and folders opened from Finder. | [Download](https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages/VideoPlayer.htmltoapp) |

## How the source is organized

The built-in examples keep their original gallery filenames here. Their ZIP downloads contain an `index.html`, a `ProjectIcon.png` and the resources each example needs. Some import modules, load local JSON or use the shared [GalleryKit](GalleryKit/) styles and file helpers. For those, download the complete package, not just the HTML source or the entire repository ZIP. Single-file examples carry their artwork in the HTML instead.

You can read the [public catalog](Catalog.plist) to see the built-in examples' titles, instructions and resource lists. The [vibe coding guide](https://htmltoapp.app/vibe-coding/) shows how to ask a browser chat for a new project or an updated copy.
