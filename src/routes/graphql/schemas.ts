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
    basic: {
      value: 'basic',
    },
    business: {
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


const ProfileType = new GraphQLObjectType({
  name: 'Profile',
  fields: {
    id: {type: new GraphQLNonNull(UUIDType)},
    isMale: {type: GraphQLBoolean},
    yearOfBirth: {type: GraphQLInt}
  }
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: {type: new GraphQLNonNull(UUIDType)},
    name: {type: GraphQLString},
    balance: {type: GraphQLFloat},
    profile: {type: ProfileType},
  }
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    memberTypes: {
      type: new GraphQLList(MemberType),
      resolve: async (_root, _args, context: {prisma: PrismaClient}, _info) => {
        const res = await context.prisma.memberType.findMany();
        return res;
      },
    },
    memberType: {
      type: MemberType,
      args: {id: {type: MemberTypeId}},
      resolve: async (_root, args: {id: string}, context: {prisma: PrismaClient}, _info) => {
        const memberType = await context.prisma.memberType.findUnique({
          where: {
            id: args.id,
          },
        });
        return memberType;
      },
    },
    posts: {
      type: new GraphQLList(PostType),
      resolve: async (_root, _args, context: {prisma: PrismaClient}, _info) => {
        const res = await context.prisma.post.findMany();
        return res;
      },
    },
    post: {
      type: PostType,
      args: {id: {type: new GraphQLNonNull(UUIDType)}},
      resolve: async (_root, args: {id: string}, context: {prisma: PrismaClient}, _info) => {
        const post = await context.prisma.post.findUnique({
          where: {
            id: args.id,
          },
        });
        return post;
      },
    },
    users: {
      type: new GraphQLList(UserType),
      resolve: async (_root, _args, context: {prisma: PrismaClient}, _info) => {
        const res = await context.prisma.user.findMany();
        return res;
      },
    },
    user: {
      type: UserType,
      args: {id: {type: new GraphQLNonNull(UUIDType)}},
      resolve: async (_root, args: {id: string}, context: {prisma: PrismaClient}, _info) => {
        const user = await context.prisma.user.findUnique({
          where: {
            id: args.id,
          },
        });
        return user;
      },
    },
    profiles: {
      type: new GraphQLList(ProfileType),
      resolve: async (_root, _args, context: {prisma: PrismaClient}, _info) => {
        const res = await context.prisma.profile.findMany();
        return res;
      },
    },
    profile: {
      type: ProfileType,
      args: {id: {type: new GraphQLNonNull(UUIDType)}},
      resolve: async (_root, args: {id: string}, context: {prisma: PrismaClient}, _info) => {
        const profile = await context.prisma.profile.findUnique({
          where: {
            id: args.id,
          },
        });
        return profile;
      },
    },
  }
});

export const schemaGraphql = new GraphQLSchema({
  query: QueryType,
});
