import * as amplify from '@aws-cdk/aws-amplify';
import { AmplifyStackProps } from './amplify-stack-props';
import { Stack, Construct, SecretValue, RemovalPolicy } from '@aws-cdk/core';
import { UserPool } from '@aws-cdk/aws-cognito';

export class AmplifyStack extends Stack {
    constructor(scope: Construct, id: string, props: AmplifyStackProps) {
        super(scope, id, props);

        const amplifyApp = new amplify.App(this, `MangotrailsApp-${id}`, {
            sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
                owner: props.owner,
                repository: props.repository,
                oauthToken: SecretValue.secretsManager(props.secret)
            })
        });
        const main = amplifyApp.addBranch(props.branch);

        // create cognito user pool
        new UserPool(this, 'mangoadminpool', {
            userPoolName: 'mangoadmin-userpool', removalPolicy: RemovalPolicy.DESTROY
        });

        if (id.startsWith("Prod")) {
            const domain = amplifyApp.addDomain(props.domainName, {
                enableAutoSubdomain: true, // in case subdomains should be auto registered for branches
                autoSubdomainCreationPatterns: ['*', 'pr*'], // regex for branches that should auto register subdomains
            });
            domain.mapRoot(main); // map main branch to domain root
            domain.mapSubDomain(main, 'www');
        }
    }
}