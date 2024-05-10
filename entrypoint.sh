#!/bin/sh -l

git config --system --add safe.directory /github/workspace

last_release=$(git describe --abbrev=0 --tags)
if [[ $? -ne 0 ]]; then
  echo "No previous release found, defaulting to 0.0.0"
  last_release="0.0.0"
fi

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

curl -vL \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$GITHUB_REPOSITORY/releases" \
  -d '{
    "tag_name": "'"$new_release"'",
    "name": "'"$new_release"'",
    "generate_release_notes": true
  }'
