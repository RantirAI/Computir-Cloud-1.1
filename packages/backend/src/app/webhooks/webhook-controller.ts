import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { WebhookUrlParams } from "@activepieces/shared";
import { webhookService } from "./webhook-service";

export const webhookController: FastifyPluginAsync = async (app) => {
    app.all(
        "/:flowId",
        {
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            await handler(request, request.params.flowId);
            await reply.status(StatusCodes.OK).send();
        }
    );

    app.all(
        "/",
        {
            schema: {
                querystring: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Querystring: WebhookUrlParams }>, reply) => {
            await handler(request, request.query.flowId);
            await reply.status(StatusCodes.OK).send();
        }
    );
};

const handler = async (request: FastifyRequest, flowId: string) => {
    await webhookService.callback({
        flowId: flowId,
        payload: {
            method: request.method,
            headers: request.headers as Record<string, string>,
            body: request.body,
            queryParams: request.query as Record<string, string>,
        },
    });
};
