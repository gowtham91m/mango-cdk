import { Stack, StackProps, Stage, StageProps } from "aws-cdk-lib";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { AmplifyStack } from "./stacks/amplify-stack";

class MangoCdk extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    new AmplifyStack(this, `AmplifyStack`, {
      owner: "gowtham91m",
      repository: "mangotrails",
      secret: "git-token",
      branch: "main",
      domainName: "themangotrails.com",
    });
  }
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const pipeline = new CodePipeline(this, `CodePipeline`, {
      crossAccountKeys: true,
      selfMutation: false,
      pipelineName: "MangotrailsCDK",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.connection("gowtham91m/mango-cdk", "main", {
          connectionArn:
            "arn:aws:codestar-connections:us-west-2:147866640792:connection/4b18bea2-9eb6-47b1-bbdc-adb3bf6fd2a9",
        }),
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    pipeline.addStage(
      new MangoCdk(this, `staging`, {
        env: {
          account: "147866640792",
          region: "us-west-2",
        },
      })
    );
    pipeline.buildPipeline();
  }
}
