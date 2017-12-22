/* eslint-env node, es6 */
'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const hasFlag = require('has-flag');
const xml2js = require('xml2js');
const parser = xml2js.Parser();

// Constants
const IS_VERBOSE = hasFlag('-v') || hasFlag('--verbose');
const NO_BACKUP = hasFlag('-f');

/**
 * Returns whether the file has a .svg extension.
 * @param {String} filePath - File path.
 * @return {Boolean} Returns true if file has .svg extension.
 */
function hasSvgExt(filePath) {
  return filePath.substr(-4) === '.svg';
}

let files = [];
for (let i in process.argv) {
  let arg = process.argv[i];
  if (arg.charAt(0) === '-') continue;
  // Find SVG files from any paths in arguments
  try {
    let stat = fs.lstatSync(arg);
    if (stat.isFile() && hasSvgExt(arg)) {
      files.push(arg);
      continue;
    }
    if (stat.isDirectory()) {
      let items = fs.readdirSync(arg);
      // Add all SVG files in directory
      for (let j in items) {
        let item = items[j];
        if (hasSvgExt(item)) {
          files.push(path.join(arg, item));
        }
      }
    }
  } catch(e) {
    console.error(e);
    continue;
  }
}

/**
 * Traverses a SVG structure from a XML object.
 * @param {Object} obj - XML object to traverse.
 * @param {Function} cb - Function to call on each property.
 */
function traverse(obj, cb) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            cb(key, obj[key]);
            if (key !== '$' && obj[key] instanceof Object) {
              // Traverse non-root properties
              traverse(obj[key], cb);
            }
        }
    }
}

if (!files.length) {
  console.warn('There are no files or directories specified.');
  return;
}

for (let i in files) {
  let file = files[i];
  fs.readFile(file, function(err, buf) {
      if (err) console.error(err);
      let content = buf.toString();
      // Parse XML content
      parser.parseString(content, function(errParse, result) {
          if (errParse) console.error(errParse);
          if (IS_VERBOSE) {
            console.log(`${file} XML structure:\n`, util.inspect(result, false, null));
          }

          // Search for SVG and path element
          let svgEle, defsEle;
          traverse(result, function(key, obj) {
              if (key === 'svg') {
                  svgEle = obj;
                  return;
              }
              if (key === 'defs' && obj.length) {
                  defsEle = obj[0];
              }
          });

          // Handle invalid input
          if (!svgEle) {
            console.error(`${file} is missing <svg>.`);
            return;
          }
          if (!defsEle) {
            console.error(`${file} is missing a <defs> element.`);
            return;
          }

          // Build new SVG from object
          let newSvg = {
              svg: {
                  $: svgEle.$
              }
          };
          for (let j in defsEle) {
            let def = defsEle[j];
            for (let k in def) {
              // Remove id
              delete def[k].$.id;
            }
            // Add def child element to svg
            newSvg.svg[j] = defsEle[j];
          }
          let builder = new xml2js.Builder({
              headless: true
          });
          let output = builder.buildObject(newSvg);
          if (IS_VERBOSE) {
            console.log(`${file} Output:\n`, output);
          }

          // Create backup file
          if (!NO_BACKUP) {
            fs.writeFile(file + '_original', content, function(errWrite) {
                if (errWrite) console.error('Unable to create backup.', errWrite);
            });
          }

          // Overwrite original file
          fs.writeFile(file, output, function(errWrite) {
              if (errWrite) console.error(errWrite);
              console.log(`${file} is cleaned.`);
          });
      });
  });
}
