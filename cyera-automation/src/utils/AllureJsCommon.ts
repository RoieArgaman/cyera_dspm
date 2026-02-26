import {
  suite as allureSuite,
  tags as allureTags,
  tms as allureTms,
  step as allureStep,
  attachment as allureAttachment,
  subSuite as allureSubSuite,
  issue as allureIssue,
  StepContext,
  ContentType,
  AttachmentOptions,
} from 'allure-js-commons';

export class Allure {
  static async suite(name: string): Promise<void> {
    await allureSuite(name);
  }

  static async tags(...tagsList: string[]): Promise<void> {
    await allureTags(...tagsList);
  }

  static async tms(url: string, name?: string): Promise<void> {
    await allureTms(url, name);
  }

  static async step<T = void>(name: string, body: (context: StepContext) => T | PromiseLike<T>): Promise<T> {
    return await allureStep(name, body);
  }

  static async attachment(
    name: string,
    content: Buffer | string,
    options: ContentType | string | AttachmentOptions
  ): Promise<void> {
    await allureAttachment(name, content, options);
  }

  static async subSuite(name: string): Promise<void> {
    await allureSubSuite(name);
  }

  static async issue(url: string, name?: string): Promise<void> {
    await allureIssue(url, name);
  }
}

