import * as cdk from '@aws-cdk/core';
import { Function, InlineCode, Runtime } from '@aws-cdk/aws-lambda';

export class MyLambdaStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        new Function(this, 'LambdaFunction', {
            runtime: Runtime.NODEJS_12_X,
            handler: 'index.handler',
            code: new InlineCode('exports.handler = _ => "Hello, CDK";')
        });
    }
}