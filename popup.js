document.getElementById("searchBtn").addEventListener("click", async () => {
  const query = document.getElementById("topic").value.trim();
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "🔍 Searching...";

  if (!query) {
    resultsDiv.innerHTML = " Please enter a topic!";
    return;
  }

  const apiKey = ""; // apna API key

  try {
    // STEP 1: Search for videos
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
      )}&type=video&maxResults=5&key=${apiKey}`
    );
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      resultsDiv.innerHTML = " No videos found!";
      return;
    }

    let videoResults = []; 
    let bestVideo = null;

    // STEP 2: Loop through each video and fetch comments
    for (let video of searchData.items) {
      const videoId = video.id.videoId;
      const videoTitle = video.snippet.title;
      const videoLink = `https://www.youtube.com/watch?v=${videoId}`;
      const channelTitle = video.snippet.channelTitle;

      let score = 0;

      try {
        const commentRes = await fetch(
          `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&key=${apiKey}`
        );
        const commentData = await commentRes.json();

        if (commentData.items) {
          for (let comment of commentData.items) {
            const text = comment.snippet.topLevelComment.snippet.textDisplay.toLowerCase();

            // Simple sentiment check
            if (
              text.includes("good") ||
              text.includes("nice") ||
              text.includes("love") ||
              text.includes("helpful") ||
              text.includes("great") ||
              text.includes("excellent")
            ) {
              score += 2;
            } else if (
              text.includes("bad") ||
              text.includes("worst") ||
              text.includes("hate") ||
              text.includes("boring") ||
              text.includes("useless")
            ) {
              score -= 2;
            }
          }
        }
      } catch (err) {
        console.error("Error fetching comments:", err);
      }

      // Save video result
      videoResults.push({ videoId, videoTitle, videoLink, channelTitle, score });

      // Track best video
      if (!bestVideo || score > bestVideo.score) {
        bestVideo = { videoId, videoTitle, videoLink, score };
      }
    }

    // STEP 3: Show results
    resultsDiv.innerHTML = "<h3>📹 Related Videos</h3>";
    videoResults.forEach((v) => {
      const div = document.createElement("div");
      div.innerHTML = `
        🎬 <a href="${v.videoLink}" target="_blank">${v.videoTitle}</a> <br>
        📺 Channel: ${v.channelTitle} <br>
        ⭐ Score: ${v.score}
      `;
      resultsDiv.appendChild(div);
    });

    // STEP 4: Best Suggested Video
    if (bestVideo) {
      const bestDiv = document.createElement("div");
      bestDiv.innerHTML = `
        <hr>
        <h3>🌟 Best Suggested Video</h3>
        🎬 <a href="${bestVideo.videoLink}" target="_blank">${bestVideo.videoTitle}</a> <br>
        ⭐ Score: ${bestVideo.score}
      `;
      resultsDiv.appendChild(bestDiv);
    }

    // STEP 5: Notes Link (Google Search)
    const notesDiv = document.createElement("div");
    notesDiv.innerHTML = `
      <hr>
      <h3>📘 Best Study Notes</h3>
      <a href="https://www.google.com/search?q=${encodeURIComponent(query)}+best+study+notes" target="_blank">
        Click here to view best notes 🔗
      </a>
    `;
    resultsDiv.appendChild(notesDiv);

  } catch (error) {
    console.error(error);
    resultsDiv.innerHTML = "⚠️ Error fetching data!";
  }
});
