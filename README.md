# Sketch Clean SVG Icon

This script performs additional cleaning for icons exported as SVG from Sketch and processed by the [SVGO Compressor](https://github.com/BohemianCoding/svgo-compressor) plugin. It's intended icons that use the [color symbol technique](https://medium.com/sketch-app-sources/icon-sets-with-color-override-in-sketch-f6c893278bd3), thus it must have a visible shape mask layer for this script to work. See `example.sketch` for how the icons symbols are structured.

*TODO:* Make this into a Sketch plugin that runs right after SVGO Compressor so it's entirely automated.

## Usage

Run `node index.js /path/to/icons/` to clean a single `.svg` file or all SVG files in a directory.
