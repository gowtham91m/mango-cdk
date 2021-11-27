import * as amplify from '@aws-cdk/aws-amplify';
import * as codebuild from '@aws-cdk/aws-codebuild';
import { AmplifyStackProps } from './amplify-stack-props';
import { Stack, Construct, SecretValue } from '@aws-cdk/core';

export class AmplifyStack extends Stack {
    constructor(scope: Construct, id: string, props: AmplifyStackProps) {
        super(scope, id, props);

        const amplifyApp = new amplify.App(this, `MangoFruityApp-${id}`, {
            sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
                owner: props.owner,
                repository: props.repository,
                oauthToken: SecretValue.secretsManager(props.secret)
            }),
            buildSpec: codebuild.BuildSpec.fromObjectToYaml({
                version: '1.0',
                frontend: {
                    phases: {
                        preBuild: {
                            commands: [
                                'npm install'
                            ]
                        },
                        build: {
                            commands: [
                                'npm run build'
                            ]
                        }
                    },
                    artifacts: {
                        baseDirectory: 'build',
                        files:
                            - '**/*'
                    }
                }
            })
        });
        amplifyApp.addBranch("main");
    }
}