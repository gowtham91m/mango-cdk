import * as cdk from '@aws-cdk/core';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { Construct, SecretValue, Stack, Stage, StageProps } from '@aws-cdk/core';
import { MyLambdaStack } from './lambda-stack';
import { CodePipeline, CodePipelineSource, ShellStep } from '@aws-cdk/pipelines';

class MyApplication extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const lambdaStack = new MyLambdaStack(this, 'lambda');
  }
}

export class MangoCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
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

    pipeline.addStage(new MyApplication(this, 'Prod', {
      env: {
        account: '147866640792',
        region: 'us-west-2',
      },
    }));
  }
}
