import * as core from '@actions/core';
import * as github from '@actions/github';
import { execSync } from 'child_process';

/**
 * Gets the latest release tag from the GitHub repository using Octokit.
 * Defaults to 'v0.0.0' if no release exists.
 */
async function getLatestReleaseTag(octokit, owner, repo) {
    try {
        console.log('Retrieving the latest release...');
        const latestRelease = await octokit.rest.repos.getLatestRelease({ owner, repo });
        if (latestRelease?.data?.tag_name) {
            return latestRelease.data.tag_name;
        }
    } catch (err) {
        console.log('No release found or failed to retrieve. Defaulting to v0.0.0');
    }
    return 'v0.0.0';
}

/**
 * Parses the version components from a tag name.
 * Supports format `vMajor.Minor.Patch` or `Major.Minor.Patch`.
 */
function parseVersion(tagName) {
    const match = tagName.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
    if (match) {
        return {
            major: parseInt(match[1], 10),
            minor: parseInt(match[2], 10),
            patch: parseInt(match[3], 10)
        };
    }
    return { major: 0, minor: 0, patch: 0 };
}

/**
 * Retrieves the commit message for the HEAD commit.
 */
function getCommitMessage() {
    try {
        return execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    } catch (err) {
        console.warn(`Warning: Failed to get commit message from git: ${err.message}. Falling back to event payload.`);
        return github.context.payload.head_commit?.message || '';
    }
}

/**
 * Bumps the version based on the commit message.
 */
function calculateNextVersion(currentVersion, commitMessage) {
    const { major, minor, patch } = parseVersion(currentVersion);

    if (commitMessage.includes('version:major')) {
        return { major: major + 1, minor: 0, patch: 0 };
    }
    if (commitMessage.includes('version:minor')) {
        return { major, minor: minor + 1, patch: 0 };
    }
    // Default to patch bump (even if version:patch is explicitly in the message or not)
    return { major, minor, patch: patch + 1 };
}

/**
 * Creates a new GitHub Release.
 */
async function createGitHubRelease(octokit, owner, repo, tag, sha) {
    console.log(`Creating release ${tag} for commit ${sha}...`);
    await octokit.rest.repos.createRelease({
        owner,
        repo,
        tag_name: tag,
        target_commitish: sha,
        name: tag,
        generate_release_notes: true
    });
}

/**
 * Creates or updates the major version tag (e.g. v2) to point to the new release.
 */
async function updateMajorVersionTag(octokit, owner, repo, major, sha) {
    const ref = `tags/v${major}`;
    const fullRef = `refs/${ref}`;
    console.log(`Updating major version tag v${major} to point to ${sha}`);
    
    try {
        // Try to create ref first
        await octokit.rest.git.createRef({
            owner,
            repo,
            ref: fullRef,
            sha
        });
        console.log(`Created tag ${fullRef}`);
    } catch (err) {
        if (err.status === 422 || err.message.includes('Reference already exists')) {
            // Reference already exists, update it
            await octokit.rest.git.updateRef({
                owner,
                repo,
                ref,
                sha,
                force: true
            });
            console.log(`Updated tag ${fullRef}`);
        } else {
            throw err;
        }
    }
}

/**
 * Prunes older releases and tags, keeping only the specified number.
 */
async function pruneOldReleases(octokit, owner, repo, numToKeep) {
    console.log(`Pruning all but the ${numToKeep} most recent releases...`);
    const releases = await octokit.paginate(octokit.rest.repos.listReleases, {
        owner,
        repo,
        per_page: 100
    });

    // Sort releases by created_at descending (newest first)
    releases.sort((a, b) => {
        const dateDiff = new Date(b.created_at) - new Date(a.created_at);
        if (dateDiff !== 0) return dateDiff;
        return b.id - a.id;
    });

    if (releases.length <= numToKeep) {
        console.log(`Only ${releases.length} releases found. No pruning needed.`);
        return;
    }

    const releasesToDelete = releases.slice(numToKeep);
    console.log(`Found ${releases.length} releases. Deleting the oldest ${releasesToDelete.length} releases...`);

    for (const release of releasesToDelete) {
        console.log(`Deleting release ${release.tag_name} (ID: ${release.id})`);
        try {
            await octokit.rest.repos.deleteRelease({
                owner,
                repo,
                release_id: release.id
            });
            console.log(`Deleted release ${release.tag_name}`);
        } catch (err) {
            console.error(`Failed to delete release ${release.id}:`, err.message);
        }

        try {
            await octokit.rest.git.deleteRef({
                owner,
                repo,
                ref: `tags/${release.tag_name}`
            });
            console.log(`Deleted tag refs/tags/${release.tag_name}`);
        } catch (err) {
            console.error(`Failed to delete tag refs/tags/${release.tag_name}:`, err.message);
        }
    }
}

/**
 * Main execution.
 */
async function run() {
    try {
        const numReleasesToKeep = Number(core.getInput('num_releases_to_keep'));
        const tagMajorVersion = core.getBooleanInput('tag_major_version');
        const token = core.getInput('token', { required: true });

        const octokit = github.getOctokit(token);
        const { owner, repo } = github.context.repo;
        const commitSha = github.context.sha;

        // 1. Get latest release
        const latestReleaseTag = await getLatestReleaseTag(octokit, owner, repo);
        console.log(`Latest Release Tag: ${latestReleaseTag}`);

        // 2. Get commit message and bump version
        const commitMessage = getCommitMessage();
        console.log(`Commit Message:\n---\n${commitMessage}\n---`);

        const nextVersionObj = calculateNextVersion(latestReleaseTag, commitMessage);
        const newReleaseTag = `v${nextVersionObj.major}.${nextVersionObj.minor}.${nextVersionObj.patch}`;
        console.log(`New Release Tag: ${newReleaseTag}`);

        // 3. Create the new release
        await createGitHubRelease(octokit, owner, repo, newReleaseTag, commitSha);

        // 4. Optionally prune old releases
        if (!isNaN(numReleasesToKeep) && numReleasesToKeep > 0) {
            // Wait 3 seconds to ensure the GitHub API registers the new release
            console.log('Waiting 3 seconds before pruning...');
            await new Promise((resolve) => setTimeout(resolve, 3000));
            await pruneOldReleases(octokit, owner, repo, numReleasesToKeep);
        } else {
            console.log('Not pruning any releases');
        }

        // 5. Optionally tag major version
        if (tagMajorVersion) {
            await updateMajorVersionTag(octokit, owner, repo, nextVersionObj.major, commitSha);
        } else {
            console.log('Not tagging major version');
        }
    } catch (err) {
        core.setFailed(err.message);
    }
}

run();
