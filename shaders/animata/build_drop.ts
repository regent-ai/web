import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  AnimataMetadataManifest,
  AnimataPlanDocument,
  AnimataTokenCardManifest,
  AnimataTokenCardManifestEntry,
} from "./types.ts";

export async function buildOpenSeaDropPackage(
  plan: AnimataPlanDocument,
  tokenCardManifest: AnimataTokenCardManifest,
  staticRoot: string,
  outDir: string,
) {
  const mediaDir = path.join(outDir, "Media");
  await fs.mkdir(mediaDir, { recursive: true });

  const tokenCardsByTokenId = new Map(
    tokenCardManifest.items.map((item) => [item.tokenId, item]),
  );

  for (const edition of plan.editions) {
    const tokenCard = tokenCardsByTokenId.get(edition.tokenId);
    if (!tokenCard) {
      throw new Error(`Missing token card entry for token ${edition.tokenId}.`);
    }

    const sourcePath = toStaticFilePath(staticRoot, tokenCard.imagePath);
    await fs.copyFile(sourcePath, path.join(mediaDir, edition.posterFileName));
  }

  const header = [
    "tokenID",
    "name",
    "description",
    "file_name",
    "external_url",
    "attributes[Family]",
    "attributes[Usage]",
    "attributes[Motion]",
    "attributes[Palette]",
    "attributes[Energy]",
    "attributes[Seed]",
  ];

  const rows = plan.editions.map((edition) => {
    const attributes = Object.fromEntries(
      edition.attributes.map((attribute) => [attribute.trait_type, `${attribute.value}`]),
    );

    return [
      `${edition.tokenId}`,
      edition.name,
      edition.description,
      edition.posterFileName,
      edition.externalUrl,
      attributes.Family ?? "",
      attributes.Usage ?? "",
      attributes.Motion ?? "",
      attributes.Palette ?? "",
      attributes.Energy ?? "",
      attributes.Seed ?? "",
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  await fs.writeFile(path.join(outDir, "metadata-file.csv"), `${csv}\n`, "utf8");
}

export function buildTokenCardManifest(
  plan: AnimataPlanDocument,
  options?: {
    imagePathPrefix?: string;
    animationPathPrefix?: string;
    versionLabel?: string;
  },
) {
  const imagePathPrefix = options?.imagePathPrefix ?? "/images/animata/cards";
  const animationPathPrefix = options?.animationPathPrefix ?? "/cards/regents-club";
  const versionLabel = options?.versionLabel ?? "v1";

  return {
    collection: plan.collection,
    version: plan.version,
    items: plan.editions.map((edition) => buildTokenCardEntry(edition, imagePathPrefix, animationPathPrefix, versionLabel)),
  } satisfies AnimataTokenCardManifest;
}

export async function buildHostedMetadataBundle(
  plan: AnimataPlanDocument,
  tokenCardManifest: AnimataTokenCardManifest,
  siteUrl: string,
  outDir: string,
): Promise<AnimataMetadataManifest> {
  await fs.mkdir(outDir, { recursive: true });
  const tokenCardsByTokenId = new Map(
    tokenCardManifest.items.map((item) => [item.tokenId, item]),
  );
  const items = [];

  for (const edition of plan.editions) {
    const tokenCard = tokenCardsByTokenId.get(edition.tokenId);
    if (!tokenCard) {
      throw new Error(`Missing token card entry for token ${edition.tokenId}.`);
    }

    const filePath = path.join(outDir, edition.metadataFileName);
    await fs.writeFile(
      filePath,
      `${JSON.stringify(
        {
          name: edition.name,
          description: edition.description,
          external_url: edition.externalUrl,
          image: absoluteUrl(siteUrl, tokenCard.imagePath),
          animation_url: absoluteUrl(siteUrl, tokenCard.animationPath),
          attributes: edition.attributes,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    items.push({
      tokenId: edition.tokenId,
      filePath,
    });
  }

  const manifest: AnimataMetadataManifest = {
    collection: plan.collection,
    version: plan.version,
    items,
  };

  await fs.writeFile(path.join(outDir, "metadata-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

function buildTokenCardEntry(
  edition: AnimataPlanDocument["editions"][number],
  imagePathPrefix: string,
  animationPathPrefix: string,
  versionLabel: string,
): AnimataTokenCardManifestEntry {
  return {
    tokenId: edition.tokenId,
    name: edition.name,
    shaderId: edition.shaderId,
    shaderTitle: edition.shaderTitle,
    defineValues: edition.defineValues,
    versionLabel: `${String(edition.tokenId).padStart(4, "0")}.${versionLabel}`,
    imagePath: `${trimTrailingSlash(imagePathPrefix)}/${edition.posterFileName}`,
    animationPath: `${trimTrailingSlash(animationPathPrefix)}/${edition.tokenId}`,
  };
}

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }
  return value;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function toStaticFilePath(staticRoot: string, publicPath: string) {
  const relativePath = publicPath.replace(/^\/+/, "");
  return path.join(staticRoot, relativePath);
}

function absoluteUrl(siteUrl: string, publicPath: string) {
  return new URL(publicPath, `${trimTrailingSlash(siteUrl)}/`).toString();
}
