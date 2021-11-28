import * as cdk from '@aws-cdk/core';
import { Construct, Stage, StageProps } from '@aws-cdk/core';
import { MyLambdaStack } from '../lambda-stack/lambda-stack';
import { CodePipeline, CodePipelineSource, ShellStep } from '@aws-cdk/pipelines';
import { AmplifyStack } from '../amplify-stack/amplify-stack';
import { Topic } from '@aws-cdk/aws-sns';
import * as snsSubscriptions from '@aws-cdk/aws-sns-subscriptions';
import { PipelineStackProps } from './pipeline-stack-props'
import { DetailType, NotificationRule } from '@aws-cdk/aws-codestarnotifications';

class MyApplication extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    new MyLambdaStack(this, `${id}-lambda`);

    new AmplifyStack(this, `${id}-amplify`, {
      owner: "gowtham91m",
      repository: "mangokulfi",
      secret: "mango-github",
      branch: "main",
      domainName: "mangokulfi.com"
    });
  }
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, `${id}-PipelineStack-`,
      {
        crossAccountKeys: true,
        selfMutation: false,
        pipelineName: "MangokulfiCDK",
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

    pipeline.addStage(new MyApplication(this, `Staging`, {
      env: {
        account: '147866640792',
        region: 'us-west-2',
      },
    }));
    pipeline.addStage(new MyApplication(this, `Prod`, {
      env: {
        account: '049586541010',
        region: 'us-west-2',
      },
    }));
    pipeline.buildPipeline();

    // create sns topic for failure notifications
    const snsTopic = new Topic(this, "pipelineFailureSNS", { topicName: "pipelineFailureNofitications" });
    snsTopic.addSubscription(new snsSubscriptions.EmailSubscription(props.notificatioEmail))
    new NotificationRule(this, 'pipelineFailureNofitications', {
      detailType: DetailType.BASIC,
      events: ['codepipeline-pipeline-pipeline-execution-failed'],
      source: pipeline.pipeline,
      targets: [snsTopic],
    });

    // pipeline.pipeline.notifyOnExecutionStateChange("notify",notificationTarget)
  }
}
