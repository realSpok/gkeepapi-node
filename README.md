# gkeepapi-node

A node-js port of the amazing python Keep unofficial client [gkeepapi](https://github.com/kiwiz/gkeepapi), for handling Google Keep notes.

## state:

only a couple of functions are implemented, mostly reading and updating notes and list.

## use:

To add to your project:

```bash
npm install 'gkeepapi-node'
```

Then you can retrieve and update notes like so:

```typescript
import { Keep, ColorValue } from "gkeepapi-node";

// refer to https://github.com/kiwiz/gkeepapi and https://github.com/simon-weber/gpsoauth on how to get the master_token/encrypted_password for your account
const keep = new Keep(process.env.email, process.env.encrypted_password);

const list = (await keep.allLists()).find((list) => list.title === "Todos");
list.color = ColorValue.Blue;
list.title = "Todo today";
await list.save();

const firstThingTodo = list.items[0];
firstThingTodo.checked = true;
await firstThingTodo.save();
```

## contribute:

I use bun as a typescript runtime for this project. Install bun, then

```bash
bun install
bun run index.ts
```
