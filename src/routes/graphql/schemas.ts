import { Type } from '@fastify/type-provider-typebox';
import { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLFloat, GraphQLList, GraphQLEnumType, GraphQLInt, GraphQLNonNull, GraphQLBoolean } from 'graphql';
import { PrismaClient } from '@prisma/client';
import { UUIDType } from './types/uuid.js';

export const gqlResponseSchema = Type.Partial(
  Type.Object({
    data: Type.Any(),
    errors: Type.Any(),
  }),
);

export const createGqlResponseSchema = {
  body: Type.Object(
    {
      query: Type.String(),
      variables: Type.Optional(Type.Record(Type.String(), Type.Any())),
    },
    {
      additionalProperties: false,
    },
  ),
};

const MemberTypeId = new GraphQLEnumType({
  name: 'MemberTypeId',
  values: {
    BASIC: {
      value: 'basic',
    },
    BUSINESS: {
      value: 'business',
    },
  },
});

const MemberType = new GraphQLObjectType({
  name: 'Member',
  fields: {
    id: {type: new GraphQLNonNull(MemberTypeId)},
    discount: {type: GraphQLFloat},
    postsLimitPerMonth: {type: GraphQLInt}
  }
});

const PostType = new GraphQLObjectType({
  name: 'Post',
  fields: {
    id: {type: new GraphQLNonNull(UUIDType)},
    title: {type: GraphQLString},
    content: {type: GraphQLString}
  }
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: {type: new GraphQLNonNull(UUIDType)},
    name: {type: GraphQLString},
    balance: {type: GraphQLFloat}
  }
});

const ProfileType = new GraphQLObjectType({
  name: 'Profile',
  fields: {
    id: {type: new GraphQLNonNull(UUIDType)},
    isMale: {type: GraphQLBoolean},
    yearOfBirth: {type: GraphQLInt}
  }
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    memberTypes: {
      type: new GraphQLList(MemberType),
      resolve: async (_root, _args, context: {prisma: PrismaClient}, _info) => {
        const res = await context.prisma.memberType.findMany();;
        return res;
      },
    },
    posts: {
      type: new GraphQLList(PostType),
      resolve: async (_root, _args, context: {prisma: PrismaClient}, _info) => {
        const res = await context.prisma.post.findMany();
        return res;
      },
    },
    users: {
      type: new GraphQLList(UserType),
      resolve: async (_root, _args, context: {prisma: PrismaClient}, _info) => {
        const res = await context.prisma.user.findMany();
        return res;
      },
    },
    profiles: {
      type: new GraphQLList(ProfileType),
      resolve: async (_root, _args, context: {prisma: PrismaClient}, _info) => {
        const res = await context.prisma.profile.findMany();
        return res;
      },
    },
  }
});

export const schemaGraphql = new GraphQLSchema({
  query: QueryType,
});
