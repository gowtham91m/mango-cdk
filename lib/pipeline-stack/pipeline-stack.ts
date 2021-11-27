import * as cdk from '@aws-cdk/core';
import { Construct, Stage, StageProps } from '@aws-cdk/core';
import { MyLambdaStack } from '../lambda-stack/lambda-stack';
import { CodePipeline, CodePipelineSource, ShellStep } from '@aws-cdk/pipelines';
import { AmplifyStack } from '../amplify-stack/amplify-stack';

class MyApplication extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    new MyLambdaStack(this, 'lambda');
    new AmplifyStack(this, 'mangofruity', {
      owner: "gowtham91m",
      repository: "mangofruity",
      secret: "mangofruity"
    });
  }
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline',
      {
        crossAccountKeys: true,
        selfMutation: true,
        pipelineName: "MangofruityCDK",
        synth: new ShellStep('Synth', {
          input: CodePipelineSource.connection('gowtham91m/mango-cdk', 'main', {
            connectionArn: 'arn:aws:codestar-connections:us-west-2:147866640792:connection/4b18bea2-9eb6-47b1-bbdc-adb3bf6fd2a9',
          }),
          commands: [
            'npm ci',
            'npm run build',
            'npx cdk synth',
          ],
        }),
      });

    pipeline.addStage(new MyApplication(this, 'Staging', {
      env: {
        account: '697393813417',
        region: 'us-west-2',
      },
    }));
  }
}
