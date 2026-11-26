"""Build or verify the public gallery. Requires only the Python standard library."""

import argparse
from io import BytesIO
from pathlib import Path
import plistlib
import re
import sys
from zipfile import ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "examples"
DOWNLOADS = ROOT / "packages"
RAW = "https://raw.githubusercontent.com/JulyIghor/HTMLtoApp/main/packages"

# A release can contain internal examples. Adding a public project is an explicit choice.
PUBLIC = set("""
    AudioPlayer CSVCleaner CameraViewer ContactSheet CueCards DeskClock EdgeShelf FieldGuide
    FocusDial FolderBoard GeometryPad IconPairs ImageViewer MenuBarControls NotificationsBadge
    ScreenRuler SubtitleRepair TextEditor TracingPaper VideoPlayer
""".split())

# These projects live in this repository, not in the released app's catalog.
SINGLE_FILE_EXTRAS = (
    {"file": "AquariumLaunchpad.html", "name": "Aquarium Launchpad",
     "summary": "Search a school of swimming app icons and click a fish to launch its app. The exported app also draws a swimming fish in the Dock."},
)


def read_file(root, relative):
    path = root / relative
    if path.resolve() != root.resolve() / relative or not path.is_file():
        raise ValueError(f"Expected an ordinary gallery file at {path}")
    return path.read_bytes()


def read_catalog(source, upstream):
    rows = plistlib.loads(read_file(source, "Catalog.plist"))
    filenames = {name + ".html" for name in PUBLIC}
    if upstream:
        rows = [r for r in rows if r["file"] in filenames]
    if sorted(r["file"] for r in rows) != sorted(filenames):
        raise ValueError("The catalog must contain exactly one entry for every public example")
    return sorted(rows, key=lambda r: r["name"].casefold())


def project_files(row):
    """Map the native gallery layout to one independent, editable project."""
    stem = Path(row["file"]).stem
    files = {"index.html": row["file"], "ProjectIcon.png": f"{stem}/ProjectIcon.png"}
    for group, key in [(stem, "resources"), ("GalleryKit", "sharedResources")]:
        for name in row.get(key, []):
            if not re.fullmatch(r"[\w-]+\.(?:css|js|json|csv|svg|srt|mp4|png)", name, re.ASCII):
                raise ValueError(f"Unexpected gallery resource {name!r}")
            path = f"{group}/{name}"
            if path in files:
                raise ValueError(f"Duplicate resource {path}")
            files[path] = path
    return files


def readme(row):
    tips = row["instructions"]
    if "setappInstructions" in row:
        tips = f"**Mac App Store edition**\n\n{tips}\n\n**Setapp edition**\n\n{row['setappInstructions']}"
    return (f"# {row['name']}\n\n{row['summary']}\n\n## Try it\n\n{tips}\n\n"
            "## Make it yours\n\nOpen this folder with **Add Project Folder** in HTML to App. "
            "Edit the source, save, then choose **Run** to preview it. "
            "Choose **Export App** to review access and try it as a standalone Mac app.\n\n"
            "The project icon is `ProjectIcon.png` beside `index.html`. "
            "[Project authoring guide](https://htmltoapp.app/documentation/authoring/).\n").encode()


def archive(members):
    # Stored entries and fixed metadata produce the same bytes across OS and zlib versions.
    # Most of the payload is already compressed PNG or media. No native binary is included.
    result = BytesIO()
    with ZipFile(result, "w") as z:
        for path, data in sorted(members.items()):
            entry = ZipInfo(path, (1980, 1, 1, 0, 0, 0))
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            z.writestr(entry, data)
    return result.getvalue()


def project_table(rows):
    entries = ["| Example source | What you can try | Project |", "| --- | --- | --- |"]
    entries.extend(f"| [{r['name']}]({r['file']}) | {r['summary']} | "
                   f"[Download]({RAW}/{Path(r['file']).stem}.htmltoapp) |" for r in rows)
    return "\n".join(entries)


def index(rows):
    intro = """# Example gallery

Each download is an editable project for HTML to App 1.1.1. Click **Download**, then double-click the saved `.htmltoapp` file in Finder. Choose **Export with Defaults** to try it, or **Customize** to review its settings first.

## Single-file examples from GitHub

These examples are not in the built-in gallery. Each download is the HTML source itself. To edit one, save a copy as `index.html` in its own folder and choose **Add Project Folder**. There is nothing to unzip.

"""
    bundled = """

For Aquarium Launchpad, enable **List Installed Apps** to see your applications and **Open Installed Apps** to launch one. In a regular browser, you can search and page through sample fish without opening any apps.

## Built-in gallery examples

Choose **Create Project** in the app's Example Gallery to make an editable copy. To edit one of the downloads below, duplicate it, rename the copy to `.zip`, expand it and choose **Add Project Folder** on the folder containing `index.html`.

"""
    end = """

## How the source is organized

The built-in examples keep their original gallery filenames here. Their ZIP downloads contain an `index.html`, a `ProjectIcon.png` and the resources each example needs. Some import modules, load local JSON or use the shared [GalleryKit](GalleryKit/) styles and file helpers. For those, download the complete package, not just the HTML source or the entire repository ZIP. Single-file examples carry their artwork in the HTML instead.

You can read the [public catalog](Catalog.plist) to see the built-in examples' titles, instructions and resource lists. The [vibe coding guide](https://htmltoapp.app/vibe-coding/) shows how to ask a browser chat for a new project or an updated copy.
"""
    return (intro + project_table(SINGLE_FILE_EXTRAS) + bundled + project_table(rows) + end).encode()


def check_inventory(folder, expected):
    # Do not delete stale files when refreshing. Make the maintainer review them.
    actual = {p.relative_to(folder).as_posix() for p in folder.rglob("*")
              if (p.is_file() or p.is_symlink()) and p.name != ".DS_Store"}
    if actual - expected:
        raise ValueError(f"Unexpected files in {folder.name}: {sorted(actual - expected)}")


def output(path, data, write):
    if path.is_symlink() or path.parent.resolve() != path.parent:
        raise ValueError(f"Refusing a symlink at {path}")
    if path.is_file() and path.read_bytes() == data:
        return
    if not write:
        raise ValueError(f"{path.relative_to(ROOT)} is missing or out of date")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--upstream", type=Path, metavar="EXAMPLES", help="compare with a released gallery or use it as the source with --write")
    parser.add_argument("--write", action="store_true", help="refresh public sources from upstream if supplied, the index and packages")
    args = parser.parse_args()
    source = args.upstream or EXAMPLES
    rows = read_catalog(source, args.upstream is not None)
    files = {"Catalog.plist": plistlib.dumps(rows, sort_keys=False), "README.md": index(rows)}
    packages = {}
    license_text = (ROOT / "LICENSE").read_bytes()
    for row in rows:
        members = {"README.md": readme(row), "LICENSE": license_text}
        for dest, src in project_files(row).items():
            if src not in files:
                files[src] = read_file(source, src)
            members[dest] = files[src]
        packages[Path(row["file"]).stem + ".htmltoapp"] = archive(members)
    for extra in SINGLE_FILE_EXTRAS:
        name = extra["file"]
        download = Path(name).stem + ".htmltoapp"
        if name in files or download in packages:
            raise ValueError(f"Duplicate gallery example {name}")
        # Plain HTML is a supported portable document. Keep the download byte-identical
        # to the repository source, including when refreshing built-ins from an app.
        files[name] = packages[download] = read_file(EXAMPLES, name)
    outputs = [(EXAMPLES, files), (DOWNLOADS, packages)]
    for directory, expected in outputs:
        check_inventory(directory, set(expected))
    for directory, expected in outputs:
        for name, data in expected.items():
            output(directory / name, data, args.write)
    print(f"{'Refreshed' if args.write else 'Verified'} the gallery ({len(rows)} built-in, {len(SINGLE_FILE_EXTRAS)} single-file), its index and downloads.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError) as error:
        sys.exit(str(error))
