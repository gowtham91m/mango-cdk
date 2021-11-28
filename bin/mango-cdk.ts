#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PipelineStack } from '../lib/pipeline-stack/pipeline-stack';

const app = new cdk.App();
new PipelineStack(app, 'pipeline', {
  env: {
    account: '147866640792',
    region: 'us-west-2',
  },
  notificatioEmail: "gowtham.91m@gmail.com"
});

app.synth();