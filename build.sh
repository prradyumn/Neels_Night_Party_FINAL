#!/bin/bash
cd "$(dirname "$0")"
npx esbuild src/main.js --bundle --format=iife --minify --target=es2019 --outfile=game.js --external:*.webp --loader:.css=css --loader:.svg=text --loader:.mp3=dataurl 2>&1 | tail -3
[ -f game.css ] || true
