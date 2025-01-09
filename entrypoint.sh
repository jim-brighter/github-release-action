#!/bin/sh -l

set -e

# Create new release

git config --system --add safe.directory /github/workspace

major_version=$MAJOR_VERSION
minor_version=$MINOR_VERSION

last_release=$(git tag -l "v$major_version.$minor_version*" --sort=-v:refname | head -n 1)
last_release=${last_release:="v0.0.0"}

if [[ ! -z "$PATCH_VERSION" ]]; then
  patch_version=$PATCH_VERSION
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

# Optionally prune old releases
if [[ "$NUM_RELEASES_TO_KEEP" =~ '^[0-9]+$' ]]; then
  num_releases_to_keep="+$(expr $NUM_RELEASES_TO_KEEP + 1)"

  sleep 3

  echo "Pruning all but the $NUM_RELEASES_TO_KEEP most recent releases"

  git fetch -pP
  releases=$(curl -L \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/$GITHUB_REPOSITORY/releases" \
    | jq -r '.[] | ((.id | tostring) + "|" + .tag_name)' | tail -n "$num_releases_to_keep")

  for r in ${releases[@]}; do
    release_id=$(echo $r | cut -d '|' -f 1)
    tag=$(echo $r | cut -d '|' -f 2)

    echo "Deleting $tag"

    curl -L \
      -X "DELETE" \
      -w "DELETE Status: %{http_code}\n" \
      -H "Accept: application/vnd.github+json" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $GITHUB_TOKEN" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      "https://api.github.com/repos/$GITHUB_REPOSITORY/releases/$release_id"

    git push --delete origin $tag
  done
  # git for-each-ref --sort=-creatordate --format '%(refname) %(creatordate)' refs/tags | tail -n "$num_releases_to_keep" | awk '{print $1}' | xargs git push --delete origin
else
  echo "Not pruning any releases"
fi

# Optionally tag major version
if [[ "$TAG_MAJOR_VERSION" = "true" ]]; then
  git fetch -pP
  git tag -f "v$major_version" "$new_release"
  git push -f --tags
else
  echo "Not tagging major version"
fi
