import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { CfnApp, CfnBranch, CfnDomain } from "aws-cdk-lib/aws-amplify";

interface AmplifyStackProps extends StackProps {
  readonly owner: string;
  readonly repository: string;
  readonly secret: string;
  readonly branch: string;
  readonly domainName: string;
}

export class AmplifyStack extends Stack {
  constructor(scope: Construct, id: string, props?: AmplifyStackProps) {
    super(scope, id, props);

    const amplifyApp = new CfnApp(this, "Mangotrails", {
      name: "Mangotrails",
      repository: "https://github.com/gowtham91m/mangotrails"
    });

    const branch = new CfnBranch(this, "MangotrailsBranch", {
      appId: amplifyApp.attrAppId,
      branchName: 'dev',
      enableAutoBuild: true,
    });

    const domain = new CfnDomain(this, 'MangotrailsDomain', {
            appId: amplifyApp.attrAppId,
            domainName: (props?.domainName || "themangotrails.com"),
            subDomainSettings: [{
                branchName: 'dev',
                prefix: 'dev',
            }]
        });
  }
}
