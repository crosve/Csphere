import { BACKEND_URL, DEPLOYED } from "./config.dev.js";


const backend_url = DEPLOYED ? BACKEND_URL : "http://127.0.0.1:8000";
const app = document.getElementById("app");
let selectedFolder = "default";
let currentTab = "bookmark";
let tags = [];
let recentBookmarks = [];

browser.storage.local.get(["csphere_user_token"], (result) => {
  const token = result.csphere_user_token;
  if (token === null || token === undefined) {
    renderLoginInterface();
  } else {
    renderInterface();
  }
});

/** * ========================= * HTML Extraction Logic * ========================= */
function extractHTMLFromPage() {
  return new Promise(async (resolve) => {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const listener = (request) => {
      if (request.action === "htmlExtracted") {
        browser.runtime.onMessage.removeListener(listener);
        resolve({ html: request.html, tab });
      }
    };
    browser.runtime.onMessage.addListener(listener);
    utils.executeContentScript(tab.id, "content.js");
  });
}

/** * ========================= * Render Interfaces * ========================= */
function renderInterface() {
  app.innerHTML = `
    <div class="extension-popup">
      <!-- Header -->
      <header class="popup-header">
        <div class="header-left" >
        <a href = "https://csphere.io/"  target="_blank"> 
          <img class="logo" src="images/Csphere-icon-128.png" />
        </a>
        </div>
        <button class="logout-btn">logout</button>
      </header>

      <!-- Navigation Tabs -->
      <div class="tab-navigation">
        <button class="tab-btn ${currentTab === "bookmark" ? "active" : ""
    }" data-tab="bookmark">
          Bookmark
        </button>
        <button class="tab-btn ${currentTab === "recent" ? "active" : ""
    }" data-tab="recent">
          Recent
        </button>
        <button class="tab-btn ${currentTab === "folders" ? "active" : ""
    }" data-tab="folders">
          Folders
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Bookmark Tab -->
        <div class="tab-panel ${currentTab === "bookmark" ? "active" : ""
    }" id="bookmark-panel">
          <div class="scroll-area">
            <!-- Notes Section -->
            <div class="notes-container">
              <textarea id="notesTextarea" class="notes-textarea" placeholder="Add any notes here..." maxlength="280"></textarea>
              <div class="character-counter"><span id="charCount">0</span>/280</div>
            </div>

            <!-- Tags Section -->
            <div class="section">
              <label class="section-label">Tags</label>
              <div class="tags-container" id="tagsContainer"></div>
              <div class="tag-input-container">
                <input type="text" id="tagInput" class="tag-input" placeholder="Add tag..." />
                <button id="addTagBtn" class="add-tag-btn">+</button>
              </div>
            </div>

            <!-- Folders Section -->
            <div class="section">
              <label class="section-label">Folders</label>
              <div class="user-folders">
                <select class="folder-select">
                  <option value="default">none selected</option>

                
                </select>
              </div>
            </div>
          </div>
          
          <div class="action-bar">
            <button id="bookMarkBtn" class="primary-button">Bookmark Page</button>
          </div>
        </div>

        <!-- Recent Tab -->
        <div class="tab-panel ${currentTab === "recent" ? "active" : ""
    }" id="recent-panel">
          <div class="scroll-area" id="recentBookmarks">
            <div class="empty-state">
              <div class="empty-icon">📚</div>
              <p>No recent bookmarks</p>
              <span>Your recently saved bookmarks will appear here</span>
            </div>
          </div>
        </div>

        <!-- Folders Tab -->
        <div class="tab-panel ${currentTab === "folders" ? "active" : ""
    }" id="folders-panel">
          <div class="scroll-area" id="foldersView">
            <div class="empty-state">
              <div class="empty-icon">📁</div>
              <p>Loading folders...</p>
            </div>
          </div>
        </div>
      </div>

      <p class="message-p"></p>
    </div>
  `;

  setupTabNavigation();
  setupTagSystem();
  getRecentFolders();
  loadRecentBookmarks();
  setupBookmarkHandler();
  setupCharacterCounter();
}

function renderLoginInterface() {
  app.innerHTML = `
    <header class="login_header">
      <a href = "https://csphere.io/"  target="_blank"> 
        <img class="logo" src="images/Csphere-icon-128.png" />
      </a>
    </header>
    <div class="login-message">
      <p>Please log in to use Csphere bookmarks</p>
      <form id="loginForm" class="login-form">
        <input type="text" id="username" placeholder="Username" required />
        <input type="password" id="password" placeholder="Password" required />
        <button type="submit" class="primary-button">Log In</button>
      </form>
      <div class="divider">OR</div>
      <button id="googleAuthBtn" class="google-button">
        <img src="images/google.svg" class="google-icon" />
        Continue with Google
      </button>
      <p class="message-p"></p>
    </div>
  `;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    try {
      const LOGIN_URL = `${backend_url}/user/browser/login`;
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data?.detail?.trim() === "Incorrect password") {
        insertMessage("Incorrect password", "error");
        return;
      }
      if (data?.detail?.trim() === "User not found") {
        insertMessage("User not found", "error");
        return;
      }
      if (data?.detail?.trim() === "sucessful login") {
        browser.storage.local.set({ csphere_user_token: data.token }, () => {
          renderInterface();
        });
      }
    } catch (error) {
      console.log("error logging in: ", error);
    }
  });

  document.getElementById("googleAuthBtn").addEventListener("click", () => {
    browser.identity.launchWebAuthFlow(
      {
        url: `${backend_url}/auth/google`,
        interactive: true,
      },
      (redirectUrl) => {
        if (browser.runtime.lastError || !redirectUrl) {
          console.error("Google login failed", browser.runtime.lastError);
          return;
        }
        const url = new URL(redirectUrl);
        const code = url.searchParams.get("code");
        if (!code) {
          console.error("Token missing from redirect");
          return;
        }
        fetch(`${backend_url}/auth/google/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (!data.token) {
              console.error("Token missing from backend response");
              return;
            }
            browser.storage.local.set({ csphere_user_token: data.token }, () => {
              renderInterface();
            });
          })
          .catch((err) => {
            console.error("Error fetching token from backend", err);
          });
      }
    );
  });
}

/** * ========================= * New UI Functions * ========================= */
function setupTabNavigation() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;

      // Update active states
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(`${targetTab}-panel`).classList.add("active");

      currentTab = targetTab;

      // Load content for specific tabs
      if (targetTab === "folders") {
        loadFoldersView();
      }
    });
  });
}

function setupTagSystem() {
  const tagInput = document.getElementById("tagInput");
  const addTagBtn = document.getElementById("addTagBtn");

  const addTag = () => {
    const tagValue = tagInput.value.trim();
    if (tagValue && !tags.includes(tagValue)) {
      tags.push(tagValue);
      tagInput.value = "";
      renderTags();
    }
  };

  addTagBtn.addEventListener("click", addTag);
  tagInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addTag();
    }
  });
}

function renderTags() {
  const container = document.getElementById("tagsContainer");
  container.innerHTML = tags
    .map(
      (tag) => `
    <span class="tag">
      ${tag}
      <button class="tag-remove" onclick="removeTag('${tag}')">×</button>
    </span>
  `
    )
    .join("");
}

function removeTag(tagToRemove) {
  tags = tags.filter((tag) => tag !== tagToRemove);
  renderTags();
}

function setupCharacterCounter() {
  const textarea = document.getElementById("notesTextarea");
  const charCount = document.getElementById("charCount");

  textarea.addEventListener("input", () => {
    charCount.textContent = textarea.value.length;
  });
}

async function loadRecentBookmarks() {
  try {
    const token = await fetchToken();
    console.log("token from loading recent: ", token);
    const response = await fetch(`${backend_url}/content/recent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("data for recent bookmarks: ", data);
      recentBookmarks = data || [];
      renderRecentBookmarks();
    }
  } catch (error) {
    console.log("Error loading recent bookmarks:", error);
  }
}

function renderRecentBookmarks() {
  const container = document.getElementById("recentBookmarks");

  if (recentBookmarks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <p>No recent bookmarks</p>
        <span>Your recently saved bookmarks will appear here</span>
      </div>
    `;
    return;
  }

  container.innerHTML = recentBookmarks
    .map(
      (bookmark) => `
    <div class="bookmark-card">
      <div class="bookmark-header">
        <h4 class="bookmark-title">${bookmark.title || "Untitled"}</h4>
        <span class="bookmark-date">${formatDate(
        bookmark.first_saved_at || bookmark.created_at
      )}</span>
      </div>
      <a href="${bookmark.url}" target="_blank" class="bookmark-url">visit</a>
      <div class="bookmark-footer">
        ${bookmark.ai_summary
          ? `<div class="bookmark-summary">${bookmark.ai_summary}</div>`
          : ""
        }
        <div class="bookmark-meta">
          <div class="bookmark-tags">
            ${(bookmark.tags || [])
          .map((tag) => `<span class="bookmark-tag">${tag}</span>`)
          .join("")}
          </div>
          ${bookmark.folder
          ? `<span class="bookmark-folder">${bookmark.folder}</span>`
          : ""
        }
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

function loadFoldersView() {
  // This will use the existing folder data loaded by getRecentFolders()
  const container = document.getElementById("foldersView");
  // Implementation depends on your folder structure
  container.innerHTML = `
    <div class="folders-list">
      <p>Folder management coming soon...</p>
    </div>
  `;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "Today";
  if (diffDays === 2) return "Yesterday";
  if (diffDays <= 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

/** * ========================= * Existing Utility Functions * ========================= */
function getNotes() {
  const textarea = document.getElementById("notesTextarea");
  return textarea.value;
}

function insertMessage(message, type) {
  const message_p = document.querySelector(".message-p");
  if (!message_p) return;
  message_p.textContent = message;
  message_p.style.color = type === "error" ? "red" : "green";
  setTimeout(() => {
    message_p.textContent = "";
    message_p.style.color = "";
  }, 5000);
}

function fetchToken() {
  return new Promise((resolve) => {
    browser.storage.local.get(["csphere_user_token"], (result) => {
      resolve(result.csphere_user_token);
    });
  });
}

async function getRecentFolders() {
  try {
    const API_URL = `${backend_url}/folder`;
    const token = await fetchToken();
    console.log("token fecthed: ", token);
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    console.log("folder data: ", data);
    const folders = data.data;
    const folderContainer = document.querySelector(".user-folders");
    folderContainer.innerHTML = `<select class="folder-select"></select>`;
    const folderGrid = folderContainer.querySelector(".folder-select");

    // Default option
    const folderOption = document.createElement("option");
    folderOption.textContent = "none selected";
    folderOption.value = "default";
    folderGrid.appendChild(folderOption);

    folders.forEach((folder) => {
      const option = document.createElement("option");
      option.textContent = folder.folderName;
      option.value = folder.folderId;
      folderGrid.appendChild(option);
    });

    folderGrid.addEventListener("change", (event) => {
      selectedFolder = event.target.value;
    });
  } catch (error) {
    console.log(error);
  }
}

function logout() {
  browser.storage.local.remove("csphere_user_token", () => {
    console.log("csphere_user_token removed from local storage");
  });
}

/** * ========================= * Enhanced Bookmark Handler * ========================= */
function setupBookmarkHandler() {
  const btn = document.getElementById("bookMarkBtn");
  const logoutBtn = document.getElementsByClassName("logout-btn")[0];

  if (!btn) return;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    try {
      const { html, tab } = await extractHTMLFromPage();
      console.log("Extracted HTML:", html);
      const notes = getNotes();
      const token = await fetchToken();

      const tabData = {
        url: tab.url,
        title: tab.title,
        notes: notes,
        html: html,
        tags: tags, // Include tags in the bookmark data
      };

      if (selectedFolder !== "default") {
        tabData.folder_id = selectedFolder;
      }

      const endpoint = `${backend_url}/content/save`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tabData),
      });

      const data = await response.json();
      if (data.status !== "Success") {
        throw new Error(`Server returned error: ${data.status}`);
      }

      insertMessage("Bookmark successfully saved", "success");

      // Clear form after successful save
      document.getElementById("notesTextarea").value = "";
      document.getElementById("charCount").textContent = "0";
      tags = [];
      renderTags();
      selectedFolder = "default";
      document.querySelector(".folder-select").value = "default";

      // Refresh recent bookmarks
      loadRecentBookmarks();
    } catch (err) {
      console.error(err);
      insertMessage("Failed to save bookmark", "error");
    } finally {
      btn.disabled = false;
    }
  });

  logoutBtn.addEventListener("click", () => {
    logout();
    renderLoginInterface();
  });
}

// Make removeTag available globally
window.removeTag = removeTag;
