import * as amplify from '@aws-cdk/aws-amplify';
import { AmplifyStackProps } from './amplify-stack-props';
import { Stack, Construct, SecretValue } from '@aws-cdk/core';

export class AmplifyStack extends Stack {
    constructor(scope: Construct, id: string, props: AmplifyStackProps) {
        super(scope, id, props);

        const amplifyApp = new amplify.App(this, `MangokulfiApp-${id}`, {
            sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
                owner: props.owner,
                repository: props.repository,
                oauthToken: SecretValue.secretsManager(props.secret)
            })
        });
        const main = amplifyApp.addBranch(props.branch);
        // amplifyApp.addCustomRule(amplify.CustomRule.SINGLE_PAGE_APPLICATION_REDIRECT);

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