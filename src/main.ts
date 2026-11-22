import { Octokit } from 'octokit';

const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] });

const [{ data: user }, followerLogins, followingLogins] = await Promise.all([
  octokit.rest.users.getAuthenticated(),
  // https://docs.github.com/en/rest/users/followers#list-followers-of-the-authenticated-user
  octokit.paginate(
    octokit.rest.users.listFollowersForAuthenticatedUser,
    { per_page: 100 },
    response => response.data.map(u => u.login),
  ),
  // https://docs.github.com/en/rest/users/followers#list-the-people-the-authenticated-user-follows
  octokit.paginate(
    octokit.rest.users.listFollowedByAuthenticatedUser,
    { per_page: 100 },
    response => response.data.map(u => u.login),
  ),
]);

console.log(`Authenticated as: ${user.login}`);

const followers = new Set(followerLogins);
const following = new Set(followingLogins);

console.log(
  `Found ${followers.size} followers and ${following.size} following.`,
);

for (const follower of followers.difference(following)) {
  await octokit.rest.users.follow({ username: follower });
  console.log(`Followed ${follower} unless the user's profile was private.`);
}

for (const followedUser of following.difference(followers)) {
  await octokit.rest.users.unfollow({ username: followedUser });
  console.log(
    `Unfollowed ${followedUser} unless the user's profile was private.`,
  );
}
