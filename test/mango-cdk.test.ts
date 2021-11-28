import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { PipelineStack } from '../lib/pipeline-stack/pipeline-stack';

test('Empty Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new PipelineStack(app, 'MyTestStack', { notificatioEmail: "gowtham.91m@gmail.com" });
  // THEN
  expectCDK(stack).to(matchTemplate({
    "Resources": {}
  }, MatchStyle.EXACT))
});
