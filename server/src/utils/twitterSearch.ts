export interface TwitterProfile {
  username: string;
  profileUrl: string;
  found: boolean;
}

export async function searchTwitterProfile(
  username: string,
): Promise<TwitterProfile> {
  const cleaned = username.replace(/^@/, "");
  const profileUrl = `https://x.com/${cleaned}`;

  try {
    const res = await fetch(profileUrl, {
      method: "HEAD",
      redirect: "follow",
    });

    return {
      username: cleaned,
      profileUrl,
      found: res.ok,
    };
  } catch {
    return {
      username: cleaned,
      profileUrl,
      found: false,
    };
  }
}
