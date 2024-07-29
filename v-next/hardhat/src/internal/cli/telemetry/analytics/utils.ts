import type { AnalyticsFile } from "./types.js";

import path from "node:path";

import { getTelemetryDir } from "@ignored/hardhat-vnext-core/global-dir";
import {
  exists,
  readJsonFile,
  writeJsonFile,
} from "@ignored/hardhat-vnext-utils/fs";

const ANALYTICS_FILE_NAME = "analytics.json";

export async function getAnalyticsClientId(): Promise<string> {
  let clientId = await readAnalyticsClientId();

  if (clientId === undefined) {
    // TODO:log log("Client Id not found, generating a new one");
    clientId = crypto.randomUUID();

    await writeAnalyticsClientId(clientId);
  }

  return clientId;
}

async function readAnalyticsClientId(): Promise<string | undefined> {
  const globalTelemetryDir = await getTelemetryDir();
  const filePath = path.join(globalTelemetryDir, ANALYTICS_FILE_NAME);

  // TODO:log log(`Looking up Client Id at ${filePath}`);

  if ((await exists(filePath)) === false) {
    return undefined;
  }

  const data: AnalyticsFile = await readJsonFile(filePath);
  const clientId = data.analytics.clientId;
  // TODO:log log(`Client Id found: ${clientId}`);

  return clientId;
}

async function writeAnalyticsClientId(clientId: string): Promise<void> {
  const globalTelemetryDir = await getTelemetryDir();
  const filePath = path.join(globalTelemetryDir, ANALYTICS_FILE_NAME);
  await writeJsonFile(filePath, {
    analytics: {
      clientId,
    },
  });

  // TODO:log log(`Stored clientId ${clientId}`);
}
