import util from "node:util";

import {
  HardhatError,
  HardhatPluginError,
} from "@ignored/hardhat-vnext-errors";
import chalk from "chalk";

import { HARDHAT_NAME, HARDHAT_WEBSITE_URL } from "../constants.js";

/**
 * The different categories of errors that can be handled by hardhat cli.
 * Each category has a different way of being formatted and displayed.
 * To add new categories, add a new entry to this enum and update the
 *  {@link getErrorWithCategory} and {@link getErrorMessages} functions
 * accordingly.
 */
enum ErrorCategory {
  HARDHAT = "HARDHAT",
  PLUGIN = "PLUGIN",
  COMMUNITY_PLUGIN = "COMMUNITY_PLUGIN",
  OTHER = "OTHER",
}

type ErrorWithCategory =
  | {
      category: ErrorCategory.HARDHAT;
      categorizedError: HardhatError;
    }
  | {
      category: ErrorCategory.PLUGIN;
      categorizedError: HardhatError;
    }
  | {
      category: ErrorCategory.COMMUNITY_PLUGIN;
      categorizedError: HardhatPluginError;
    }
  | {
      category: ErrorCategory.OTHER;
      categorizedError: unknown;
    };

/**
 * The different messages that can be displayed for each category of errors.
 *  - `formattedErrorMessage`: the main error message that is always displayed.
 *  - `showMoreInfoMessage`: an optional message that can be displayed to
 * provide more information about the error. It is only displayed when stack
 * traces are hidden.
 *  - `postErrorStackTraceMessage` an optional message that can be displayed
 * after the stack trace. It is only displayed when stack traces are shown.
 */
interface ErrorMessages {
  formattedErrorMessage: string;
  showMoreInfoMessage?: string;
  postErrorStackTraceMessage?: string;
}

/**
 * Formats and logs error messages based on the category the error belongs to.
 *
 * @param error the error to handle. Supported categories are defined in
 * {@link ErrorCategory}.
 * @param shouldShowStackTraces whether to show stack traces or not. If true,
 * the stack trace is always shown. If false, the stack trace is only shown for
 * errors of category {@link ErrorCategory.OTHER}.
 * @param print the function used to print the error message, defaults to
 * `console.error`. Useful for testing to capture error messages.
 */
export function printErrorMessages(
  error: unknown,
  shouldShowStackTraces: boolean = false,
  print: (message: string) => void = console.error,
): void {
  // If Hardhat is running on CJS mode we print a special message
  if (isRequireESMError(error)) {
    printEsmOnlyErrorMessage(print);
    return;
  }

  const showStackTraces =
    shouldShowStackTraces ||
    getErrorWithCategory(error).category === ErrorCategory.OTHER;
  const {
    formattedErrorMessage,
    showMoreInfoMessage,
    postErrorStackTraceMessage,
  } = getErrorMessages(error);

  print(formattedErrorMessage);

  print("");

  if (showStackTraces) {
    /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    -- As we don't know the type of error we are printing, we can't know if it
    has a `stack` property or not, so we print it as a string. */
    print(error instanceof Error ? `${error.stack}` : `${util.inspect(error)}`);
    if (postErrorStackTraceMessage !== undefined) {
      print("");
      print(postErrorStackTraceMessage);
    }
  } else if (showMoreInfoMessage !== undefined) {
    print(showMoreInfoMessage);
  }
}

function getErrorWithCategory(error: unknown): ErrorWithCategory {
  if (HardhatError.isHardhatError(error)) {
    if (error.pluginId === undefined) {
      return {
        category: ErrorCategory.HARDHAT,
        categorizedError: error,
      };
    } else {
      return {
        category: ErrorCategory.PLUGIN,
        categorizedError: error,
      };
    }
  }

  if (HardhatPluginError.isHardhatPluginError(error)) {
    return {
      category: ErrorCategory.COMMUNITY_PLUGIN,
      categorizedError: error,
    };
  }

  return {
    category: ErrorCategory.OTHER,
    categorizedError: error,
  };
}

function getErrorMessages(error: unknown): ErrorMessages {
  const { category, categorizedError } = getErrorWithCategory(error);
  switch (category) {
    case ErrorCategory.HARDHAT:
      return {
        formattedErrorMessage: `${chalk.red.bold(`Error ${categorizedError.errorCode}:`)} ${categorizedError.formattedMessage}`,
        showMoreInfoMessage: `For more info go to ${HARDHAT_WEBSITE_URL}${categorizedError.errorCode} or run ${HARDHAT_NAME} with --show-stack-traces`,
      };
    case ErrorCategory.PLUGIN:
      return {
        formattedErrorMessage: `${chalk.red.bold(`Error ${categorizedError.errorCode} in plugin ${categorizedError.pluginId}:`)} ${categorizedError.formattedMessage}`,
        showMoreInfoMessage: `For more info go to ${HARDHAT_WEBSITE_URL}${categorizedError.errorCode} or run ${HARDHAT_NAME} with --show-stack-traces`,
      };
    case ErrorCategory.COMMUNITY_PLUGIN:
      return {
        formattedErrorMessage: `${chalk.red.bold(`Error in community plugin ${categorizedError.pluginId}:`)} ${categorizedError.message}`,
        showMoreInfoMessage: `For more info run ${HARDHAT_NAME} with --show-stack-traces`,
      };
    case ErrorCategory.OTHER:
      return {
        formattedErrorMessage: chalk.red.bold(`An unexpected error occurred:`),
        postErrorStackTraceMessage: `If you think this is a bug in Hardhat, please report it here: ${HARDHAT_WEBSITE_URL}report-bug`,
      };
  }
}

function isRequireESMError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    error.code === "ERR_REQUIRE_CYCLE_MODULE" &&
    error.message.includes("Cannot require() ES Module")
  );
}

function printEsmOnlyErrorMessage(print: (message: string) => void) {
  print(`Hardhat only supports ESM projects.

Please make sure you have \`"type": "module"\` in your package.json`);
}
