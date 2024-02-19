document.addEventListener("DOMContentLoaded", () => {
  console.log("Page Loaded");
});
function getRepos() {
  const apiUrl = "https://api.github.com/users/SequoyahGeber/repos";
  const accessToken = "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";

  fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error("Error fetching data from GitHub API:", error);
    });
}
