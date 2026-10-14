import esClient from '../config/elasticsearch';
import { Email } from '@prisma/client';

const EMAIL_INDEX = 'emails';

export async function initEmailIndex() {
  const exists = await esClient.indices.exists({ index: EMAIL_INDEX });
  if (!exists) {
    await esClient.indices.create({
      index: EMAIL_INDEX,
      body: {
        mappings: {
          properties: {
            toEmail: { type: 'keyword' },
            subject: { type: 'text' },
            body: { type: 'text' },
            status: { type: 'keyword' },
            scheduledAt: { type: 'date' },
            sentAt: { type: 'date' },
            userId: { type: 'keyword' },
          },
        },
      },
    });
  }
}

export async function indexEmail(email: Email) {
  await esClient.index({
    index: EMAIL_INDEX,
    id: email.id,
    body: {
      toEmail: email.toEmail,
      subject: email.subject,
      body: email.body,
      status: email.status,
      scheduledAt: email.scheduledAt,
      sentAt: email.sentAt,
      userId: email.userId,
    },
  });
}

export async function searchEmails(userId: string, query: string, from: number = 0, size: number = 20) {
  const result = await esClient.search({
    index: EMAIL_INDEX,
    from,
    size,
    body: {
      query: {
        bool: {
          must: [
            { term: { userId } },
            {
              multi_match: {
                query,
                fields: ['subject^2', 'body', 'toEmail'],
              },
            },
          ],
        },
      },
      sort: [{ scheduledAt: 'desc' }],
    },
  });

  return result.hits.hits.map((hit: any) => ({
    id: hit._id,
    ...hit._source,
  }));
}
