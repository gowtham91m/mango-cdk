import { Environment, Fn, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import {
  AuthorizationType,
  CfnDomainName,
  CfnDomainNameApiAssociation,
  Definition,
  GraphqlApi,
  MappingTemplate,
} from "aws-cdk-lib/aws-appsync";
import { Construct } from "constructs";
import path = require("path");
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { CnameRecord, HostedZone } from "aws-cdk-lib/aws-route53";

interface GraphQLStackProps extends StackProps {
  readonly dynamoDbName: string;
  readonly cert: Certificate;
  stageName: string;
  env?: Environment;
}

export class GraphQLStack extends Stack {
  constructor(scope: Construct, id: string, props: GraphQLStackProps) {
    super(scope, id, {
      ...props,
      env: { account: "049586541010", region: "us-east-1" },
    });

    const favoritesTable = new Table(this, props.dynamoDbName, {
      tableName: "Favorites",
      partitionKey: { name: "type", type: AttributeType.STRING },
      sortKey: { name: "title", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const appSyncApi = new GraphqlApi(this, "api", {
      name: "Favorites-api",
      definition: Definition.fromFile(path.join(__dirname, "schema.graphql")),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.IAM,
        },
      },
      xrayEnabled: true,
    });

    if (props.stageName == "prod") {
      const appsyncDomainName = new CfnDomainName(this, "AppsyncDomainName", {
        certificateArn: props.cert.certificateArn,
        domainName: "interests.gowtham.live",
      });

      const assoc = new CfnDomainNameApiAssociation(
        this,
        "MyCfnDomainNameApiAssociation",
        {
          apiId: appSyncApi.apiId,
          domainName: "interests.gowtham.live",
        }
      );
      assoc.addDependency(appsyncDomainName);

      new CnameRecord(this, `ApiAliasRecord`, {
        recordName: "interests.gowtham.live",
        zone: HostedZone.fromLookup(this, "Zone", {
          domainName: "gowtham.live",
        }),
        domainName: Fn.select(2, Fn.split("/", appSyncApi.graphqlUrl)),
      });
    }

    const dataSource = appSyncApi.addDynamoDbDataSource(
      "FavoritesDDBTable",
      favoritesTable
    );

    dataSource.createResolver("getFavoritesResolver", {
      typeName: "Query",
      fieldName: "getFavorites",
      requestMappingTemplate: MappingTemplate.fromString(`{
            "version": "2017-02-28",
            "operation": "GetItem",
            "key": {
              "type": $util.dynamodb.toDynamoDBJson($ctx.args.type),
              "title": $util.dynamodb.toDynamoDBJson($ctx.args.title),
            },
          }`),
      responseMappingTemplate: MappingTemplate.fromString(
        "$util.toJson($context.result)"
      ),
    });

    dataSource.createResolver("listFavoritesResolver", {
      typeName: "Query",
      fieldName: "listFavorites",
      requestMappingTemplate: MappingTemplate.fromString(`
      {
        "version": "2017-02-28",
        "operation": "Scan",
        "filter": #if($context.args.filter) $util.transform.toDynamoDBFilterExpression($ctx.args.filter) #else null #end,
        "limit": $util.defaultIfNull($ctx.args.limit, 20),
        "nextToken": $util.toJson($util.defaultIfNullOrEmpty($ctx.args.nextToken, null)),
      }
  `),
      responseMappingTemplate: MappingTemplate.fromString(`
      $util.toJson($context.result)
      `),
    });

    // #set($context.result.headers.Access-Control-Allow-Origin = "https://gowtham.live")
    // #set($context.response.header.Access-Control-Allow-Headers = "*")
    // #set($context.response.header.Access-Control-Allow-Methods = "POST, GET, OPTIONS")

    dataSource.createResolver("createFavorites", {
      typeName: "Mutation",
      fieldName: "createFavorites",
      requestMappingTemplate: MappingTemplate.fromString(`
      {
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {
    "type": $util.dynamodb.toDynamoDBJson($ctx.args.input.type),
    "title": $util.dynamodb.toDynamoDBJson($ctx.args.input.title),
  },
  "attributeValues": $util.dynamodb.toMapValuesJson($ctx.args.input),
  "condition": {
    "expression": "attribute_not_exists(#type) AND attribute_not_exists(#title)",
    "expressionNames": {
      "#type": "type",
      "#title": "title",
    },
  },
}`),
      responseMappingTemplate: MappingTemplate.fromString(
        "$util.toJson($context.result)"
      ),
    });

    dataSource.createResolver("updateFavorites", {
      typeName: "Mutation",
      fieldName: "updateFavorites",
      requestMappingTemplate: MappingTemplate.fromFile(
        path.join(__dirname, "./resolvers/Mutation.updateFavorites.request.vtl")
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        path.join(
          __dirname,
          "./resolvers/Mutation.updateFavorites.response.vtl"
        )
      ),
    });

    dataSource.createResolver("deleteFavorites", {
      typeName: "Mutation",
      fieldName: "deleteFavorites",
      requestMappingTemplate: MappingTemplate.fromString(`
     {
  "version": "2017-02-28",
  "operation": "DeleteItem",
  "key": {
    "type": $util.dynamodb.toDynamoDBJson($ctx.args.input.type),
    "title": $util.dynamodb.toDynamoDBJson($ctx.args.input.title),
  },
}`),
      responseMappingTemplate: MappingTemplate.fromString(
        "$util.toJson($context.result)"
      ),
    });

    // const corsHeader = new AppSyncDataSource.Header({
    //   name: "Access-Control-Allow-Origin",
    //   value: "https://gowtham.live",
    // });
    // dataSource.addHeader(corsHeader);
  }
}
