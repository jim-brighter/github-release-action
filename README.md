# Simple Github Release
Creates a new, barebones Release and Tag, and pushes them to Github.

Versioning is dynamically computed based on the commit message of the push event:
- If the commit message includes `version:major`, the major version is incremented, and minor and patch are reset to `0`.
- If the commit message includes `version:minor`, the minor version is incremented, and patch is reset to `0`.
- Otherwise (including if the commit message contains `version:patch`), the patch version is incremented.

Tag and Release Title follow the `v[major].[minor].[patch]` format, e.g. `v1.0.3`.

Release description is automatically generated.

## Inputs
|Input Field|Required|Default|Description|
|-|-|-|-|
|`num_releases_to_keep`|Optional|None - will not prune any releases|Used to optionally prune old releases. If this is a number greater than 0, the action will delete all but the `num_releases_to_keep` most recent releases & tags.|
|`tag_major_version`|Optional|`false` - will not tag major version|If this is `true`, will publish/update a major-version-only tag (e.g. v2) to point to this new release version.|

Also **required**:
- the token used by your job should have `contents: write` permissions

## Outputs
None

## Example Usage
```yaml
jobs:
  job:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-tags: true
          fetch-depth: 0
      - name: Create Release
        uses: jim-brighter/github-release-action@v4
        env:
          GITHUB_TOKEN: ${{ github.token }}
        with:
          num_releases_to_keep: 20
          tag_major_version: true
```
