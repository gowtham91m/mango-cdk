import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { Construct } from "constructs";
import path = require("path");
import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl,
} from "aws-cdk-lib/aws-s3";
import { CodePipeline, CodePipelineSource } from "aws-cdk-lib/pipelines";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import {
  CodeBuildAction,
  CodeCommitSourceAction,
  CodeStarConnectionsSourceAction,
  GitHubSourceAction,
  S3DeployAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "aws-cdk-lib/aws-codebuild";
import { ArnPrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam";

export class ReactPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const stageBucket =  Bucket.fromBucketName(this, "StageBucket",  "gowtham-portfolio-react-assets-stage")
    const prodBucket =  Bucket.fromBucketName(this, "ProdBucket",  "gowtham-portfolio-react-assets-prod")

    const getBuildSpec = () => {
      return BuildSpec.fromObject({
        version: "0.2",
        env: {
          shell: "bash",
        },
        phases: {
          pre_build: {
            commands: [
              "echo Build started on `date`",
              "aws --version",
              "node --version",
              "npm install",
            ],
          },
          build: {
            commands: ["npm run build"],
          },
          post_build: {
            commands: ["echo Build completed on `date`"],
          },
        },
        artifacts: {
          ["base-directory"]: "build",
          files: ["**/*"],
        },
        cache: {
          paths: ["node_modules/**/*"],
        },
      });
    };

    const pipeline = new Pipeline(this, `CodePipeline`, {
      crossAccountKeys: true,
      pipelineName: "GowthamPortfolioReact",
    });

    const sourceAction = new CodeStarConnectionsSourceAction({
      connectionArn:
        "arn:aws:codestar-connections:us-west-2:147866640792:connection/4b18bea2-9eb6-47b1-bbdc-adb3bf6fd2a9",
      output: new Artifact("source"),
      actionName: "GitHub",
      owner: "gowtham91m",
      repo: "mangotrails",
      triggerOnPush: true,
    });

    const buildAction = new PipelineProject(this, "ReactAppBuildAction", {
      buildSpec: getBuildSpec(),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_5_0,

        privileged: true,
      },
    });

    const deployAction = new S3DeployAction({
      actionName: "S3Deploy",
      bucket: stageBucket,
      input: new Artifact("buildOutout"),
    });

    const prodDeployAction = new S3DeployAction({
        actionName: "prodS3Deploy",
        bucket: prodBucket,
        input: new Artifact("buildOutout")})

    pipeline.addStage({ stageName: "Source", actions: [sourceAction] });
    pipeline.addStage({
      stageName: "Build",
      actions: [
        new CodeBuildAction({
          actionName: "Build",
          project: buildAction,
          input: new Artifact("source"),
          outputs: [new Artifact("buildOutout")],
        }),
      ],
    });
    pipeline.addStage({ stageName: "Deploy", actions: [deployAction] });
    pipeline.addStage({ stageName: "ProdDeploy", actions: [prodDeployAction] });
  
  }
}
