# github-release-action
Creates a new, barebones Release and Tag, and pushes them to Github

Tag and Release Title follow `v[major].[minor].[patch]` format, e.g. `v1.0.3`

Release description is automatically generated

## Inputs
- `major-version` - **Required** - used in the major position for the tag and release title
- `minor-version` - **Required** - used in the minor position for the tag and release title
- `patch-version` - _Optional_ - used in the patch position for the tag and release title. If omitted, action will increment the patch version from the previous release. Generally recommend not setting this so as to not attempt writing a duplicate tag.

Also **required**:
- the token used by your job should have `contents: write` permissions
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
        uses: jim-brighter/github-release-action@v1
        env:
          GITHUB_TOKEN: ${{ github.token }}
        with:
          major-version: 1
          minor-version: 0
```
