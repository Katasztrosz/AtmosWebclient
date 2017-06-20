#!/bin/bash

# check if r.js installed
which -s r.js || npm install -g requirejs

# build minifyied code
r.js -o build-css.js
r.js -o build.js