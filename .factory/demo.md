# Demo sandbox

- URL: `https://tour-route-intent.sociobot.in/demo/`
- Alternate entry: `https://tour-route-intent.sociobot.in/?demo=1`
- First action: select **Try it with sample data** on the home page.

The sample is a nine-point route named **Harbour to high pass**. It includes three intent markers:

1. Keep the signed gravel towpath.
2. Use a reliable village-hall water tap.
3. Pass an exposed moor road before dusk.

Demo edits use `sessionStorage` under `demo:tour-route-intent:draft`. The demo theme uses `demo:tour-route-intent:theme`.

While demo mode is active, the app does not read or write these real-data keys:

- `tour-route-intent:draft`
- `tour-route-intent:workspaces`
- `tour-route-intent:theme`
- `sb_license:tour-route-intent`
- `sb_license:tour-route-intent:verdict`

**Reset demo** removes the demo draft and reseeds the original sample. **Start for real** removes all demo session keys and opens the real planner. It does not copy sample data into the real draft.
