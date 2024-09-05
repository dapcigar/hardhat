import type { KeystoreLoader } from "../../src/internal/types.js";

import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import chalk from "chalk";

import { KeystoreFileLoader } from "../../src/internal/loaders/keystore-file-loader.js";
import { get } from "../../src/internal/tasks/get.js";
import { UserInteractions } from "../../src/internal/ui/user-interactions.js";
import { MockFileManager } from "../helpers/mock-file-manager.js";
import { MockUserInterruptionManager } from "../helpers/mock-user-interruption-manager.js";

const fakeKeystoreFilePath = "./fake-keystore-path.json";

describe("tasks - get", () => {
  let mockFileManager: MockFileManager;
  let mockUserInterruptionManager: MockUserInterruptionManager;

  let userInteractions: UserInteractions;
  let keystoreLoader: KeystoreLoader;

  beforeEach(() => {
    mockFileManager = new MockFileManager();
    mockUserInterruptionManager = new MockUserInterruptionManager();

    userInteractions = new UserInteractions(mockUserInterruptionManager);
    keystoreLoader = new KeystoreFileLoader(
      fakeKeystoreFilePath,
      mockFileManager,
    );
  });

  describe("a successful `get` with a known key", () => {
    beforeEach(async () => {
      mockFileManager.setupExistingKeystoreFile({
        myKey: "myValue",
      });

      await get(
        {
          key: "myKey",
        },
        keystoreLoader,
        userInteractions,
      );
    });

    it("should display the gotten value", async () => {
      assert.ok(
        mockUserInterruptionManager.output.includes("myValue"),
        "the value should have been displayed",
      );
    });

    it("should not save the keystore to file", async () => {
      assert.equal(
        mockFileManager.writeJsonFile.mock.calls.length,
        0,
        "keystore should not have been saved",
      );
    });
  });

  describe("a `get` when the keystore file does not exist", () => {
    beforeEach(async () => {
      mockFileManager.setupNoKeystoreFile();

      await get(
        {
          key: "key",
        },
        keystoreLoader,
        userInteractions,
      );
    });

    it("should display a message that the keystore is not set", async () => {
      assert.ok(
        mockUserInterruptionManager.output.includes(
          `No keystore found. Please set one up using ${chalk.blue.italic("npx hardhat keystore set {key}")} `,
        ),
        "the keystore not found message should have been displayed",
      );
    });

    it("should not attempt to save the keystore", async () => {
      assert.equal(
        mockFileManager.writeJsonFile.mock.calls.length,
        0,
        "keystore should not have been saved",
      );
    });
  });

  describe("a `get` with a key that is not in the keystore", () => {
    beforeEach(async () => {
      mockFileManager.setupExistingKeystoreFile({
        known: "value",
      });

      await get(
        {
          key: "unknown",
        },
        keystoreLoader,
        userInteractions,
      );
    });

    it("should display a message that the key is not found", async () => {
      assert.ok(
        mockUserInterruptionManager.output.includes(
          chalk.red(`Key "unknown" not found`),
        ),
        "the key not found message should have been displayed",
      );
    });

    it("should not attempt to save the keystore", async () => {
      assert.equal(
        mockFileManager.writeJsonFile.mock.calls.length,
        0,
        "keystore should not have been saved",
      );
    });
  });
});
