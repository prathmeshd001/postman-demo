
# Postman + Newman User Manual (STQM Demo)
**Audience:** Beginners  
**Goal:** Reproduce the in‑class demo end‑to‑end: run a local dummy API, test it from Postman, automate with Newman, produce HTML reports, and wire it into CI/CD (GitHub Actions).

---

## 1) What you’ll build
- A tiny **Node/Express** API that exposes `/products` CRUD + a `POST /__reset` utility.  
- A **Postman collection** that exercises that API with scripts, data‑chaining, a Visualizer table, and assertions.  
- **Newman** CLI runs with **htmlextra** HTML reports, and a **GitHub Actions** CI example.

**Project files used in this manual (already provided):**
```
Demo.postman_collection.json
demoenv.postman_environment.json
package.json
server.js
```
> Tip: Keep these files in one folder (e.g., `postman-newman-demo/`).

---

## 2) Prerequisites (Install Once)

### 2.1 Install Node.js (LTS recommended)
- **Windows (any):**
  1. Download the **LTS** installer from nodejs.org and run it.
  2. Confirm in a new terminal: `node -v` and `npm -v`.
- **macOS:**
  - Using Homebrew: `brew install node` (or download the LTS pkg from nodejs.org).
- **Ubuntu/Debian:**
  - Using apt (or nvm if you prefer):  
    ```bash
    sudo apt-get update
    sudo apt-get install -y nodejs npm
    node -v && npm -v
    ```
> Any Node 18+ is fine; Node 20 LTS is ideal.

### 2.2 Install Postman Desktop
- Download and install **Postman Desktop App** (not just the web client) so the **Runner** works reliably.
- Launch Postman once after installing.

### 2.3 (Optional) Git
- If you plan to commit files or add CI quickly, install Git and configure your GitHub repo.

---

## 3) Project Setup (Local)

1. **Open a terminal** in the folder containing the four files (`Demo.postman_collection.json`, `demoenv.postman_environment.json`, `package.json`, `server.js`).  
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the API server:**
   ```bash
   npm start
   ```
   You should see:  
   `API listening on http://localhost:3000`

4. **(Optional) Quick sanity checks** in another terminal:
   ```bash
   curl -s -X POST http://localhost:3000/__reset
   curl -s "http://localhost:3000/products?limit=5"
   ```

**What the server does (high level):**
- `POST /__reset` reseeds products so your tests start from a **clean state** each run.
- `GET /products?limit=5` lists products and returns a `limit` field.
- `GET /products/:id`, `POST /products/add`, `PUT /products/:id`, `DELETE /products/:id` implement simple CRUD.

> Keep this terminal open so the API stays running during the demo.

---

## 4) Postman Setup & First Run

### 4.1 Import files
1. Open **Postman Desktop**.
2. Click **Import** → select **`Demo.postman_collection.json`** and **`demoenv.postman_environment.json`**.
3. In the top‑right, choose the **active environment** → select **`demoenv local`**.

> **Important:** Ensure `baseUrl` is **`http://localhost:3000`** (not `https://`).  
> If your environment shows `https://localhost:3000`, edit it to `http://localhost:3000` and save.

### 4.2 Collection overview (what’s inside)
- **Reset** (`POST /__reset`): resets the in‑memory DB.
- **List Products** (`GET /products?limit=5`): saves the first `productId` into the **environment** and shows a **Visualizer** table.
- **Get Product By Id** (`GET /products/{{productId}}`): uses the saved `productId` for data‑chaining.
- **Create Product** (`POST /products/add`)  
- **Update Product** (`PUT /products/1`)  
- **Delete Product** (`DELETE /products/1`)

> You’ll see assertions for **status codes**, **content‑type**, **response time**, and **basic schema/shape** in the **Tests** tab for each request.

### 4.3 Run single requests (UI demo)
1. Select **Reset** → click **Send** (should return `{ ok: true, total: <n> }`).
2. Select **List Products** → **Send**.  
   - Open **Test Results** panel → observe **green checks**.  
   - Open the **Visualizer** tab → see a product table (ID, Title, Price, etc.).  
   - This step also **saves** `productId` for chaining.
3. Select **Get Product By Id** → **Send**. It should use `{{productId}}` from the environment.
4. Create/Update/Delete requests: send them and watch assertions.

### 4.4 Run the whole collection (Collection Runner)
1. Click **Runner** (right of the **Send** button or use the left sidebar’s “Run”).
2. Choose the **collection** and the **`demoenv local`** environment.
3. Set **Iterations = 1** (for a basic run).
4. Start the run → review **Results** and the **Performance** tab (response time, size).

---

## 5) Automation via Newman (CLI)

### 5.1 One‑time install (or use npx)
You can run via `npx` (no global install), or install globally:
```bash
npm i -g newman newman-reporter-htmlextra
```

### 5.2 Use the provided npm scripts
From the project folder, run:
```bash
npm run test:api
```
What it does:
- Executes your Postman **collection** with your **environment**.
- Forces `baseUrl=http://localhost:3000` in case your environment differs.
- Generates a rich HTML report at `./reports/index.html`.
- Prints a CLI summary (assertions, timings).

Open the HTML report in your browser:
```bash
# macOS
open reports/index.html
# Windows
start reports/index.html
# Linux
xdg-open reports/index.html
```

### 5.3 “CI‑like” local run
This script **starts the server**, **waits until it’s ready**, **resets data**, then runs the tests:
```bash
npm run ci
```

---

## 6) CI/CD with GitHub Actions (Example)

Create `.github/workflows/api-tests.yml` in your repo with the following:
```yaml
name: API Tests
on: [push, pull_request]

jobs:
  newman:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      # Start server, wait until it's live, reset data, then run tests (HTML report included)
      - run: npm run ci

      # Upload the HTML report as a build artifact
      - uses: actions/upload-artifact@v4
        with:
          name: newman-report
          path: reports/index.html
```
**How to use:**
1. Commit your project (the four files) to a new GitHub repo.
2. Create the workflow file above and push.
3. Open your repo → **Actions** tab → see the **API Tests** workflow run.
4. Download the **newman-report** artifact to view the HTML results.

---

## 7) Understanding the Scripts & Flow

### 7.1 Postman data‑chaining
- **List Products** sets `productId` using `pm.environment.set("productId", j.products[0].id)`.  
- **Get Product By Id** uses `GET /products/{{productId}}` to fetch that product.

### 7.2 Common assertions used
- Status: `pm.response.to.have.status(200)`  
- Header: `pm.response.to.have.header("content-type", "application/json; charset=utf-8")`  
- Time: `pm.expect(pm.response.responseTime).to.be.below(1000)`  
- Basic schema/shape checks for objects, arrays, and field types

### 7.3 Server endpoints you’re testing
- `POST /__reset` → reseed data (run this before each demo/test run for predictable results)
- `GET /products?limit=5` → returns `{ products, total, skip, limit }`
- `GET /products/:id` → fetch one
- `POST /products/add` → create (returns 201 + the new object)
- `PUT /products/:id` → update price or other fields
- `DELETE /products/:id` → soft success message

---

## 8) Troubleshooting

- **`ECONNREFUSED` / timeouts**: Is the server running? Terminal should show `API listening on http://localhost:3000`.
- **Mixed protocol (https vs http)**: Ensure environment `baseUrl` is `http://localhost:3000` (no `https`).  
- **Port already in use**: Close other apps using port 3000 or change the port in `server.js` and update `baseUrl` accordingly.
- **CORS / Content-Type**: The server sets `application/json; charset=utf-8`; requests set the same.
- **Variable not found**: Check active environment and **variable scope** (env vs collection vs local).
- **HTML report missing**: Ensure `newman-reporter-htmlextra` is installed and the `reports/` folder is writable.

---

## 9) Handy Snippets (copy‑paste in Postman Tests)

```js
// status + content-type
pm.test("200 + JSON", () => {
  pm.response.to.have.status(200);
  pm.response.to.have.header("content-type", "application/json; charset=utf-8");
});

// response time budget
pm.test("Latency < 1000ms", () => {
  pm.expect(pm.response.responseTime).to.be.below(1000);
});

// set + get environment variables
const j = pm.response.json();
pm.environment.set("productId", j.id || j.products?.[0]?.id);
pm.test("Has productId", () => pm.expect(pm.environment.get("productId")).to.exist);
```

---

## 10) Quick Commands (cheat‑sheet)

```bash
# install deps
npm install

# start server
npm start

# run collection + HTML report
npm run test:api

# CI-like local run (starts server, waits, resets, runs tests)
npm run ci
```
Open report: `reports/index.html`

---

### ✅ You’re done!
You can now demonstrate:
- Postman UI (requests, headers, params, body, tests, Visualizer)
- Collections + Environments + data‑chaining
- Collection Runner + Performance tab
- Newman CLI + HTML reporting
- CI/CD integration on GitHub Actions
