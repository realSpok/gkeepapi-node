import { getOAuthToken } from "./oAuthToken";
import { ColorValue, Node, Root } from "./types";
export default class Keep {
  async callApi(nodes: Array<Node>) {
    const Authorization = await this.authorization;
    const body = {
      nodes,
      clientTimestamp: new Date().toISOString(),
      requestHeader: {
        clientSessionId: "123",
        clientPlatform: "ANDROID",
        clientVersion: { major: "9", minor: "9", build: "9", revision: "9" },
        capabilities: [
          "NC",
          "PI",
          "LB",
          "AN",
          "SH",
          "DR",
          "TR",
          "IN",
          "SNB",
          "MI",
          "CO",
        ].map((type) => ({ type })),
      },
    };
    const response = await fetch(
      "https://www.googleapis.com/notes/v1/changes",
      {
        headers: {
          Authorization,
        },
        body: JSON.stringify(body),
        method: "POST",
      }
    );
    if (response.status !== 200) {
      const txt = await response.text();
      throw new Error(
        "Error while contacting Keep api: " + response.statusText + "\n\n" + txt
      );
    }
    return JSON.parse(await response.text()) as Root;
  }
  private authorization: Promise<string>;
  private email: string;
  private encryptedPassword: string;
  private root: Promise<Root>;
  constructor(email: string, encryptedPassword: string) {
    (this.email = email), (this.encryptedPassword = encryptedPassword);
    this.authorization = new Promise(async (resolve) => {
      const auth = `OAuth ${await getOAuthToken(
        this.email,
        this.encryptedPassword
      )}`;
      resolve(auth);
    });
    this.root = this.callApi([]);
  }
  async all() {
    const all = await this.root;
    return all.nodes
      .filter((node) => ["NOTE", "LIST"].includes(node.type))
      .map((node) => new List(all.nodes, node.id, this));
  }

  async allNotes() {
    return (await this.all()).filter((node) => node.type === "NOTE");
  }

  async allLists() {
    return (await this.all()).filter((node) => node.type === "LIST");
  }
}
class KeepNode {
  protected node: Node;
  protected keep: Keep;
  constructor(node: Node, keep: Keep) {
    this.keep = keep;
    this.node = node;
  }
  async save() {
    await this.keep.callApi([this.node]);
  }

  get id() {
    return this.node.id;
  }

  get parentId() {
    return this.node.parentId;
  }

  get title() {
    return this.node.title;
  }
  set title(value: string) {
    this.node.title = value;
  }

  get created() {
    return Date.parse(this.node.timestamps.created);
  }
  get updated() {
    return this.node.timestamps.updated
      ? new Date(this.node.timestamps.updated)
      : null;
  }
  get lastModifiedAt() {
    return this.node.timestamps.userEdited
      ? new Date(this.node.timestamps.userEdited)
      : null;
  }
  get lastModifiedBy() {
    return this.node.lastModifierEmail;
  }
}
class List extends KeepNode {
  private allNodes: Node[];
  private childNodes: Node[];
  constructor(nodes: Node[], id: string, keep: Keep) {
    super(
      nodes.find((node) => node.id === id),
      keep
    );
    this.childNodes = nodes.filter((node) => node.parentId === id);
    this.allNodes = nodes;
  }

  get type() {
    return this.node.type;
  }

  get title() {
    return this.node.title;
  }
  set title(value: string) {
    this.node.title = value;
  }

  get color() {
    return this.node.color;
  }

  set color(value: ColorValue) {
    this.node.color = value;
  }

  get items(): ListItem[] {
    return this.childNodes.map((node) => new ListItem(node, this.keep, this));
  }

  public toString = (): string => {
    return this.title + this.items.map((item) => "\n" + item.toString());
  };
}

class ListItem extends KeepNode {
  private list: List;
  constructor(node: Node, keep: Keep, list: List) {
    super(node, keep);
    this.list = list;
  }
  get belongsTo() {
    return this.list;
  }

  get checked() {
    return this.node.checked;
  }
  set checked(value: boolean) {
    this.node.checked = value;
  }

  get text() {
    return this.node.text;
  }
  set text(value: string) {
    this.node.text = value;
  }

  get indentedUnder() {
    return this.list.items.find(
      (listItem) => listItem.id === this.node.superListItemId
    );
  }
  public toString = (): string => {
    return (
      (this.checked === true ? "☑" : this.checked === false ? "☐" : "") +
      (this.indentedUnder ? "\t" : "") +
      this.text
    );
  };
}
