const http = require('http');

const API_BASE = "http://localhost:3001";

async function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        json: () => JSON.parse(data),
                        text: () => data
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        json: () => ({}),
                        text: () => data
                    });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

async function runTests() {
    console.log("🚀 Starting Full Stack Verification (Month 1-4)...\n");
    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        process.stdout.write(`Testing ${name}... `);
        try {
            await fn();
            console.log("✅ PASS");
            passed++;
        } catch (e) {
            console.log("❌ FAIL");
            console.error(`   - ${e.message}`);
            failed++;
        }
    }

    // Month 1
    await test("API Health Check", async () => {
        const res = await fetch(`${API_BASE}/health`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // Month 2
    await test("Project API Access", async () => {
        const res = await fetch(`${API_BASE}/api/projects`, {
            method: 'GET' // Auth protected usually
        });
        // 401 means endpoint exists and auth works
        if (res.status !== 401 && res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // Month 3
    await test("Scene Generation Endpoint", async () => {
        const res = await fetch(`${API_BASE}/api/scenes/generate/test-id`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        if (res.status === 404) throw new Error("Endpoint not found (404)");
        // 401 (auth) or 500 (validation/server) is okay, verifies route existence
        if (![200, 400, 401, 500].includes(res.status)) throw new Error(`Unexpected status ${res.status}`);
    });

    await test("Consistency Check Endpoint", async () => {
        const res = await fetch(`${API_BASE}/api/scenes/check-consistency`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenes: [] })
        });
        if (res.status === 404) throw new Error("Endpoint not found (404)");
    });

    // Month 4
    await test("Video Generation Endpoint", async () => {
        const res = await fetch(`${API_BASE}/api/generation/video`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        if (res.status === 404) throw new Error("Endpoint not found (404)");
    });

    await test("Assembly Creation Endpoint", async () => {
        const res = await fetch(`${API_BASE}/api/assembly/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        if (res.status === 404) throw new Error("Endpoint not found (404)");
    });

    await test("Providers List", async () => {
        const res = await fetch(`${API_BASE}/api/generation/providers`);
        if (res.status === 404) throw new Error("Endpoint not found (404)");
        // This might clear auth if public?
    });

    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
}

runTests();
