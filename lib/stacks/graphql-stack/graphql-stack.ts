import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { Construct } from "constructs";
import path = require("path");
import { DnsValidatedCertificate } from "aws-cdk-lib/aws-certificatemanager";

interface GraphQLStackProps extends StackProps {
  readonly dynamoDbName: string;
  readonly cert: DnsValidatedCertificate;
  stageName: string;
}

export class GraphQLStack extends Stack {
  constructor(scope: Construct, id: string, props: GraphQLStackProps) {
    super(scope, id, props);

    const favoritesTable = new Table(this, props.dynamoDbName, {
      tableName: "Favorites",
      partitionKey: { name: "type", type: AttributeType.STRING },
      sortKey: { name: "title", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const api = new appsync.GraphqlApi(this, "api", {
      name: "Favorites-api",

      domainName:
        props.stackName == "prod"
          ? { domainName: "favorites.gowtham.live", certificate: props.cert }
          : undefined,
      schema: appsync.SchemaFile.fromAsset(
        path.join(__dirname, "schema.graphql")
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.IAM,
        },
      },
      xrayEnabled: true,
    });

    const dataSource = api.addDynamoDbDataSource(
      "FavoritesDDBTable",
      favoritesTable
    );

    dataSource.createResolver("getFavoritesResolver", {
      typeName: "Query",
      fieldName: "getFavorites",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`{
            "version": "2017-02-28",
            "operation": "GetItem",
            "key": {
              "type": $util.dynamodb.toDynamoDBJson($ctx.args.type),
              "title": $util.dynamodb.toDynamoDBJson($ctx.args.title),
            },
          }`),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        "$util.toJson($context.result)"
      ),
    });

    dataSource.createResolver("listFavoritesResolver", {
      typeName: "Query",
      fieldName: "listFavorites",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
      {
        "version": "2017-02-28",
        "operation": "Scan",
        "filter": #if($context.args.filter) $util.transform.toDynamoDBFilterExpression($ctx.args.filter) #else null #end,
        "limit": $util.defaultIfNull($ctx.args.limit, 20),
        "nextToken": $util.toJson($util.defaultIfNullOrEmpty($ctx.args.nextToken, null)),
      }
  `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        "$util.toJson($context.result)"
      ),
    });

    dataSource.createResolver("createFavorites", {
      typeName: "Mutation",
      fieldName: "createFavorites",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
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
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        "$util.toJson($context.result)"
      ),
    });

    dataSource.createResolver("updateFavorites", {
      typeName: "Mutation",
      fieldName: "updateFavorites",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
        path.join(__dirname, "./resolvers/Mutation.updateFavorites.request.vtl")
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromFile(
        path.join(
          __dirname,
          "./resolvers/Mutation.updateFavorites.response.vtl"
        )
      ),
    });

    dataSource.createResolver("deleteFavorites", {
      typeName: "Mutation",
      fieldName: "deleteFavorites",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
     {
  "version": "2017-02-28",
  "operation": "DeleteItem",
  "key": {
    "type": $util.dynamodb.toDynamoDBJson($ctx.args.input.type),
    "title": $util.dynamodb.toDynamoDBJson($ctx.args.input.title),
  },
}`),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        "$util.toJson($context.result)"
      ),
    });
  }
}
