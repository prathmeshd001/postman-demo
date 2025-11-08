# Postman + Newman User Manual (STQM Demo)

**Repo:** `prathmeshd001/postman-demo`  
**Audience:** Beginners  
**Goal:** Reproduce the in-class demo end-to-end — first learn the Postman app with a cloud/public API (no local setup), then run a local API, test it with Postman, automate with Newman, generate an HTML report, and run the same in CI/CD (GitHub Actions).

**Files in the repo:** `.github/workflows/`, `Demo.postman_collection.json`, `demoenv.postman_environment.json`, `package.json`, `server.js`, `user_manual.MD` (root).

---

## 0) Postman App — Setup & Quick Demo (before local testing)

> Use this section if you’ve never used Postman. You’ll test a **public API** first so you can learn the UI with zero local setup.

### 0.1 Install & launch Postman Desktop

1. Download **Postman Desktop** for your OS and install.
2. Launch the app. You can **Sign in** (optional) or **Use without account**.
3. Create a **Workspace** (e.g., `STQM Demo`). Personal is fine.

### 0.2 Understand the UI (60 seconds)

-   **Collections** (left pane): organize requests + shared scripts.
-   **Environments** (top-right): variable sets (e.g., `{{baseUrl}}`).
-   **Tabs** (center): Request builder (Params, Headers, Body, Tests).
-   **Test Results**: appears under the response panel after you send.
-   **Runner**: run a whole collection; shows pass/fail + basic performance.
-   **Console** (View → Show Postman Console): debug logs, `console.log()`.

### 0.3 Create a minimal collection & environment (public API)

We’ll use a public API so nothing else is required:

-   Choose either:
    -   **Postman Echo**: `https://postman-echo.com/get?foo=bar`
    -   **DummyJSON**: `https://dummyjson.com/products?limit=5`

Steps:

1. **New → Collection** → name it **“Hello Postman”**.
2. **New → Environment** → name it **“public”** and add one variable:
    - Key: `baseUrl`
    - Initial & Current value: choose one:
        - `https://postman-echo.com` **or** `https://dummyjson.com`
3. Select **“public”** as the **active environment** (top-right).
4. In the **Hello Postman** collection, create a **GET** request named **“Ping”** with URL:
    - `{{baseUrl}}/get?foo=bar` (for Echo) **or** `{{baseUrl}}/products?limit=5` (for DummyJSON)

### 0.4 Add basic tests (copy/paste into the Tests tab)

```js
pm.test("200 OK", () => pm.response.to.have.status(200));
pm.test("Has JSON content-type", () => {
    pm.response.to.have.header("content-type");
    pm.expect(pm.response.headers.get("content-type")).to.include(
        "application/json"
    );
});

// Save something for chaining (works for both endpoints)
const j = pm.response.json();
const id = j?.args?.foo || j?.products?.[0]?.id;
if (id) pm.environment.set("demoValue", id);
pm.test(
    "Saved demoValue",
    () => pm.expect(pm.environment.get("demoValue")).to.exist
);
```

Click **Send** → see **Test Results** (green checks). Open **Console** to view logs if needed.

### 0.5 Run with Collection Runner & visualize performance

1. Click **Runner** for **Hello Postman** with env **public**.
2. Set **Iterations=1** → **Run** → see pass/fail + timing numbers.
3. (Optional) Add a **Visualizer** snippet (in the Tests tab, after the code above):

```js
pm.visualizer.set(
    `<table border="1" cellpadding="6">
<tr><th>Demo Value</th><td>{{val}}</td></tr>
</table>`,
    { val: pm.environment.get("demoValue") }
);
```

Open the **Visualizer** tab under the response.

### 0.6 Export your collection & environment (so teammates can reuse)

-   Collection: **…** next to **Hello Postman** → **Export** → v2.1 JSON.
-   Environment: **…** next to environment name → **Export**.

> You’re now comfortable with the Postman UI. Next, you’ll import the **real** collection/environment from the repo and test the **local** API.

---

## 1) What you will set up (local + automation)

-   A tiny **Node/Express** API with `/products` CRUD + a `POST /__reset` endpoint for clean test runs.
-   A **Postman** collection that asserts status/headers/latency/schema, uses **data chaining** (`productId`), and shows a **Visualizer** table.
-   **Newman** CLI with **newman-reporter-htmlextra** to produce an HTML report.
-   A **GitHub Actions** workflow to run the tests on every push/PR.

---

## 2) Prerequisites (install once)

### 2.1 Install Node.js (LTS)

-   **Windows/macOS:** Download the **LTS** installer from nodejs.org and install (or `brew install node` on macOS).
-   **Linux (Debian/Ubuntu):**
    ```bash
    sudo apt-get update
    sudo apt-get install -y nodejs npm
    node -v && npm -v
    ```
    Node 18+ is fine; Node 20 LTS recommended.

### 2.2 Install Postman Desktop App

You already installed this in **Section 0**. Ensure it’s the **Desktop** app.

### 2.3 (Optional) Install Git

For cloning/pushing to GitHub.

---

## 3) Clone and run the API locally

```bash
git clone https://github.com/prathmeshd001/postman-demo.git
cd postman-demo
npm ci    # or: npm install
```

Start the API:

```bash
npm start          # or: node server.js
```

Expected log: `API listening on http://localhost:3000`

**Sanity check in a new terminal:**

```bash
curl -s -X POST http://localhost:3000/__reset
curl -s "http://localhost:3000/products?limit=5"
```

> If port **3000** is taken, change the port in `server.js`, restart the server, and update Postman’s `baseUrl` accordingly.

---

## 4) Import the real collection & environment (local)

1. In **Postman Desktop**, click **Import**.
2. Select from the repo root:
    - `Demo.postman_collection.json`
    - `demoenv.postman_environment.json`
3. Select the **active environment** (e.g., **demoenv local**) and **set**:
    - `baseUrl = http://localhost:3000` (no `https`) and **Save**.

**Tip:** You can **duplicate** the “public” env from Section 0, rename it to **demoenv local**, and just change the `baseUrl` to the local one.

---

## 5) Local testing — run step by step

### 5.1 Single requests (UI)

1. **Reset** → `POST /__reset` → **Send** (clean deterministic state).
2. **List Products** → `GET /products?limit=5` → **Send**.
    - Check **Test Results** (status/header/latency/schema).
    - **Visualizer** shows a product table.
    - Saves `productId` to the environment (data chaining).
3. **Get Product By Id** → `GET /products/{{productId}}` (uses saved value).
4. **Create Product** → `POST /products/add` (expects 200/201).
5. **Update Product** → `PUT /products/:id`.
6. **Delete Product** → `DELETE /products/:id`.

### 5.2 Collection Runner + Performance tab

1. Open **Runner**, choose the collection & **demoenv local**.
2. **Iterations = 1** → **Run**.
3. Review **Results** and **Performance** for a 1-user baseline.

### 5.3 Postman Console (debugging)

-   Open **Console** (bottom panel or **View → Show Postman Console**).
-   Look at request/response logs and any `console.log()` from your scripts.

---

## 6) Automate with Newman (CLI)

### 6.1 Install (once) or use `npx`

```bash
npm i -g newman newman-reporter-htmlextra
# or just use: npx newman ...
```

### 6.2 Run the collection with HTML report

From the repo root:

```bash
npm run test:api
```

This runs the collection with your environment and generates an HTML report (commonly under `reports/`).  
Open the report:

```bash
# macOS
open reports/index.html
# Windows
start reports/index.html
# Linux
xdg-open reports/index.html
```

> Direct one-liner alternative:

```bash
npx newman run "Demo.postman_collection.json" \
  -e "demoenv.postman_environment.json" \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export "reports/index.html"
```

### 6.3 “CI-like” local run (optional)

If your `package.json` includes a `ci` script that:

-   starts the server, waits for health, resets data, runs tests:

```bash
npm run ci
```

---

## 7) CI/CD with GitHub Actions

Create `.github/workflows/api-test.yml` with the following:

```yaml
name: API Tests (Postman + Newman)

on:
    push:
    pull_request:

jobs:
    newman:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - uses: actions/setup-node@v4
              with:
                  node-version: "20"
                  cache: "npm"

            - run: npm ci

            - name: Start API
              run: |
                  node server.js > server.log 2>&1 &
                  # Wait until an endpoint that returns 200 is up
                  npx wait-on --timeout 60000 http-get://localhost:3000/products

            - name: Run Newman with HTML report
              run: |
                  mkdir -p reports
                  npm run test:api

            - name: Upload HTML report
              if: always()
              uses: actions/upload-artifact@v4
              with:
                  name: newman-report
                  path: reports/

            - name: Print server logs on failure
              if: failure()
              run: |
                  echo "===== server.log ====="
                  cat server.log
```

**How this works:**

-   Checkout → setup Node → `npm ci`
-   Start `server.js` in background → `wait-on` `GET /products` == 200
-   Run Newman via `npm run test:api` → HTML to `reports/`
-   Upload `reports/` as artifact; print `server.log` if failure

---

## 8) Troubleshooting

-   **Server not up / wait-on timeout:**
    -   Check job logs and `server.log`.
    -   Locally: `node server.js` and try `curl http://localhost:3000/products?limit=1`.
-   **`ECONNREFUSED` locally:** Start the server (`npm start`) or update `baseUrl`.
-   **`baseUrl` mismatch:** Use `http://localhost:3000` (not `https`).
-   **Port in use:** Change port in `server.js` and update `baseUrl`.
-   **HTML report missing:** Ensure `newman-reporter-htmlextra` is installed and writing to `reports/`.
-   **Variable undefined:** Confirm **active environment** and that **List Products** ran to set `productId`.
-   **Postman tests hidden:** Expand **Test Results** beneath the response; open **Console** for more details.

---

## 9) Handy Postman test snippets

```js
// 200 + JSON header
pm.test("200 + JSON", () => {
    pm.response.to.have.status(200);
    pm.response.to.have.header("content-type");
    pm.expect(pm.response.headers.get("content-type")).to.include(
        "application/json"
    );
});

// Response time sanity
pm.test("Latency < 1000ms", () => {
    pm.expect(pm.response.responseTime).to.be.below(1000);
});

// Save productId for chaining
const j = pm.response.json();
pm.environment.set("productId", j.id ?? j.products?.[0]?.id);
pm.test(
    "Has productId",
    () => pm.expect(pm.environment.get("productId")).to.exist
);
```

---

## 10) Quick command cheat-sheet

```bash
# install
npm ci

# start API
npm start           # or: node server.js

# run collection + HTML report
npm run test:api

# CI-like local run (if script exists)
npm run ci

# open the HTML report
xdg-open reports/index.html   # Linux
open reports/index.html       # macOS
start reports/index.html      # Windows
```

---

### You’re ready!

-   **Before local:** learn Postman with a **public API** (Echo/DummyJSON).
-   **Local:** import the repo’s collection/env and test the **Node/Express** API.
-   **Automation:** run with **Newman** & HTML reports.
-   **CI/CD:** use GitHub Actions to run everything on push/PR.
