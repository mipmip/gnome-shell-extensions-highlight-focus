#!/usr/bin/env bash

set -e

if [ "$UID" = "0" ]; then
    echo 'This should not be run as root'
    exit 101
fi

NAME=highlight-focus\@pimsnel.com

function pack-extension {
  echo "Packing extension..."
  compile-translations
  compile-preferences
  gnome-extensions pack src \
    --force \
    --extra-source="../LICENSE" \
    --extra-source="../CHANGELOG.md" \
    --extra-source="ui.js" \
    --extra-source="style.js"
}

function compile-translations {
    if [ -d locale ]; then
      echo 'Compiling translations...'
      for po in locale/*/LC_MESSAGES/*.po; do
        msgfmt -cv -o ${po%.po}.mo $po;
      done
    else
        echo 'No translations to compile... Skipping'
    fi
}
function compile-preferences {
    if [ -d src/schemas ]; then
        echo 'Compiling preferences...'
        glib-compile-schemas --targetdir=src/schemas src/schemas
    else
        echo 'No preferences to compile... Skipping'
    fi
}

function usage() {
    echo 'Usage: ./install.sh COMMAND'
    echo 'COMMAND:'
    echo "  local-install  install the extension in the user's home directory"
    echo '                 under ~/.local'
    echo '  zip            Creates a zip file of the extension'
}

case "$1" in
    "local-install" )
        pack-extension
        gnome-extensions install --force $NAME.shell-extension.zip
        ;;

    "zip" )
        pack-extension
        ;;

    * )
        usage
        ;;
esac
exit
