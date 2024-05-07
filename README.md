# github-release-action
Creates a new, barebones Release and Tag, and pushes them to Github

Tag and Release Title follow `v[major].[minor].[patch]` format, e.g. `v1.0.3`

Release description is automatically generated

## Inputs
- `major-version` - **Required** - used in the major position for the tag and release title
- `minor-version` - **Required** - used in the minor position for the tag and release title
- `patch-version` - _Optional_ - used in the patch position for the tag and release title. If omitted, action will increment the patch version from the previous release.

Also **required**: when using this action, set the `GH_TOKEN` environment variable - this is required by `gh` CLI

## Outputs
None

## Example Usage
```yaml
name: Create Release
env:
  GH_TOKEN: ${{ github.token }}
uses: jim-brighter/github-release-action@v1
with:
  major-version: 1
  minor-version: 0
```
