import { NextResponse } from 'next/server';

export async function GET() {
  const username = 'nilesh_sree';
  const query = `query getUserStats($username: String!) {
    matchedUser(username: $username) {
      submitStats { acSubmissionNum { difficulty count } }
      userCalendar { streak totalActiveDays }
      profile { ranking reputation }
    }
    allQuestionsCount { difficulty count }
  }`;

  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ query, variables: { username } }),
      next: { revalidate: 3600 }, // Cache server-side for 1 hour to optimize performance and prevent rate-limiting
    });

    if (!response.ok) {
      throw new Error(`LeetCode GraphQL API returned status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[LeetCode Proxy] Error querying GraphQL:', err.message);

    // Fallback: Query the public REST proxy on the server
    try {
      const fallbackResponse = await fetch(`https://alfa-leetcode-api.onrender.com/userProfile/${username}`);
      if (fallbackResponse.ok) {
        const profile = await fallbackResponse.json();
        // Map the REST response into the GraphQL structure that the client script expects
        const mappedData = {
          data: {
            matchedUser: {
              submitStats: {
                acSubmissionNum: [
                  { difficulty: 'All', count: profile.totalSolved || 0 },
                  { difficulty: 'Easy', count: profile.easySolved || 0 },
                  { difficulty: 'Medium', count: profile.mediumSolved || 0 },
                  { difficulty: 'Hard', count: profile.hardSolved || 0 }
                ]
              },
              userCalendar: {
                streak: profile.streak || 0
              },
              profile: {
                ranking: profile.ranking || 0
              }
            },
            allQuestionsCount: [
              { difficulty: 'Easy', count: profile.totalEasy || 150 },
              { difficulty: 'Medium', count: profile.totalMedium || 200 },
              { difficulty: 'Hard', count: profile.totalHard || 80 }
            ]
          }
        };
        return NextResponse.json(mappedData);
      }
    } catch (fallbackErr: any) {
      console.error('[LeetCode Proxy] Fallback also failed:', fallbackErr.message);
    }

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
