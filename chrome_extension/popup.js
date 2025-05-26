import { BACKEND_URL, FRONTEND_URL, DEPLOYED } from "./config.dev.js";
const backend_url = DEPLOYED ? BACKEND_URL : "http://127.0.0.1:8000";
const frontend_url = DEPLOYED ? FRONTEND_URL : "http://localhost:3000";

let userEmail = "";

//Get user permission to get email
chrome.identity.getProfileUserInfo({ accountStatus: "ANY" }, (userInfo) => {
  userEmail = userInfo.email;
});

function insertMessage(message, messageType) {
  const parent = document.querySelector("app");
  const message_p = document.querySelector(".message-p");
  const submit_button = document.querySelector(".action-bar");
  const loading_div = document.createElement("div");

  submit_button.disabled = true;
  loading_div.className = "loading-icon";
  if (!message_p) return;

  message_p.textContent = message;
  message_p.style.color = messageType === "error" ? "red" : "green";

  parent.appendChild(loading_div);

  setTimeout(() => {
    message_p.textContent = "";
    message_p.style.color = "";
    submit_button.disabled = false;
    loading_div.remove();
  }, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("bookMarkBtn");
  console.log("Popup script loaded and running...");
  console.log("Button element: ", btn);

  if (btn) {
    // Make the main event listener async
    btn.addEventListener("click", async () => {
      try {
        // Use try...catch for async operations
        let [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab || !tab.url) {
          console.warn("No active tab found or tab has no URL.");
          return;
        }

        console.log("Attempting to get cookie for URL:", frontend_url);

        if (userEmail) {
          console.log("Retrieved token from cookie:", userEmail);
          console.log("Proceeding with fetch using token:", userEmail);
          const endpoint = `${backend_url}/content/save`;
          const response = await fetch(endpoint, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              // Authorization: `Bearer ${cookieVal}`,
            },
            body: JSON.stringify({
              url: tab.url,
              title: tab.title,
              source: "chrome_extension",
              email: userEmail,
            }),
          });

          console.log("Raw response from server: ", response);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log("Response data from server: ", data);

          insertMessage("Bookmark succesfullysaved");
        } else {
          console.warn("Token cookie not found or has no value.");
          alert("Could not find authentication token. Please log in.");
        }
      } catch (error) {
        insertMessage("An error occured, please try again later");
        // Display a user-friendly error message if needed
        alert(`An error occurred: ${error.message}`);
      }
    });
  } else {
    console.error("Button with ID 'bookMarkBtn' not found.");
  }
});
