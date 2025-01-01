# Simple Github Release
Creates a new, barebones Release and Tag, and pushes them to Github

Tag and Release Title follow `v[major].[minor].[patch]` format, e.g. `v1.0.3`

Release description is automatically generated

## Inputs
|Input Field|Required|Default|Description|
|-|-|-|-|
|`major-version`|**Required**|`0`|Used in the major position for the tag and release title|
|`minor-version`|**Required**|`0`|Used in the minor position for the tag and release title|
|`patch-version`|Optional|Will increment the previous release patch version. If there is no previous release, will default to `1`|Used in the patch position for the tag and release title. Generally recommend not setting this so as to not attempt writing a duplicate tag.|
|`num_releases_to_keep`|Optional|None - will not prune any releases|Used to optionally prune old releases. If this is a number greater than 0, the action will delete all but the `num_releases_to_keep` most recent releases & tags|
|`tag_major_version`|Optional|`false` - will not tag major version|If this is `true`, will publish/update a major-version-only tag (e.g. v2) to point to this new release version|

Also **required**:
- the token used by your job should have `contents: write` permissions
- pass the `GITHUB_TOKEN` environment variable to the action
- if using the `actions/checkout` action, include:
```yaml
with:
  fetch-tags: true
  fetch-depth: 0
```

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
        uses: jim-brighter/github-release-action@v3
        env:
          GITHUB_TOKEN: ${{ github.token }}
        with:
          major-version: 1
          minor-version: 0
          num_releases_to_keep: 20
          tag_major_version: true
```
