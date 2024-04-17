import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import {
  AccountPrincipal,
  Effect,
  PolicyStatement,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import {
  ARecord,
  HostedZone,
  RecordTarget,
} from "aws-cdk-lib/aws-route53";
import { Distribution, OriginRequestPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { CdkStackProps } from "../../pipeline-stack";

export class CloudfrontStack extends Stack {
  public cert: Certificate;
  constructor(scope: Construct, id: string, props?: CdkStackProps) {
    super(scope, id, props);

    const bucket = Bucket.fromBucketName(
      this,
      "ProdBucket",
      `gowtham-portfolio-react-assets-${props?.stageName}`
    );

    bucket.addToResourcePolicy(
      new PolicyStatement({
        resources: [bucket.arnForObjects("*"), bucket.bucketArn],
        actions: ["s3:Put*"],
        principals: [new AccountPrincipal("049586541010")],
      })
    );

    const hostedZone = HostedZone.fromLookup(this, "gowtham-live-hosted-zone", {
      domainName: "gowtham.live",
    });

    this.cert = new Certificate(this, "CreateReactAppCertificate", {
      validation: CertificateValidation.fromDns(hostedZone),
      domainName: "*.gowtham.live",
      subjectAlternativeNames: ["gowtham.live", "www.gowtham.live"],
    });

    const cloudfrontDistribution = new Distribution(
      this,
      "CreateReactAppCloudfront",
      {
        defaultBehavior: {
          origin: new S3Origin(bucket),
          originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
        },
        defaultRootObject: "index.html",
        certificate: this.cert,
        domainNames: ["gowtham.live"],
        errorResponses: [{ httpStatus: 403, responsePagePath: "/index.html" }],
      }
    );

    bucket.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [bucket.bucketArn, bucket.arnForObjects("*")],
        actions: ["s3:GetObject"],
        principals: [new ServicePrincipal("cloudfront.amazonaws.com")],
        conditions: {
          StringEquals: {
            "AWS:SourceArn": `arn:aws:cloudfront::049586541010:distribution/${cloudfrontDistribution.distributionId}`,
          },
        },
      })
    );

    //Create A Record Custom Domain to CloudFront CDN
    new ARecord(this, "SiteRecord", {
      recordName: "gowtham.live",
      target: RecordTarget.fromAlias(
        new CloudFrontTarget(cloudfrontDistribution)
      ),
      zone: hostedZone,
    });
  }
}
