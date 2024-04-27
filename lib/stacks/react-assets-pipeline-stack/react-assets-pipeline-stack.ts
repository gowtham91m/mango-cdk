import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl,
} from "aws-cdk-lib/aws-s3";
import { Artifact, Pipeline, PipelineType, ProviderType } from "aws-cdk-lib/aws-codepipeline";
import {
  CodeBuildAction,
  CodeStarConnectionsSourceAction,
  S3DeployAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "aws-cdk-lib/aws-codebuild";
import { CdkStackProps } from "../../pipeline-stack";


export class ReactPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: CdkStackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "CreateReactAppBucket", {
      publicReadAccess: true,
      bucketName: `gowtham-portfolio-react-assets-${props?.stageName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
    });
    
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
      // crossAccountKeys: true,
      pipelineName: "GowthamPortfolioReact",
      pipelineType: PipelineType.V2
    });



    const sourceAction = new CodeStarConnectionsSourceAction({
      connectionArn:
        "arn:aws:codestar-connections:us-east-1:049586541010:connection/1c246387-1a8d-4e0b-a6a4-d531a8dc980a",
      output: new Artifact("source"),
      actionName: "GitHub",
      owner: "gowtham91m",
      repo: "mangotrails",
      triggerOnPush: true,
    });

    //     pipeline.addTrigger({
    //   providerType: ProviderType.CODE_STAR_SOURCE_CONNECTION,
    //   gitConfiguration: {
    //     sourceAction,
    //     pushFilter: [{
    //       tagsExcludes: ['exclude1', 'exclude2'],
    //       tagsIncludes: ['include*'],
    //     }],
    //   },
    // })

    const buildAction = new PipelineProject(this, "ReactAppBuildAction", {
      buildSpec: getBuildSpec(),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_5_0,

        privileged: true,
      },
    });

    const deployAction = new S3DeployAction({
        actionName: "prodS3Deploy",
        bucket: bucket,
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
  
  }
}
