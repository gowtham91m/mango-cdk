import { Stack, StackProps, Stage, StageProps } from "aws-cdk-lib";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { GraphQLStack } from "./stacks/graphql-stack/graphql-stack";
import { CloudfrontStack } from "./stacks/cloudfront-stack/cloudfront-stack";
// import { AmplifyStack } from "./stacks/amplify-stack";

const accounts = [
  {
    account: "049586541010",
    stage: "prod",
    region: "us-west-2",
  },
  {
    account: "147866640792",
    stage: "stage",
    region: "us-west-2",
  },
];

interface CdkStackProps extends StageProps {
  stageName: string;
}

class MangoCdk extends Stage {
  constructor(scope: Construct, id: string, props?: CdkStackProps) {
    super(scope, id, props);

    // new AmplifyStack(this, `AmplifyStack`, {
    //   owner: "gowtham91m",
    //   repository: "mangotrails",
    //   secret: "git-token",
    //   branch: "main",
    //   domainName: "themangotrails.com",
    // });


    const cloudFrontStack = new CloudfrontStack(this, "CloudfrontStack", {
      stage: props?.stageName,
    });

    new GraphQLStack(this, "GraphQLStack", {
      dynamoDbName: "Favorites",
      cert: cloudFrontStack.cert,
      stageName: props!.stageName,
    });
  }
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const pipeline = new CodePipeline(this, `CodePipeline`, {
      crossAccountKeys: true,
      selfMutation: true,
      pipelineName: "MangotrailsCDK",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.connection("gowtham91m/mango-cdk", "main", {
          connectionArn:
            "arn:aws:codestar-connections:us-west-2:147866640792:connection/4b18bea2-9eb6-47b1-bbdc-adb3bf6fd2a9",
        }),
        commands: ["npm install", "npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    // const ReactAssetsPipeline = new CodePipeline();

    accounts.forEach((account) => {
      pipeline.addStage(
        new MangoCdk(this, `${account.stage}`, {
          env: {
            account: account.account,
            region: account.region,
          },
          stageName: account.stage,
        })
      );
    });
    pipeline.buildPipeline();
  }
}
