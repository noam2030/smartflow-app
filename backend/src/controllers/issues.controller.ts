import type { FastifyReply, FastifyRequest } from 'fastify';
import type { IIssuesService } from '../services/issues.service.js';
import type { CreateIssueRequest, GetIssuesQuery, UpdateIssueStatusRequest } from '../types/issues.js';

export class IssuesController {
  private issuesService: IIssuesService;

  constructor(issuesService: IIssuesService) {
    this.issuesService = issuesService;
  }

  createIssue = async (
    request: FastifyRequest<{ Body: CreateIssueRequest }>,
    reply: FastifyReply
  ) => {
    const issue = await this.issuesService.createIssue(request.body);
    return reply.status(201).send({
      success: true,
      data: issue,
    });
  };

  getIssues = async (
    request: FastifyRequest<{ Querystring: GetIssuesQuery }>,
    reply: FastifyReply
  ) => {
    const data = await this.issuesService.getIssues(request.query);
    return reply.status(200).send({
      success: true,
      data,
    });
  };

  getIssueById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const issue = await this.issuesService.getIssueById(request.params.id);
    return reply.status(200).send({
      success: true,
      data: issue,
    });
  };

  updateIssueStatus = async (
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateIssueStatusRequest }>,
    reply: FastifyReply
  ) => {
    const issue = await this.issuesService.updateIssueStatus(
      request.params.id,
      request.body.status
    );
    return reply.status(200).send({
      success: true,
      data: issue,
    });
  };
}
