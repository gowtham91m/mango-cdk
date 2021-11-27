import * as amplify from '@aws-cdk/aws-amplify';
import { AmplifyStackProps } from './amplify-stack-props';
import { Stack, Construct, SecretValue } from '@aws-cdk/core';

export class AmplifyStack extends Stack {
    constructor(scope: Construct, id: string, props: AmplifyStackProps) {
        super(scope, id, props);

        const amplifyApp = new amplify.App(this, `ManfoFruityApp-${id}`, {
            sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
                owner: props.owner,
                repository: props.repository,
                oauthToken: SecretValue.secretsManager(props.secret)
            }),
        });
        amplifyApp.addBranch("main");
    }
}