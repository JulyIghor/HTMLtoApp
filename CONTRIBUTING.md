# Maintaining the gallery

The built-in examples mirror the released app. The gallery also lists additional single-file projects published only here. Keep the native builder, internal demos, personal files and build artifacts out of this repository. The allowlists in `scripts/gallery.py` are intentional.

To verify a checkout, run the following from its root. No network or third-party Python packages are needed.

```sh
python3 scripts/gallery.py
```

To prepare a gallery update from a released installation, run the following commands. Use the release you intend to document rather than an in-progress development checkout.

```sh
python3 scripts/gallery.py --upstream "/Applications/HTML to App.app/Contents/Resources/Examples" --write
python3 scripts/gallery.py --upstream "/Applications/HTML to App.app/Contents/Resources/Examples"
```

The second command is read-only. It compares the built-in entry pages, artwork and resources with the release and reconstructs their ZIP files in memory. It also verifies that each single-file download contains an `index.html` byte-identical to its repository source. Unlisted resources are not copied. Unexpected files are reported, not deleted.

For a new single-file example, put its original HTML in `examples/`, list it in `SINGLE_FILE_EXTRAS` and run `python3 scripts/gallery.py --write`. The download wraps the untouched HTML as the only entry in a ZIP-backed `.htmltoapp` file so GitHub serves it as a download rather than plain text. Do not add repository-only projects to the released app's catalog.

Before publishing, open the downloads with the matching HTML to App release, check representative projects in Preview and review the README against the [authoring guide](https://htmltoapp.app/documentation/authoring/) and [public bridge reference](https://htmltoapp.app/documentation/bridge/). Keep the existing HTML filenames so incoming links still work.
