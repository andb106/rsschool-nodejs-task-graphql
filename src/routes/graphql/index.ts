import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema, schemaGraphql } from './schemas.js';
import { graphql, parse, validate } from 'graphql';
import depthLimit from 'graphql-depth-limit';

const DEPTH_LIMIT = 5;

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const queryStr = req.body.query.toString();

      const validateErrors = validate(schemaGraphql, parse(queryStr), [depthLimit(DEPTH_LIMIT)]);

      if (validateErrors.length) {
        return { errors: validateErrors};
      }

      const res = await graphql({
        schema: schemaGraphql,
        source: queryStr,
        contextValue: { prisma },
        variableValues: req.body.variables,
      })

      return res;
    },
  });
};

export default plugin;
