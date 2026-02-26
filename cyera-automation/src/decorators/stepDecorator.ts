import { test } from '@playwright/test';
import { logger } from '../logger';

export function step(message: string) {
  // Using the new decorator proposal (TS 5+) with ClassMethodDecoratorContext
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function actualDecorator(
    originalMethod: (this: any, ...args: any[]) => Promise<any>,
    _context: ClassMethodDecoratorContext,
  ) {
    const replacementMethod = async function (this: any, ...args: any[]): Promise<any> {
      logger.info(message, { args });

      try {
        return await test.step(message, async () => {
          return await originalMethod.call(this, ...args);
        });
      } catch (err) {
        logger.error(`Step failed: ${message}`, { err });
        throw err;
      }
    };

    return replacementMethod;
  };
}

