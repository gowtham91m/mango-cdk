#!/usr/bin/env node
import "source-map-support/register";
import {App} from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new App();
new PipelineStack(app, "CodePipelineStack", {
  env: { account: "147866640792", region: "us-east-1" },
});
