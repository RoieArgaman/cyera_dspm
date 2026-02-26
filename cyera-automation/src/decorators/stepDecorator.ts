import { test } from '@playwright/test';
import { logger } from 'logger';

export function step(message: string) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function actualDecorator(originalMethod: any, _context: ClassMethodDecoratorContext) {
    async function replacementMethod(this: any, ...args: any[]): Promise<any> {
      logger.info(message, { args });
      return await test.step(message, async () => {
        return originalMethod.call(this, ...args);
      });
    }
    return replacementMethod;
  };
}

