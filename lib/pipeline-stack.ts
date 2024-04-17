import { Environment, Stack, StackProps, Stage, StageProps } from "aws-cdk-lib";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { GraphQLStack } from "./stacks/graphql-stack/graphql-stack";
import { CloudfrontStack } from "./stacks/cloudfront-stack/cloudfront-stack";
import { ReactPipelineStack } from "./stacks/react-assets-pipeline-stack/react-assets-pipeline-stack";

const accounts = [
  {
    account: "049586541010",
    stage: "prod",
    region: "us-east-1",
  },
  // {
  //   account: "147866640792",
  //   stage: "stage",
  //   region: "us-east-1",
  // },
];

export interface CdkStackProps extends StageProps {
  stageName: string;
  env?: Environment
}

class MangoCdk extends Stage {
  constructor(scope: Construct, id: string, props?: CdkStackProps) {
    super(scope, id, props);
    
    new ReactPipelineStack(this, `ReactPipelineStack-${props?.env?.account}`, props);

    const cloudFrontStack = new CloudfrontStack(this, `CloudfrontStack-${props?.env?.account}`, props);

    new GraphQLStack(this, `GraphQLStack-${props?.env?.account}`, {
      dynamoDbName: "Favorites",
      cert: cloudFrontStack.cert,
      stageName: props!.stageName,
      env: props?.env
    });
  }
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const pipeline = new CodePipeline(this, `CodePipeline`, {
      crossAccountKeys: true,
      selfMutation: true,
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.connection("gowtham91m/mango-cdk", "main", {
          connectionArn:
            "arn:aws:codestar-connections:us-east-1:147866640792:connection/55ed3f0f-65e1-45a0-9945-388cd7cccc27",
        }),
        commands: ["npm install", "npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    accounts.forEach((account) => {
      pipeline.addStage(
        new MangoCdk(this, `${account.stage}`, {
          stageName: account.stage,
          env: {account: account.account, region: account.region}
        })
      );
    });
    pipeline.buildPipeline();
  }
}
