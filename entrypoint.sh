#!/bin/sh -l

git config --system --add safe.directory /github/workspace

major_version=$1
minor_version=$2

last_release=$(git tag -l "v$major_version.$minor_version*" --sort=-v:refname | head -n 1)
last_release=${last_release:="v0.0.0"}

if [[ ! -z "$3" ]]; then
  patch_version=$3
else
  last_patch_version=$(echo $last_release | cut -d '.' -f 3)
  patch_version=$((last_patch_version+1))
fi

new_release="v$major_version.$minor_version.$patch_version"

echo "Last Release: $last_release"
echo "New Release: $new_release"

curl -L \
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
