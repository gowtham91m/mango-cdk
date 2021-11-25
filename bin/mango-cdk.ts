#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MangoCdkStack } from '../lib/mango-cdk-stack';

const app = new cdk.App();
new MangoCdkStack(app, 'MangoCdkStack', {
  env: {
    account: '147866640792',
    region: 'us-west-2',
  }
});

app.synth();