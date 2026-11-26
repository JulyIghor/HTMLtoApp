# Maintaining the gallery

The HTML files and their resources mirror the public examples from the released app. Keep the native builder, internal demos, personal files and build artifacts out of this repository. The allowlist in `scripts/gallery.py` is intentional.

To verify a checkout, run the following from its root. No network or third-party Python packages are needed.

```sh
python3 scripts/gallery.py
```

To prepare a gallery update from a released installation, run the following commands. Use the release you intend to document rather than an in-progress development checkout.

```sh
python3 scripts/gallery.py --upstream "/Applications/HTML to App.app/Contents/Resources/Examples" --write
python3 scripts/gallery.py --upstream "/Applications/HTML to App.app/Contents/Resources/Examples"
```

The second command is read-only. It compares every published entry page, artwork file and resource with the release and reconstructs each package in memory. A clean match means the published package is byte-for-byte reproducible. Unlisted resources are not copied. Unexpected files are reported, not deleted.

Before publishing, open the downloads with the matching HTML to App release, check representative projects in Preview and review the README against the [authoring guide](https://htmltoapp.app/documentation/authoring/) and [public bridge reference](https://htmltoapp.app/documentation/bridge/). Keep the existing HTML filenames so incoming links still work.
