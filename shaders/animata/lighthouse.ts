import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  AnimataMediaUriManifest,
  AnimataMetadataManifest,
  AnimataRenderManifest,
} from "./types.ts";

interface LighthouseUploadModule {
  default: {
    upload: (filePath: string, apiKey: string) => Promise<{
      data?: {
        Hash?: string;
      };
    }>;
  };
}

export async function uploadMediaToLighthouse(
  renderManifest: AnimataRenderManifest,
  apiKey: string,
): Promise<AnimataMediaUriManifest> {
  const lighthouse = await importLighthouseSdk();
  const items = [];

  for (const item of renderManifest.items) {
    const [posterResponse, videoResponse] = await Promise.all([
      lighthouse.default.upload(item.posterPath, apiKey),
      lighthouse.default.upload(item.videoPath, apiKey),
    ]);

    const posterCid = posterResponse.data?.Hash;
    const videoCid = videoResponse.data?.Hash;

    if (!posterCid || !videoCid) {
      throw new Error(`Lighthouse did not return a CID for token ${item.tokenId}.`);
    }

    items.push({
      tokenId: item.tokenId,
      posterCid,
      posterUri: `ipfs://${posterCid}`,
      videoCid,
      videoUri: `ipfs://${videoCid}`,
    });
  }

  return {
    collection: renderManifest.collection,
    version: renderManifest.version,
    items,
  };
}

export async function uploadMetadataToLighthouse(
  metadataManifest: AnimataMetadataManifest,
  apiKey: string,
) {
  const lighthouse = await importLighthouseSdk();
  const items = [];

  for (const item of metadataManifest.items) {
    const response = await lighthouse.default.upload(item.filePath, apiKey);
    const cid = response.data?.Hash;
    if (!cid) {
      throw new Error(`Lighthouse did not return a CID for token ${item.tokenId}.`);
    }

    items.push({
      tokenId: item.tokenId,
      cid,
      uri: `ipfs://${cid}`,
      filePath: item.filePath,
    });
  }

  return {
    collection: metadataManifest.collection,
    version: metadataManifest.version,
    items,
  };
}

export async function writeJsonFile(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function importLighthouseSdk(): Promise<LighthouseUploadModule> {
  try {
    return (await import("@lighthouse-web3/sdk")) as LighthouseUploadModule;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown import error.";
    throw new Error(
      `Unable to load @lighthouse-web3/sdk. Install it before running uploads. Original error: ${message}`,
    );
  }
}
