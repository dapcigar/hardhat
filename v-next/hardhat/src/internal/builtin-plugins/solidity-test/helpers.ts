import type {
  Artifact as HardhatArtifact,
  BuildInfo,
} from "../../../types/artifacts.js";
import type {
  CompilationJobCreationError,
  FailedFileBuildResult,
  FileBuildResult,
} from "../../../types/solidity/build-system.js";
import type {
  ArtifactId as EdrArtifactId,
  Artifact as EdrArtifact,
} from "@ignored/edr";

import path from "node:path";

import { HardhatError } from "@ignored/hardhat-vnext-errors";
import { readJsonFile } from "@ignored/hardhat-vnext-utils/fs";

import { FileBuildResultType } from "../../../types/solidity/build-system.js";

type SolidityBuildResults =
  | Map<string, FileBuildResult>
  | CompilationJobCreationError;
type SuccessfulSolidityBuildResults = Map<
  string,
  Exclude<FileBuildResult, FailedFileBuildResult>
>;

/**
 * This function asserts that the given Solidity build results are successful.
 * It throws a HardhatError if the build results indicate that the compilation
 * job failed.
 */
export function throwIfSolidityBuildFailed(
  results: SolidityBuildResults,
): asserts results is SuccessfulSolidityBuildResults {
  if ("reason" in results) {
    throw new HardhatError(
      HardhatError.ERRORS.SOLIDITY.COMPILATION_JOB_CREATION_ERROR,
      {
        reason: results.formattedReason,
        rootFilePath: results.rootFilePath,
        buildProfile: results.buildProfile,
      },
    );
  }

  const sucessful = [...results.values()].every(
    ({ type }) =>
      type === FileBuildResultType.CACHE_HIT ||
      type === FileBuildResultType.BUILD_SUCCESS,
  );

  if (!sucessful) {
    throw new HardhatError(HardhatError.ERRORS.SOLIDITY.BUILD_FAILED);
  }
}

/**
 * This function returns the artifacts generated during the compilation associated
 * with the given Solidity build results. It relies on the fact that each successful
 * build result has a corresponding artifact generated property.
 */
export async function getArtifacts(
  results: SuccessfulSolidityBuildResults,
  artifactsRootPath: string,
): Promise<EdrArtifact[]> {
  const artifacts: EdrArtifact[] = [];

  for (const [source, result] of results.entries()) {
    for (const artifactPath of result.contractArtifactsGenerated) {
      const artifact: HardhatArtifact = await readJsonFile(artifactPath);
      const buildInfo: BuildInfo = await readJsonFile(
        path.join(artifactsRootPath, "build-info", `${result.buildId}.json`),
      );

      const id = {
        name: artifact.contractName,
        solcVersion: buildInfo.solcVersion,
        source,
      };

      const contract = {
        abi: JSON.stringify(artifact.abi),
        bytecode: artifact.bytecode,
        deployedBytecode: artifact.deployedBytecode,
      };

      artifacts.push({
        id,
        contract,
      });
    }
  }

  return artifacts;
}

/**
 * This function returns the test suite ids associated with the given artifacts.
 * The test suite ID is the relative path of the test file, relative to the
 * project root.
 */
export async function getTestSuiteIds(
  artifacts: EdrArtifact[],
  rootFilePaths: string[],
  projectRoot: string,
): Promise<EdrArtifactId[]> {
  const testSources = rootFilePaths
    .filter((p) => {
      return p.endsWith(".t.sol");
    })
    .map((p) => path.relative(projectRoot, p));

  return artifacts
    .map(({ id }) => id)
    .filter(({ source }) => testSources.includes(source));
}
