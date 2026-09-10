import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const username = "pushkarkumarsaini2006";
const outputDirectory = join(process.cwd(), "output");
const apiHeaders = {
  Accept: "application/vnd.github+json",
  "User-Agent": "profile-widget-generator"
};

const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

async function getJson(url) {
  const response = await fetch(url, { headers: apiHeaders });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response.json();
}

function svgDocument(width, height, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc"><title id="title">${escapeXml(title)}</title><desc id="desc">Generated GitHub profile widget for ${username}.</desc>${body}</svg>\n`;
}

function activitySvg(contributions) {
  const width = 900;
  const height = 260;
  const start = contributions.slice(-364);
  const maxCount = Math.max(1, ...start.map((day) => day.count));
  const colors = ["#2b173b", "#7a1f5c", "#b52f76", "#e34188", "#fe428e"];
  const cells = start.map((day, index) => {
    const week = Math.floor(index / 7);
    const row = index % 7;
    const level = day.count === 0 ? 0 : Math.min(4, Math.ceil((day.count / maxCount) * 4));
    const x = 34 + week * 16;
    const y = 92 + row * 16;
    return `<rect x="${x}" y="${y}" width="11" height="11" rx="2" fill="${colors[level]}"/><title>${escapeXml(day.date)}: ${day.count} contribution${day.count === 1 ? "" : "s"}</title></rect>`;
  }).join("");
  const total = start.reduce((sum, day) => sum + day.count, 0);
  const body = `<rect width="${width}" height="${height}" rx="12" fill="#141321"/><text x="32" y="40" fill="#ffffff" font-family="Verdana,sans-serif" font-size="22" font-weight="700">Contribution activity</text><text x="32" y="64" fill="#b7b4c7" font-family="Verdana,sans-serif" font-size="13">${total} contributions in the last year</text>${cells}<text x="34" y="224" fill="#b7b4c7" font-family="Verdana,sans-serif" font-size="12">Less</text>${colors.map((color, index) => `<rect x="72" y="214" width="11" height="11" rx="2" fill="${color}"/><text x="${index === 0 ? 0 : 0}" y="0"></text>`).join("")}<text x="150" y="224" fill="#b7b4c7" font-family="Verdana,sans-serif" font-size="12">More</text>`;
  return svgDocument(width, height, "GitHub contribution activity", body);
}

function trophiesSvg(user, contributions) {
  const width = 900;
  const height = 220;
  const total = contributions.reduce((sum, day) => sum + day.count, 0);
  const items = [
    ["Contributions", total, "#fe428e"],
    ["Repositories", user.public_repos, "#f8d847"],
    ["Followers", user.followers, "#2d9cdb"],
    ["Stars", user.total_stars, "#ff6b6b"]
  ];
  const cards = items.map(([label, value, color], index) => {
    const x = 32 + index * 216;
    return `<g transform="translate(${x} 66)"><circle cx="70" cy="42" r="38" fill="${color}"/><text x="70" y="50" fill="#141321" font-family="Verdana,sans-serif" font-size="22" font-weight="700" text-anchor="middle">${escapeXml(value)}</text><text x="70" y="112" fill="#ffffff" font-family="Verdana,sans-serif" font-size="13" text-anchor="middle">${escapeXml(label)}</text></g>`;
  }).join("");
  const body = `<rect width="${width}" height="${height}" rx="12" fill="#141321"/><text x="32" y="40" fill="#ffffff" font-family="Verdana,sans-serif" font-size="22" font-weight="700">GitHub trophies</text>${cards}`;
  return svgDocument(width, height, "GitHub trophies", body);
}

function streakSvg(contributions) {
  const width = 900;
  const height = 220;
  const days = contributions.slice().reverse();
  let currentStreak = 0;
  for (const day of days) {
    if (day.count === 0) break;
    currentStreak += 1;
  }

  let longestStreak = 0;
  let streak = 0;
  for (const day of contributions) {
    streak = day.count === 0 ? 0 : streak + 1;
    longestStreak = Math.max(longestStreak, streak);
  }

  const body = `<rect width="${width}" height="${height}" rx="12" fill="#141321"/><text x="32" y="42" fill="#ffffff" font-family="Verdana,sans-serif" font-size="22" font-weight="700">Contribution streak</text><g transform="translate(32 76)"><rect width="400" height="100" rx="10" fill="#242137"/><text x="200" y="42" fill="#00ffff" font-family="Verdana,sans-serif" font-size="30" font-weight="700" text-anchor="middle">${currentStreak} days</text><text x="200" y="72" fill="#b7b4c7" font-family="Verdana,sans-serif" font-size="14" text-anchor="middle">Current streak</text></g><g transform="translate(468 76)"><rect width="400" height="100" rx="10" fill="#242137"/><text x="200" y="42" fill="#00ffff" font-family="Verdana,sans-serif" font-size="30" font-weight="700" text-anchor="middle">${longestStreak} days</text><text x="200" y="72" fill="#b7b4c7" font-family="Verdana,sans-serif" font-size="14" text-anchor="middle">Longest streak</text></g>`;
  return svgDocument(width, height, "GitHub contribution streak", body);
}

function repositoriesSvg(repositories) {
  const width = 900;
  const height = 300;
  const rows = repositories.slice(0, 5).map((repo, index) => {
    const y = 86 + index * 38;
    const language = repo.language || "Code";
    return `<rect x="32" y="${y}" width="836" height="30" rx="6" fill="#242137"/><text x="48" y="${y + 20}" fill="#f8d847" font-family="Verdana,sans-serif" font-size="13">0${index + 1}</text><text x="88" y="${y + 20}" fill="#ffffff" font-family="Verdana,sans-serif" font-size="13">${escapeXml(repo.name)}</text><text x="820" y="${y + 20}" fill="#b7b4c7" font-family="Verdana,sans-serif" font-size="12" text-anchor="end">${escapeXml(language)} · ${repo.stargazers_count} stars</text>`;
  }).join("");
  const body = `<rect width="${width}" height="${height}" rx="12" fill="#141321"/><text x="32" y="40" fill="#ffffff" font-family="Verdana,sans-serif" font-size="22" font-weight="700">Top contributed repositories</text><text x="32" y="64" fill="#b7b4c7" font-family="Verdana,sans-serif" font-size="13">Most recently active public repositories</text>${rows}`;
  return svgDocument(width, height, "Top contributed repositories", body);
}

const contributionData = await getJson(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
const user = await getJson(`https://api.github.com/users/${username}`);
const repositories = await getJson(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`);
user.total_stars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);

await mkdir(outputDirectory, { recursive: true });
await writeFile(join(outputDirectory, "github-activity.svg"), activitySvg(contributionData.contributions));
await writeFile(join(outputDirectory, "github-streak.svg"), streakSvg(contributionData.contributions));
await writeFile(join(outputDirectory, "github-trophies.svg"), trophiesSvg(user, contributionData.contributions));
await writeFile(join(outputDirectory, "top-contributed-repositories.svg"), repositoriesSvg(repositories));
console.log("Profile widgets generated successfully.");
