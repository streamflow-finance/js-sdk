#!/bin/sh

if [ $# -eq 0 ]; then
  TARGET_FOLDERS="packages"
else
  TARGET_FOLDERS=$@
fi

OS=$(uname)

if [ "$OS" = "Darwin" ]; then
    SED_NO_BACKUP=( -i '' )
else
    SED_NO_BACKUP=( -i )
fi

for FOLDER in $TARGET_FOLDERS
do
echo "Replacing 'BN' with 'BigNumber' in $FOLDER and its subfolders"
find "$FOLDER" -type f -name "*.ts[x]" -exec sed "${SED_NO_BACKUP[@]}" -e 's/BN/BigNumber/g' -e 's/bn/bignumber/g' {} +
done
