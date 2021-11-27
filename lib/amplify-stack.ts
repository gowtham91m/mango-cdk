import * as codebuild from '@aws-cdk/aws-codebuild';
import * as amplify from '@aws-cdk/aws-amplify';
import * as cdk from '@aws-cdk/core';

export class AmplifyStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const amplifyApp = new amplify.App(this, 'ManfoFruityApp', {
            sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
                owner: 'gowtham91m',
                repository: 'mangofruity',
                oauthToken: cdk.SecretValue.secretsManager('mangofruity')
            }),
        });
        amplifyApp.addBranch("main");
    }
}