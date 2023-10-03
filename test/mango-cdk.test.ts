import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { GraphQLStack } from "../lib/stacks/graphql-stack/graphql-stack";
import { CloudfrontStack } from "../lib/stacks/cloudfront-stack/cloudfront-stack";

// example test. To run these tests, uncomment this file along with the
// example resource in lib/mango-cdk-stack.ts
test("CloudfrontStack test", () => {
  console.log("test ggwm")
  const app = new cdk.App();
  // WHEN
  const stack = new CloudfrontStack(app, "MyTestStack",{});
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::S3::Bucket", {});
});
