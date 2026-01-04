<h1 align="center">Csphere</h1>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/csphere/naacmldkjnlfmhnkbbpppjpmdoiednnn">
    <img
      src="https://img.shields.io/badge/Chrome-Install-blue?logo=googlechrome"
      alt="Install Csphere on Chrome"
    />
  </a>
  &nbsp;&nbsp;
  <a href="https://addons.mozilla.org/en-US/firefox/addon/csphere">
    <img
      src="https://img.shields.io/badge/Firefox-Install-orange?logo=firefoxbrowser"
      alt="Install Csphere on Firefox"
    />
  </a>
</p>

<hr />

<p>
  Short for “content sphere”,
  <a href="https://www.csphere.io/">Csphere.io</a> is a bookmark management application
  and browser extension that allows users to easily save, search, and organize the
  web content they consume.
</p>

<h2>Features</h2>

<ul>
  <li>Save different forms of web content (e.g. articles, blogs, documentation)</li>
  <li>Add context via notes, descriptions, and custom keyword tags</li>
  <li>Organize content using a custom folder structure managed through Csphere’s backend UI</li>
  <li>
    Semantically search your content by meaning, time saved, or source
    <br />
    <em>(e.g. “Which articles have I read about jet engines this past month?”)</em>
  </li>
  <li>Cross-platform access across browsers and mobile devices</li>
</ul>

<hr />

<h2>Local Setup Guide</h2>

<p>
  <strong>Note:</strong> This project uses
  <a href="https://github.com/astral-sh/uv">uv</a> for Python dependency and virtual
  environment management. All Python commands below assume 
  <code>uv</code> is installed and active.
</p>

<h3>1. Backend (Python + FastAPI)</h3>

<pre><code>cd backend
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv pip install -r requirements.txt
uvicorn app.api.main:app --reload
</code></pre>


<h3>2. Frontend (Next.js)</h3>

<pre><code>cd frontend
npm install
npm run dev
</code></pre>

<h3>3. Chrome Extension (Local)</h3>

<ol>
  <li>Open <code>chrome://extensions</code></li>
  <li>Enable <strong>Developer Mode</strong></li>
  <li>Click <strong>Load Unpacked</strong></li>
  <li>Select the <code>chrome_extension/</code> folder</li>
</ol>

<hr />

<h2>Alembic Setup – Database Migrations</h2>

<h3>1. Install Alembic</h3>

<pre><code>uv pip install alembic</code></pre>

<h3>2. Initialize Alembic</h3>

<pre><code>alembic init</code></pre>

<h3>3. Configure <code>alembic.ini</code></h3>

<p>
  Set <code>sqlalchemy.url</code> to your PostgreSQL connection string.
</p>

<h3>4. Set Target Metadata</h3>

<pre><code>from app.db.base import Base
target_metadata = Base.metadata
</code></pre>

<h3>5. Create a Migration</h3>

<pre><code>alembic revision --autogenerate -m "create users table"</code></pre>

<h3>6. Apply Migration</h3>

<pre><code>alembic upgrade head</code></pre>

<h3>Downgrade</h3>

<pre><code>alembic downgrade -1</code></pre>

<hr />

<h2>Why Csphere?</h2>

<p>
The problem we identified is for someone who parses thousands of pages of web content daily and experiences trouble locating where this content was consumed, be it on a Chrome or Firefox browser. The user possibly has thousands of web pages already saved in their bookmarks folders and are looking for a more intelligent and context-rich search and storage over their content. 
</p>

<p>
Install this if you are tired of having thousands of tabs open on your browser, debating if they should be saved with your important bookmarks or not. With Csphere you centralize and take control over the content you consume while organizing your desktop.
</p>

<h2>FAQ</h2>

<h3>How do I pronounce Csphere?</h3>

<p>
  Csphere is pronounced as "see-sphere".
</p>

<h3>Can I start using Csphere now? </h3>

<p>
  Visit <a href="https://www.csphere.io/">Csphere.io</a> and download the extension to start using Csphere.
</p>

<h3>Is Csphere free?</h3>

<p>
  Yes, Csphere is 100% free to use.
</p>

