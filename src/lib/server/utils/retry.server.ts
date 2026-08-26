import { logger } from "$lib/server/logger";

const sleep = (n: number) => new Promise<void>((r) => setTimeout(r, n));

type BackoffGenerator = Generator<number, void, void>;
type BackoffGeneratorFactory = () => BackoffGenerator;

/**
 * Infinite generator that creates a constant backoff sequence.
 *
 * @param delay - Delay in milliseconds.
 */
export function constBackoff(delay: number): BackoffGeneratorFactory {
  return function* () {
    while (true) {
      yield delay;
    }
  };
}

/**
 * Infinite generator that creates an exponential backoff sequence.
 *
 * @param delay - Initial delay in milliseconds.
 * @param base - Multiplication factor for each retry delay.
 * @param max - Maximum delay cap in milliseconds.
 */
export function expoBackoff(
  delay: number,
  base: number = 2,
  max: number = Number.POSITIVE_INFINITY,
): BackoffGeneratorFactory {
  return function* () {
    let i = 0;
    while (true) {
      yield Math.min(delay * base ** i, max);
      i++;
    }
  };
}

type AsyncFn<Args extends unknown[], Ret> = (...args: Args) => Promise<Ret>;
type ErrorCallbackFn = (e: Error) => boolean;

/**
 * Creates a retrying wrapper around the provided async function.
 *
 * @param fn - Function to execute.
 * @param limit - Maximum number of attempts.
 * @param backoff - Factory for a generator that yields delay durations between attempts. Defaults to no backoff.
 * @param errorCallback - Callback that can short-circuit retries by returning true.
 * @returns An async function that resolves with the return value of {@link fn} or rejects after retries are exhausted.
 */
export function retry<Args extends unknown[], Ret>(
  fn: AsyncFn<Args, Ret>,
  limit: number = 1,
  backoff: BackoffGeneratorFactory = constBackoff(0),
  errorCallback: ErrorCallbackFn = () => false,
): (...args: Args) => Promise<Ret> {
  return async (...args: Args) => {
    let attempts = 0;
    let lastError: Error | undefined;
    const backoffGenerator = backoff();

    while (attempts < limit) {
      try {
        const ret = await fn(...args);
        return ret;
      } catch (e) {
        lastError = e as Error;
        attempts++;

        if (errorCallback(lastError)) throw lastError;
        logger.warn(
          `Error ${e} while calling ${fn.name} on attempt ${attempts}`,
        );

        const delay = backoffGenerator.next();
        if (!delay.done && delay.value) await sleep(delay.value);
      }
    }

    throw lastError;
  };
}
