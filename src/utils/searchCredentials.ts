import Fuse from "fuse.js";
import type { Credential } from "../types/credential";
import { CATEGORY_LABEL } from "../types/credential";

export function searchCredentials(
  list: Credential[],
  query: string,
): Credential[] {
  const q = query.trim();
  if (!q) return list;

  const fuse = new Fuse(
    list.map((c) => ({
      ...c,
      categoryLabel: CATEGORY_LABEL[c.category],
      tagsText: (c.tags ?? []).join(" "),
      noteText: c.note ?? "",
    })),
    {
      keys: [
        { name: "name", weight: 0.35 },
        { name: "username", weight: 0.25 },
        { name: "url", weight: 0.15 },
        { name: "categoryLabel", weight: 0.15 },
        { name: "tagsText", weight: 0.05 },
        { name: "noteText", weight: 0.05 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      includeScore: true,
    },
  );

  return fuse.search(q).map((r) => {
    const { categoryLabel: _a, tagsText: _b, noteText: _c, ...cred } = r.item;
    return cred as Credential;
  });
}
