const github = require('@actions/github')
const core = require('@actions/core')
const timers = require('node:timers/promises')

const owner = process.env.GITHUB_REPOSITORY_OWNER
const repo = process.env.GITHUB_REPOSITORY.split('/')[1]

const token = process.env.GITHUB_TOKEN
const majorVersion = process.env.MAJOR_VERSION
const minorVersion = process.env.MINOR_VERSION
let patchVersion = process.env.PATCH_VERSION

const numReleasesToKeep = process.env.NUM_RELEASES_TO_KEEP
const shouldTagMajorVersion = process.env.TAG_MAJOR_VERSION

const octokit = github.getOctokit(token)

async function run () {
  const nextRelease = await getNextReleaseVersion()

  await createNewRelease(nextRelease)

  if (needToWait()) {
    await timers.setTimeout(3000)
  }

  await pruneOldReleases()
  await tagMajorVersion(nextRelease)
}

async function getNextReleaseVersion() {
  const { data: tags } = await octokit.rest.git.listMatchingRefs({
    owner,
    repo,
    ref: `tags/v${majorVersion}.${minorVersion}`
  })

  const sortedTags = tags.sort((a, b) => {
    const aPatch = Number(a.ref.split('/')[2].split('.')[2])
    const bPatch = Number(b.ref.split('/')[2].split('.')[2])
    return bPatch - aPatch
  })

  const latestTag = sortedTags[0] || 'v0.0.0'

  if (patchVersion == null) {
    patchVersion = Number(latestTag.ref.split('.').pop()) + 1
  }

  return `v${majorVersion}.${minorVersion}.${patchVersion}`
}

async function createNewRelease(nextRelease) {
  console.log(`Creating new release ${nextRelease}`)
  await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: nextRelease,
    name: nextRelease,
    generate_release_notes: true
  })
}

async function pruneOldReleases() {
  if (!(/^[0-9]+$/.test(numReleasesToKeep))) {
    console.log('Not pruning old releases')
    return
  }

  const numReleases = Number(numReleasesToKeep)

  console.log(`Pruning all but the ${numReleases} most recent releases`)

  const { data: releases } = await octokit.rest.repos.listReleases({
    owner,
    repo
  })

  const releasesToRemove = releases.slice(numReleases)

  await Promise.all(releasesToRemove.map(async (r) => {
    console.log(`Deleting ${r.name}`)
    await octokit.rest.repos.deleteRelease({
      owner,
      repo,
      release_id: r.id
    })

    await octokit.rest.git.deleteRef({
      owner,
      repo,
      ref: `tags/${r.tag_name}`
    })
  }))
}

async function tagMajorVersion(nextRelease) {
  if (shouldTagMajorVersion !== 'true') {
    console.log('Not tagging major version')
    return
  }

  console.log(`Tagging v${majorVersion} to ${nextRelease}`)

  const { data: lastTag } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `tags/${nextRelease}`
  })

  const sha = lastTag.object.sha

  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/tags/v${majorVersion}`,
    sha
  })
}

function needToWait() {
  return numReleasesToKeep != null || shouldTagMajorVersion != null
}

run()
