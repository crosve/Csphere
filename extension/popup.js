import { BACKEND_URL, DEPLOYED } from "./config.dev.js";

/** * ==========================================
 * STATE MANAGEMENT
 * ========================================== */
const BASE_URL = DEPLOYED ? BACKEND_URL : "http://127.0.0.1:8000";
const appContainer = document.getElementById("app");

let activeTab = "bookmark";
let activeTags = [];
let activeFolderId = "default";
let cachedFolders = []; // Store folders here to use across tabs
let recentBookmarksList = [];

let selectedViewFolder = null;
let selectedViewFolderBookmarks = null; //Used to store the selected folder's bookmarks

//Tag selection states
let userTags = [];
let selectedTags = [];

/** * ==========================================
 * INITIALIZATION
 * ========================================== */
async function init() {
  const token = await getAuthToken();
  console.log("current auth token: ", token);
  if (!token || token === undefined) {
    renderLoginView();
    return;
  } else {
    renderMainView();
  }
  // 1. Render the UI frame immediately (User sees the app)
  renderMainView();

  // 2. Fire API calls in the background (Don't 'await' them here)
  // This starts the network requests while the user is looking at the Bookmark tab
  fetchFolders();
  fetchRecentBookmarks();
}

init();

/** * ==========================================
 * API SERVICES
 * ========================================== */
async function getAuthToken() {
  return new Promise((resolve) => {
    browser.storage.local.get(["csphere_user_token"], (res) => {
      resolve(res.csphere_user_token);
    });
  });
}

async function apiRequest(endpoint, method = "GET", body = null) {
  const token = await getAuthToken();
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

/** * ==========================================
 * UI RENDERING (MAIN INTERFACE)
 * ========================================== */
function renderMainView() {
  appContainer.innerHTML = `
    <div class="extension-popup">
      <header class="popup-header">
        <div class="header-left">
          <a href="https://csphere.io/" target="_blank"> 
            <img class="logo" src="images/Csphere-icon-128.png" />
          </a>
        </div>
        <button id="logoutBtn" class="logout-btn">logout</button>
      </header>

      <div class="tab-navigation">
        <button class="tab-btn ${activeTab === "bookmark" ? "active" : ""}" data-tab="bookmark">Bookmark</button>
        <button class="tab-btn ${activeTab === "recent" ? "active" : ""}" data-tab="recent">Recent</button>
        <button class="tab-btn ${activeTab === "folders" ? "active" : ""}" data-tab="folders">Folders</button>
      </div>

      <div class="tab-content">
        <!-- Tab Pannel -->
        <div class="tab-panel ${activeTab === "bookmark" ? "active" : ""}" id="bookmark-panel">
          <div class="scroll-area">
            <div class="notes-container">
              <textarea id="notesTextarea" class="notes-textarea" placeholder="Add any notes here..." maxlength="280"></textarea>
              <div class="character-counter"><span id="charCount">0</span>/280</div>
            </div>

            <div class="section">
              <div class="tag-section">

                <div class="multi-select-container">
                  <label class="section-label">Selected Tags</label>
                  
                  <div id="selectedPills" class="pills-display">
                    <span class="placeholder-text">No tags selected</span>
                  </div>

                  <div class="dropdown-wrapper">
                    <select id="tagsDropdown" class="modern-select">
                      <option value="" disabled selected>Choose a tag...</option>
                   
                    </select>
                    <div class="select-hint">Tags are added as you click them</div>
                  </div>
                </div>
                                
           
              </div>
            </div>

            <div class="section">
              <label class="section-label">Folder</label>
              <select id="folderDropdown" class="folder-select">
                <option value="default">none selected</option>
              </select>
            </div>
          </div>
          
          <div class="action-bar">
            <button id="saveBookmarkBtn" class="primary-button">Bookmark Page</button>
          </div>
        </div>


        <!-- Recent bookmarks pannel-->
        <div class="tab-panel ${activeTab === "recent" ? "active" : ""}" id="recent-panel">
          <div class="scroll-area" id="recentListContainer">
             <div class="empty-state"><p>Loading recent bookmarks...</p></div>
          </div>
        </div>

        <!-- Recent folders pannel -->
        <div class="tab-panel ${activeTab === "folders" ? "active" : ""}" id="folders-panel">
          <div class="scroll-area" id="foldersListContainer">
             <div class="empty-state"><p>Loading folders...</p></div>
          </div>
        </div>
      </div>

      <p class="status-message"></p>
    </div>
  `;

  attachEventListeners();
  loadContextualData();
}

/** * ==========================================
 * LOGIC & EVENTS
 * ========================================== */
function attachEventListeners() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      renderMainView();
    });
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    browser.storage.local.remove("csphere_user_token", () => renderLoginView());
  });

  const textarea = document.getElementById("notesTextarea");
  if (textarea) {
    textarea.addEventListener("input", (e) => {
      document.getElementById("charCount").textContent = e.target.value.length;
    });
  }

  document.getElementById("addTagBtn")?.addEventListener("click", handleAddTag);
  document.getElementById("tagInput")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleAddTag();
  });

  document
    .getElementById("saveBookmarkBtn")
    ?.addEventListener("click", handleSaveBookmark);
}

async function loadContextualData() {
  //Fetch the folder once to improve speed

  if (
    (activeTab === "bookmark" && cachedFolders.length !== 0) ||
    cachedFolders.length === 0
  ) {
    await fetchFolders();
    await fetchUserTags();
  }

  if (!userTags || userTags.length === 0) {
    await fetchUserTags();
  }
  if (activeTab === "recent") {
    await renderRecentBookmarks();
  } else if (activeTab === "folders") {
    renderFoldersList();
  }
}

async function fetchUserTags() {
  try {
    const data = await apiRequest(`/tag`, "GET");
    console.log("data for tags", data);

    // Assuming the backend returns an array of { tag_id: "...", tag_name: "..." }
    userTags = data || [];

    const dropdown = document.getElementById("tagsDropdown");
    if (!dropdown) return;

    // 1. Reset and populate the dropdown
    // We keep the first disabled option as a placeholder
    dropdown.innerHTML = `
      <option value="" disabled selected>Choose a tag...</option>
      ${userTags
        .map(
          (tag) => `
        <option value="${tag.tag_id}">${tag.tag_name}</option>
      `,
        )
        .join("")}
    `;

    dropdown.onchange = (e) => {
      const selectedId = e.target.value;

      // Find the tag object so we have the name for the UI
      const tagObj = userTags.find((t) => t.tag_id === selectedId);

      if (tagObj && !selectedTags.some((t) => t.tag_id === selectedId)) {
        selectedTags.push(tagObj); // Store the whole object {id, name}
        renderPills();
      }

      // Reset dropdown to the placeholder
      dropdown.value = "";
    };
  } catch (error) {
    console.error("Error fetching the user tags: ", error);
  }
}

/** * ==========================================
 * PILL RENDERING
 * ========================================== */
function renderPills() {
  const pillsContainer = document.getElementById("selectedPills");
  if (!pillsContainer) return;

  if (selectedTags.length === 0) {
    pillsContainer.innerHTML = `<span class="placeholder-text">No tags selected</span>`;
    return;
  }

  pillsContainer.innerHTML = selectedTags
    .map(
      (tag) => `
    <div class="tag-pill">
      ${tag.tag_name}
      <span class="remove-pill" data-id="${tag.tag_id}">×</span>
    </div>
  `,
    )
    .join("");

  // Attach removal logic
  pillsContainer.querySelectorAll(".remove-pill").forEach((btn) => {
    btn.onclick = () => {
      const idToRemove = btn.dataset.id;
      selectedTags = selectedTags.filter((t) => t.tag_id !== idToRemove);
      renderPills();
    };
  });
}

async function fetchFolderBookmarks() {
  try {
    console.log("selected folder view data: ", selectedViewFolder);

    //     selectedViewFolder = {
    //   id: card.dataset.folderId,
    //   name: card.dataset.name,
    // };
    const data = await apiRequest(`/folder/${selectedViewFolder.id}`, "GET");
    console.log(`data from folder id ${selectedViewFolder.id}`, data);

    if (data) {
      selectedViewFolderBookmarks = data;
    } else {
      selectedViewFolder = null;
    }
  } catch (err) {
    console.log(
      "error occured trying to fetch the bookmarks for a folder",
      err,
    );
  }
}

async function fetchRecentBookmarks() {
  try {
    const data = await apiRequest("/content/recent", "POST");
    console.log("recent bookmark list: ", data);
    recentBookmarksList = data;
  } catch (err) {
    console.log("failed to fetch the folder data: ", err);
  }
}

async function fetchFolders() {
  try {
    const response = await apiRequest("/folder");
    cachedFolders = response.data || [];

    // Update dropdown if we are on the bookmark tab
    const dropdown = document.getElementById("folderDropdown");
    if (dropdown) {
      dropdown.innerHTML = `<option value="default">none selected</option>`;
      cachedFolders.forEach((f) => {
        const opt = document.createElement("option");
        opt.value = f.folderId;
        opt.textContent = f.folderName;
        dropdown.appendChild(opt);
      });
      dropdown.value = activeFolderId;
      dropdown.addEventListener(
        "change",
        (e) => (activeFolderId = e.target.value),
      );
    }
  } catch (err) {
    console.error("Folder fetch error:", err);
  }
}

function renderFoldersList() {
  const container = document.getElementById("foldersListContainer");
  if (!container) return;

  // If a folder is selected, show the "Inside Folder" view (Placeholder)
  if (selectedViewFolder) {
    renderFolderDetailView(container);
    return;
  }

  if (cachedFolders.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No folders found.</p></div>`;
    return;
  }

  // Modern Grid UI
  container.innerHTML = `
    <div class="folders-grid">
      ${cachedFolders
        .map(
          (folder) => `
        <div class="folder-card" data-id="${folder.folderId}" data-name="${folder.folderName}">
          <div class="folder-card-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#4A90E2">
              <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path>
            </svg>
          </div>
          <div class="folder-card-info">
            <span class="folder-card-name">${folder.folderName}</span>
            <span class="folder-card-count">${folder.fileCount || 0} bookmarks</span>
          </div>
          <div class="folder-card-date">Created ${new Date(folder.createdAt).toLocaleDateString()}</div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;

  // Attach click listeners to cards
  container.querySelectorAll(".folder-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectedViewFolder = {
        id: card.dataset.id,
        name: card.dataset.name,
      };
      renderFoldersList(); // Re-render to show detail view
    });
  });
}

/** * ==========================================
 * FOLDER DETAIL VIEW (PLACEHOLDER)
 * ========================================== */
async function renderFolderDetailView(container) {
  await fetchFolderBookmarks();

  if (selectedViewFolderBookmarks === null) {
    container.innerHTML = `
    <div class="folder-detail-view">
          <div class="folder-detail-header">
        <button id="backToFolders" class="back-btn">← Back</button>
        <h3>${selectedViewFolder.name}</h3>
      </div>
        <h1>No bookmarks found for this folder</h1>
    </div>
  `;
    return;
  }

  container.innerHTML = `

  <div>

     <div class="folder-detail-header">
        <button id="backToFolders" class="back-btn">← Back</button>
        <h3>${selectedViewFolder.name}</h3>
      </div>

      <div class="selected-folder-bookmark-container">
      ${selectedViewFolderBookmarks
        .map(
          (b) => `
   
      <div class="bookmark-card">
   
        <div class="bookmark-header">
          <h4 class="bookmark-title">${b.title || "Untitled"}</h4>
          <span class="bookmark-date">${new Date(b.created_at || b.first_saved_at).toLocaleDateString()}</span>
        </div>
        <a href="${b.url}" target="_blank" class="bookmark-url">visit</a>
        <div class="bookmark-tags">
          ${(b.tags || []).map((t) => `<span class="bookmark-tag">${t}</span>`).join("")}
        </div>
      </div>
    `,
        )
        .join("")}

      </div>

  </div> 
  
  `;

  document.getElementById("backToFolders").addEventListener("click", () => {
    selectedViewFolder = null;
    selectedViewFolderBookmarks = null;
    renderFoldersList();
  });
}

async function renderRecentBookmarks() {
  const container = document.getElementById("recentListContainer");
  if (!container) return;

  try {
    if (recentBookmarksList.length === 0) {
      recentBookmarksList = await apiRequest("/content/recent", "POST");
      //if it's still equal to 0
      if (recentBookmarksList.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>No recent bookmarks</p></div>`;
        return;
      }
    }

    container.innerHTML = recentBookmarksList
      .map(
        (b) => `
      <div class="bookmark-card">
        <div class="bookmark-header">
          <h4 class="bookmark-title">${b.title || "Untitled"}</h4>
          <span class="bookmark-date">${new Date(b.created_at || b.first_saved_at).toLocaleDateString()}</span>
        </div>
        <a href="${b.url}" target="_blank" class="bookmark-url">visit</a>
        <div class="bookmark-tags">
          ${(b.tags || []).map((t) => `<span class="bookmark-tag">${t}</span>`).join("")}
        </div>
        <p id="bookmark-card-folder-card">${b.folder !== "none" || b.folder !== "undefined" ? b.folder : ""} </p>
      </div>
    `,
      )
      .join("");
  } catch (err) {
    container.innerHTML = `<p class="error">Failed to load bookmarks.</p>`;
  }
}

async function handleSaveBookmark() {
  const btn = document.getElementById("saveBookmarkBtn");
  btn.disabled = true;

  try {
    const { html, tab } = await extractHTMLFromPage();
    console.log("got the html extraction");
    const payload = {
      url: tab.url,
      title: tab.title,
      notes: document.getElementById("notesTextarea").value,
      html: html,
      tags: selectedTags,
      folder_id: activeFolderId !== "default" ? activeFolderId : null,
    };

    console.log("sending request over", payload);
    const res = await apiRequest("/content/save", "POST", payload);
    if (res.status === "Success") {
      showStatus("Saved!", "success");
      resetBookmarkForm();
    }
  } catch (err) {
    showStatus("Save failed", "error");
  } finally {
    btn.disabled = false;
  }
}

/** * ==========================================
 * HELPERS & LOGIN
 * ========================================== */
function handleAddTag() {
  const input = document.getElementById("tagInput");
  const val = input.value.trim();
  if (val && !activeTags.includes(val)) {
    activeTags.push(val);
    input.value = "";
    renderTags();
  }
}

function renderTags() {
  const container = document.getElementById("tagsContainer");
  if (!container) return;
  container.innerHTML = activeTags
    .map(
      (t) => `
    <span class="tag">${t}<button class="tag-remove" data-tag="${t}">×</button></span>
  `,
    )
    .join("");

  container.querySelectorAll(".tag-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTags = activeTags.filter((t) => t !== btn.dataset.tag);
      renderTags();
    });
  });
}

function showStatus(msg, type) {
  const el = document.querySelector(".status-message");
  if (!el) return;
  el.textContent = msg;
  el.style.color = type === "error" ? "#ff4d4d" : "#2ecc71";
  setTimeout(() => (el.textContent = ""), 4000);
}

function resetBookmarkForm() {
  activeTags = [];
  activeFolderId = "default";
  const textarea = document.getElementById("notesTextarea");
  if (textarea) textarea.value = "";
  renderTags();
}

async function extractHTMLFromPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.documentElement.outerHTML,
  });

  return { html: result, tab };
}

function renderLoginView() {
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
      const LOGIN_URL = `${BASE_URL}/user/browser/login`;
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
          renderMainView();
        });
      }
    } catch (error) {
      console.log("error logging in: ", error);
    }
  });

  document.getElementById("googleAuthBtn").addEventListener("click", () => {
    browser.identity.launchWebAuthFlow(
      {
        url: `${BASE_URL}/auth/google`,
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
        fetch(`${BASE_URL}/auth/google/callback`, {
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
            browser.storage.local.set(
              { csphere_user_token: data.token },
              () => {
                renderMainView();
              },
            );
          })
          .catch((err) => {
            console.error("Error fetching token from backend", err);
          });
      },
    );
  });
}
