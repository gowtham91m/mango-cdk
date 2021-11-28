import { StackProps } from "@aws-cdk/core";

export interface PipelineStackProps extends StackProps {
    readonly notificatioEmail: string;
}