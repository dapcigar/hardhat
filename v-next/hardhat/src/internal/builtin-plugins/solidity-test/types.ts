import type { SuiteResult } from "@ignored/edr";
import type { Readable } from "node:stream";

export type TestStatus = "Success" | "Failure" | "Skipped";

export type TestsStream = Readable;

export type TestEvent =
  | { type: "suite:result"; data: SuiteResult }
  | { type: "run:complete"; data: undefined };

export type TestEventSource = AsyncGenerator<TestEvent, void>;
export type TestReporterResult = AsyncGenerator<string, void>;

export type TestReporter = (source: TestEventSource) => TestReporterResult;
