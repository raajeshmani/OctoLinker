import * as storage from '@octolinker/helper-settings';
import rateLimitNotification from '@octolinker/ratelimit-notification';

export default async function ({ user, repo, branch }) {
  const token = storage.get('githubToken');
  const enterpriseToken = storage.get('githubEnterpriseToken');

  const headers = {
    Accept: 'application/vnd.github.v3+json',
  };

  let response;
  let enterpriseResponse;
  try {
    if (token) {
      headers.Authorization = `token ${token}`;
    }
    response = await fetch(
      `https://api.github.com/repos/${user}/${repo}/git/trees/${branch}?recursive=1`,
      {
        method: 'GET',
        headers,
      },
    );

    if (enterpriseToken) {
      headers.Authorization = `token ${enterpriseToken}`;
    }
    enterpriseResponse = await fetch(
      `https://github.cerner.com/api/v3/repos/${user}/${repo}/git/trees/${branch}?recursive=1`,
      {
        method: 'GET',
        headers,
      }
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
  console.log(response);
  console.log(enterpriseResponse);

  response = response.status === 200 ? response : enterpriseResponse;

  console.log("Final Tree Response", response)

  if (!response) return [];

  rateLimitNotification(response.headers, response.status);

  const json = await response.json();

  if (!json.tree) {
    return [];
  }

  return json.tree
    .filter(({ type }) => type === 'blob')
    .map(({ path }) => path);
}
