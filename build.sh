#!/bin/sh

rm -rf dist
mkdir dist

cp index.html style.css dist

npx rolldown main.js -o dist/main.js -f esm -m \
  -e "./style.css" -e "lit-html" -e "lit-html/directives/class-map.js" \
  -e "lit-html/directives/choose.js" -e "lit-html/directives/when.js"
