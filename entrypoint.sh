#!/bin/sh -l

last_release=$(git describe --abbrev=0 --tags | sed -e 's/v//')

new_major_version=$1
new_minor_version=$2

if [[ ! -z "$3" ]]; then
  new_patch_version=$3
else
  last_patch_version=$(echo $last_release | cut -d '.' -f 3)
  new_patch_version=$((last_patch_version+1))
fi

new_release="v$new_major_version.$new_minor_version.$new_patch_version"

echo "Last Release: $last_release"
echo "New Release: $new_release"

gh release create "$new_release" \
--title "$new_release" \
--generate-notes
