/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

const ChangePostInputType = new GraphQLInputObjectType({
  name: 'ChangePostInput',
  fields: {
    title: {type:GraphQLString},
    content: {type: GraphQLString},
  }
})

const ChangeProfileInputType = new GraphQLInputObjectType({
  name: 'ChangeProfileInput',
  fields: {
    isMale: {type: GraphQLBoolean},
    yearOfBirth: {type: GraphQLInt},
    memberTypeId: {type: MemberTypeId},
  }
})

const ChangeUserInputType = new GraphQLInputObjectType({
  name: 'ChangeUserInput',
  fields: {
    name: {type:GraphQLString},
    balance: {type: GraphQLFloat},
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
          data: args.dto
        })
        return newPost;
      },
    },
    createUser: {
      type: UserType,
      args: { dto: { type: new GraphQLNonNull(CreateUserInputType) } },
      resolve: async (_root, args: { dto }, context: {prisma: PrismaClient}, _info) => {
        const newUser = await context.prisma.user.create({
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
          data: args.dto
        })
        return newProfile;
      },
    },
    deletePost: {
      type: GraphQLBoolean,
      args: { id: {type: new GraphQLNonNull(UUIDType)}},
      resolve: async (_root, args: {id: string}, context: {prisma: PrismaClient}, _info) => {
        try {
          const deletedPost = await context.prisma.post.delete({
            where: {
              id: args.id,
            },
          });
          return deletedPost ? true : false;
        } catch (error) {
          return false;
        }
      },
    },
    deleteProfile: {
      type: GraphQLBoolean,
      args: { id: {type: new GraphQLNonNull(UUIDType)}},
      resolve: async (_root, args: {id: string}, context: {prisma: PrismaClient}, _info) => {
        try {
          const deletedProfile = await context.prisma.profile.delete({
            where: {
              id: args.id,
            },
          });
          return deletedProfile ? true : false;
        } catch (error) {
          return false;
        }
      },
    },
    deleteUser: {
      type: GraphQLBoolean,
      args: { id: {type: new GraphQLNonNull(UUIDType)}},
      resolve: async (_root, args: {id: string}, context: {prisma: PrismaClient}, _info) => {
        try {
          const deletedUser = await context.prisma.user.delete({
            where: {
              id: args.id,
            },
          });
          return deletedUser ? true : false;
        } catch (error) {
          return false;
        }
      },
    },
    changePost: {
      type: PostType,
      args: { id: {type: new GraphQLNonNull(UUIDType)}, dto: { type: new GraphQLNonNull(ChangePostInputType) }},
      resolve: async (_root, args: { id, dto }, context: {prisma: PrismaClient}, _info) => {
        const changedPost = await context.prisma.post.update({
          where: { id: args.id },
          data: args.dto
        })
        return changedPost;
      },
    },
    changeProfile: {
      type: ProfileType,
      args: { id: {type: new GraphQLNonNull(UUIDType)}, dto: { type: new GraphQLNonNull(ChangeProfileInputType) }},
      resolve: async (_root, args: { id, dto }, context: {prisma: PrismaClient}, _info) => {
        const changedProfile = await context.prisma.profile.update({
          where: { id: args.id },
          data: args.dto
        })
        return changedProfile;
      },
    },
    changeUser: {
      type: UserType,
      args: { id: {type: new GraphQLNonNull(UUIDType)}, dto: { type: new GraphQLNonNull(ChangeUserInputType) }},
      resolve: async (_root, args: { id, dto }, context: {prisma: PrismaClient}, _info) => {
        const changedUser = await context.prisma.user.update({
          where: { id: args.id },
          data: args.dto
        })
        return changedUser;
      },
    },
    subscribeTo: {
      type: UserType,
      args: { userId: {type: new GraphQLNonNull(UUIDType)}, authorId: {type: new GraphQLNonNull(UUIDType)}},
      resolve: async (_root, args: { userId, authorId }, context: {prisma: PrismaClient}, _info) => {
        const changedUser = await context.prisma.user.update({
          where: {
            id: args.userId,
          },
          data: {
            userSubscribedTo: {
              create: {
                authorId: args.authorId,
              },
            },
          },
        })
        return changedUser;
      },
    },
    unsubscribeFrom: {
      type: GraphQLBoolean,
      args: { userId: {type: new GraphQLNonNull(UUIDType)}, authorId: {type: new GraphQLNonNull(UUIDType)}},
      resolve: async (_root, args: { userId, authorId }, context: {prisma: PrismaClient}, _info) => {
        try {
          const deletedSubscriber = await context.prisma.subscribersOnAuthors.delete({
            where: {
              subscriberId_authorId: {
                subscriberId: args.userId,
                authorId: args.authorId,
              },
            },
          });
          return deletedSubscriber ? true : false;
        } catch (error) {
          return false;
        }
      },
    }
  }
})

export const schemaGraphql = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});
