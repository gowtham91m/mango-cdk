#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PipelineStack } from '../lib/mango-cdk-stack';

const app = new cdk.App();
new PipelineStack(app, 'MangoCdkStack', {
  env: {
    account: '147866640792',
    region: 'us-west-2',
  }
});

app.synth();