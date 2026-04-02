let RSS_FEEDS = [
    { name: "The Hacker News", url: "https://thehackernews.com/rss.xml" },
    { name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/" },
    { name: "Dark Reading", url: "https://www.darkreading.com/rss.xml" }
];

function saveSources() {
    localStorage.setItem('rssFeeds', JSON.stringify(RSS_FEEDS));
}

function loadSources() {
    const saved = localStorage.getItem('rssFeeds');
    if (saved) {
        RSS_FEEDS = JSON.parse(saved);
    }
}

const RSS_TO_JSON = "https://api.rss2json.com/v1/api.json?rss_url=";

const newsList = document.getElementById("news");
const loading = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");
const articleCount = document.getElementById("articleCount");
const sourceCount = document.getElementById("sourceCount");
const lastUpdated = document.getElementById("lastUpdated");
const sourceStrip = document.getElementById("sourceStrip");

let allNews = [];

function renderSources() {
    sourceCount.textContent = RSS_FEEDS.length;
    sourceStrip.innerHTML = "";

    RSS_FEEDS.forEach((feed, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "source-item";
        
        const link = document.createElement("a");
        link.href = feed.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "source-tag-link";
        link.innerHTML = `
            <div class="source-tag">
                <i class="bi bi-rss-fill"></i>
                <span>${feed.name}</span>
            </div>
        `;
        
        const removeBtn = document.createElement("button");
        removeBtn.className = "source-remove";
        removeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (confirm(`Remove "${feed.name}"?`)) {
                RSS_FEEDS.splice(index, 1);
                saveSources();
                renderSources();
                loadNews();
            }
        };
        
        wrapper.appendChild(link);
        wrapper.appendChild(removeBtn);
        sourceStrip.appendChild(wrapper);
    });
}

function updateStats(newsArray = allNews) {
    articleCount.textContent = newsArray.length;
    lastUpdated.textContent = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

async function loadNews() {
    loading.classList.remove("d-none");
    loading.innerHTML = `<span class="loader-dot"></span> Fetching latest threat intelligence...`;
    emptyState.classList.add("d-none");
    newsList.innerHTML = "";
    allNews = [];

    try {
        for (const feed of RSS_FEEDS) {
            const response = await fetch(RSS_TO_JSON + encodeURIComponent(feed.url));
            const data = await response.json();

            if (!data.items) continue;

            const articles = data.items.map((item) => ({
                title: item.title,
                link: item.link,
                date: new Date(item.pubDate),
                source: feed.name
            }));

            allNews = allNews.concat(articles);
        }

        allNews.sort((a, b) => b.date - a.date);

        loading.classList.add("d-none");
        updateStats(allNews);
        displayNews(allNews.slice(0, 20));
    } catch (error) {
        loading.classList.remove("d-none");
        loading.innerHTML = `<span class="loader-dot"></span> Failed to load news. Please try again.`;
        console.error(error);
    }
}

function displayNews(newsArray) {
    newsList.innerHTML = "";

    if (newsArray.length === 0) {
        emptyState.classList.remove("d-none");
        articleCount.textContent = "0";
        return;
    }

    emptyState.classList.add("d-none");
    articleCount.textContent = newsArray.length;

    newsArray.forEach((article, index) => {
        const col = document.createElement("article");
        col.className = "col-12 col-md-6 col-xl-4";

        col.innerHTML = `
            <div class="news-card" style="animation-delay:${Math.min(index * 0.06, 0.5)}s">
                <span class="news-badge">
                    <i class="bi bi-shield-shaded"></i>
                    ${article.source}
                </span>
                <a class="news-link" href="${article.link}" target="_blank" rel="noopener noreferrer">
                    <h3>${article.title}</h3>
                    <div class="meta-line">
                        <span><i class="bi bi-calendar3"></i>${article.date.toLocaleDateString()}</span>
                        <span><i class="bi bi-clock-history"></i>${article.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div class="read-more">
                        Open article
                        <i class="bi bi-arrow-up-right"></i>
                    </div>
                </a>
            </div>
        `;

        newsList.appendChild(col);
    });
}

function filterNews() {
    const startValue = document.getElementById("startDate").value;
    const endValue = document.getElementById("endDate").value;

    if (!startValue || !endValue) {
        alert("Please select both dates.");
        return;
    }

    const startDate = new Date(startValue);
    const endDate = new Date(endValue);
    endDate.setHours(23, 59, 59, 999);

    const filtered = allNews.filter((article) => article.date >= startDate && article.date <= endDate);
    displayNews(filtered);
}

function resetFilter() {
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    displayNews(allNews.slice(0, 20));
    updateStats(allNews);
}

function addNewSource() {
    const name = document.getElementById("newSourceName").value.trim();
    const url = document.getElementById("newSourceUrl").value.trim();

    if (!name || !url) {
        alert("Please enter both source name and RSS URL.");
        return;
    }

    const normalizedUrl = normalizeUrl(url);
    const alreadyExists = RSS_FEEDS.some((feed) => normalizeUrl(feed.url) === normalizedUrl);
    if (alreadyExists) {
        alert("This RSS source link already exists!");
        document.getElementById("newSourceUrl").value = "";
        return;
    }

    RSS_FEEDS.push({ name, url });
    saveSources();

    document.getElementById("newSourceName").value = "";
    document.getElementById("newSourceUrl").value = "";

    renderSources();
    alert("New source added successfully!");
    loadNews();
}

loadSources();
renderSources();
loadNews();

document.getElementById("searchInput").addEventListener("input", function() {
    const query = this.value.toLowerCase().trim();
    if (!query) {
        displayNews(allNews.slice(0, 20));
        return;
    }
    
    const filtered = allNews.filter(article => 
        article.title.toLowerCase().includes(query)
    );
    displayNews(filtered);
});

function normalizeUrl(url) {
    if (!url) return '';
    return url
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/+$/, "")
        .replace(/\?.*$/, "");
}


