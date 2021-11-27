import { StackProps } from '@aws-cdk/core';

export interface AmplifyStackProps extends StackProps {
    readonly owner: string;
    readonly repository: string;
    readonly secret: string;
}