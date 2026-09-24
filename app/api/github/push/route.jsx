import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { repoName, files, accessToken, isPrivate, description } = await req.json();

    if (!accessToken || !repoName || !files) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'VIISEVEN-AI-App',
    };

    // 1. Get authenticated user
    const userRes = await fetch('https://api.github.com/user', { headers });
    const user = await userRes.json();
    if (!user.login) {
      return NextResponse.json({ error: 'Invalid or expired GitHub token. Please reconnect.' }, { status: 401 });
    }

    const repoFullName = `${user.login}/${repoName}`;

    // 2. Check if repo exists, if not create it
    const checkRepoRes = await fetch(`https://api.github.com/repos/${repoFullName}`, { headers });
    
    if (checkRepoRes.status === 404) {
      const createRepoRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: repoName,
          private: !!isPrivate,
          description: description || 'Created with VIISEVEN.AI',
          auto_init: true,
        }),
      });

      if (!createRepoRes.ok) {
        const errorData = await createRepoRes.json();
        return NextResponse.json({ error: `Failed to create repo: ${errorData.message}` }, { status: 400 });
      }

      // Small delay to ensure GitHub initializes repo
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 3. Get latest commit SHA on main or master
    let branch = 'main';
    let baseSha = null;

    let refRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/ref/heads/main`, { headers });
    if (!refRes.ok) {
      refRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/ref/heads/master`, { headers });
      if (refRes.ok) {
        branch = 'master';
      }
    }

    if (refRes.ok) {
      const refData = await refRes.json();
      baseSha = refData.object.sha;
    }

    // 4. Create blobs for each file
    const tree = [];
    for (const [filePath, fileData] of Object.entries(files)) {
      const content = typeof fileData === 'string' ? fileData : fileData?.code || '';
      const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

      const blobRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content,
          encoding: 'utf-8',
        }),
      });

      if (!blobRes.ok) {
        continue;
      }

      const blob = await blobRes.json();
      tree.push({
        path: cleanPath,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      });
    }

    if (tree.length === 0) {
      return NextResponse.json({ error: 'No files to push' }, { status: 400 });
    }

    // 5. Create tree
    const treePayload = { tree };
    if (baseSha) {
      treePayload.base_tree = baseSha;
    }

    const treeRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify(treePayload),
    });

    if (!treeRes.ok) {
      const treeError = await treeRes.json();
      return NextResponse.json({ error: `Tree creation error: ${treeError.message}` }, { status: 400 });
    }

    const treeData = await treeRes.json();

    // 6. Create commit
    const commitPayload = {
      message: 'Update from VIISEVEN.AI 🚀',
      tree: treeData.sha,
    };
    if (baseSha) {
      commitPayload.parents = [baseSha];
    }

    const commitRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify(commitPayload),
    });

    if (!commitRes.ok) {
      const commitError = await commitRes.json();
      return NextResponse.json({ error: `Commit creation error: ${commitError.message}` }, { status: 400 });
    }

    const commitData = await commitRes.json();

    // 7. Update ref
    const updateRefRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: commitData.sha,
        force: true,
      }),
    });

    if (!updateRefRes.ok) {
      // Try to create ref if it didn't exist
      await fetch(`https://api.github.com/repos/${repoFullName}/git/refs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${branch}`,
          sha: commitData.sha,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      repoUrl: `https://github.com/${repoFullName}`,
      commitSha: commitData.sha,
    });
  } catch (error) {
    console.error('GitHub push error:', error);
    return NextResponse.json({ error: error.message || 'Push failed' }, { status: 500 });
  }
}
