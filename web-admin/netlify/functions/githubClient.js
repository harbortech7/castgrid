const baseHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json'
});

function repoParts(repo){
    const [owner, name] = repo.split('/');
    return { owner, name };
}

function fileUrl(repo, path){
    const { owner, name } = repoParts(repo);
    return `https://api.github.com/repos/${owner}/${name}/contents/${encodeURIComponent(path)}`;
}

async function readJson({ repo, path, token, ref }){
    const url = fileUrl(repo, path) + (ref ? `?ref=${encodeURIComponent(ref)}` : '');
    const res = await fetch(url, { headers: baseHeaders(token) });
    if (res.status === 404) return { data: null, sha: null };
    if (!res.ok) throw new Error(`GitHub read failed: ${res.status} ${await res.text()}`);
    const json = await res.json();
    const content = Buffer.from(json.content, 'base64').toString('utf8');
    return { data: JSON.parse(content), sha: json.sha };
}

async function writeJson({ repo, path, token, branch, data, message }){
    // get existing sha if any
    const existing = await fetch(fileUrl(repo, path), { headers: baseHeaders(token) });
    let sha = null;
    if (existing.ok) {
        const ex = await existing.json();
        sha = ex.sha;
    }
    const body = {
        message: message || `chore: update ${path}`,
        content: Buffer.from(JSON.stringify(data, null, 2), 'utf8').toString('base64'),
        branch,
        sha: sha || undefined
    };
    const res = await fetch(fileUrl(repo, path), {
        method: 'PUT',
        headers: baseHeaders(token),
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`GitHub write failed: ${res.status} ${await res.text()}`);
    return await res.json();
}

module.exports = { readJson, writeJson };