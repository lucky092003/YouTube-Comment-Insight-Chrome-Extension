// Your API key from Google Developer Console
const API_KEY = ""; // write your api key 

// Listener for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("YouTube Comment Insight Extension Installed");
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "search") {
    const query = request.query;

    // YouTube Data API endpoint (video search)
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
      query
    )}&key=${API_KEY}&maxResults=5`;

    fetch(url)
      .then((response) => response.json())
      .then(async (data) => {
        if (!data.items) {
          sendResponse({ success: false, error: "No results" });
          return;
        }

        let channelScores = {};

        // ✅ For each video, fetch comments
        for (let item of data.items) {
          const videoId = item.id.videoId;
          const channelId = item.snippet.channelId;
          const channelTitle = item.snippet.channelTitle;

          try {
            const commentUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${API_KEY}&maxResults=50`;
            const commentRes = await fetch(commentUrl);
            const commentData = await commentRes.json();

            if (commentData.items) {
              let score = 0;

              // ✅ Simple sentiment: +1 for positive words, -1 for negative
              commentData.items.forEach((c) => {
                const text =
                  c.snippet.topLevelComment.snippet.textDisplay.toLowerCase();
                if (
                  text.includes("good") ||
                  text.includes("helpful") ||
                  text.includes("great") ||
                  text.includes("excellent")
                )
                  score += 1;
                if (
                  text.includes("bad") ||
                  text.includes("worst") ||
                  text.includes("poor") ||
                  text.includes("useless")
                )
                  score -= 1;
              });

              if (!channelScores[channelId]) {
                channelScores[channelId] = {
                  title: channelTitle,
                  score: 0,
                  count: 0,
                };
              }
              channelScores[channelId].score += score;
              channelScores[channelId].count += commentData.items.length;
            }
          } catch (err) {
            console.error("Error fetching comments:", err);
          }
        }

        // ✅ Rank channels by score
        const rankedChannels = Object.entries(channelScores)
          .map(([id, obj]) => ({
            id,
            title: obj.title,
            avgScore: obj.score / (obj.count || 1),
          }))
          .sort((a, b) => b.avgScore - a.avgScore)
          .slice(0, 5);

        sendResponse({ success: true, channels: rankedChannels });
      })
      .catch((error) => {
        console.error("Error fetching YouTube data:", error);
        sendResponse({ success: false, error: error });
      });

    // Required for async sendResponse
    return true;
  }
});
