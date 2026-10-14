import { Client } from '@elastic/elasticsearch';
import { config } from './index';

const esClient = new Client({
  node: config.ELASTICSEARCH_URL,
});

export default esClient;
