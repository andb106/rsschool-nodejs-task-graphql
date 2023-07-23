import { Type } from '@fastify/type-provider-typebox';
import { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLFloat, GraphQLList, GraphQLEnumType, GraphQLInt, GraphQLNonNull, GraphQLBoolean, GraphQLInputObjectType } from 'graphql';
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
    content: {type: GraphQLString},
    authorId: { type: UUIDType },
  }
});


const ProfileType = new GraphQLObjectType({
  name: 'Profile',
  fields: {
    id: {type: new GraphQLNonNull(UUIDType)},
    isMale: {type: GraphQLBoolean},
    yearOfBirth: {type: GraphQLInt},
    memberTypeId: {type: MemberTypeId},
    memberType: {
      type: MemberType,
      resolve: async (root: {memberTypeId: string}, _args, context: {prisma: PrismaClient}, _info) => {
        const memberType = await context.prisma.memberType.findUnique({
          where: {
            id: root.memberTypeId,
          },
        });
        return memberType;
      },
    },
    userId: { type: UUIDType },
  }
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: {type: new GraphQLNonNull(UUIDType)},
    name: {type: GraphQLString},
    balance: {type: GraphQLFloat},
    profile: {
      type: ProfileType,
      resolve: async (root: {id: string}, _args, context: {prisma: PrismaClient}, _info) => {
        const userProfile = await context.prisma.profile.findUnique({
          where: {
            userId: root.id,
          },
        });
        return userProfile;
      },
    },
    posts: {
      type: new GraphQLList(PostType),
      resolve: async (root: {id: string}, _args, context: {prisma: PrismaClient}, _info) => {
        const userPosts = await context.prisma.post.findMany({
          where: {
            authorId: root.id,
          },
        });
        return userPosts;
      },
    },
    userSubscribedTo: {
      type: new GraphQLList(UserType),
      resolve: async (root: {id: string}, _args, context: {prisma: PrismaClient}, _info) => {
        const subs = await context.prisma.user.findMany({
          where: {
            subscribedToUser: {
              some: {
                subscriberId: root.id,
              },
            },
          },
        });
        return subs;
      },
    },
    subscribedToUser: {
      type: new GraphQLList(UserType),
      resolve: async (root: {id: string}, _args, context: {prisma: PrismaClient}, _info) => {
        const subs = await context.prisma.user.findMany({
          where: {
            userSubscribedTo: {
              some: {
                authorId: root.id,
              },
            },
          },
        });
        return subs;
      },
    }
  }),
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

const CreatePostInputType = new GraphQLInputObjectType({
  name: 'CreatePostInput',
  fields: {
    title: {type:GraphQLString},
    content: {type: GraphQLString},
    authorId: {type: UUIDType},
  }
})

const CreateUserInputType = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: {
    name: {type:GraphQLString},
    balance: {type: GraphQLFloat},
  }
})

const CreateProfileInputType = new GraphQLInputObjectType({
  name: 'CreateProfileInput',
  fields: {
    isMale: {type: GraphQLBoolean},
    yearOfBirth: {type: GraphQLInt},
    memberTypeId: {type: MemberTypeId},
    userId: {type: UUIDType}
  }
})

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createPost: {
      type: PostType,
      args: { dto: { type: new GraphQLNonNull(CreatePostInputType) } },
      resolve: async (_root, args: { dto }, context: {prisma: PrismaClient}, _info) => {
        const newPost = await context.prisma.post.create({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: args.dto
        })
        return newPost;
      },
    },
    createUser: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      type: UserType,
      args: { dto: { type: new GraphQLNonNull(CreateUserInputType) } },
      resolve: async (_root, args: { dto }, context: {prisma: PrismaClient}, _info) => {
        const newUser = await context.prisma.user.create({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: args.dto
        })
        return newUser;
      },
    },
    createProfile: {
      type: ProfileType,
      args: { dto: { type: new GraphQLNonNull(CreateProfileInputType) } },
      resolve: async (_root, args: { dto }, context: {prisma: PrismaClient}, _info) => {
        const newProfile = await context.prisma.profile.create({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: args.dto
        })
        return newProfile;
      },
    }
  }
})

export const schemaGraphql = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});
