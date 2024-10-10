import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { DEFAULT_CONFIG_PATH, getConfig, JSONbigNative } from '@cerc-io/util';

import { Event } from './entity/Event';
import { Database } from './database';

const main = async () => {
  const argv = getArgv();
  const config: any = await getConfig(argv.configFile);

  const database = new Database(config.database);
  await database.init();

  const eventRepository = database._conn.getRepository(Event);

  // Get the total count of events
  const totalEvents = await eventRepository.count();

  const batchSize = Number(argv.batchSize);
  let page = 0;
  let processedCount = 0;
  let eventsWithNullData: Event[];

  while (processedCount < totalEvents) {
    // Fetch events in batches with pagination
    eventsWithNullData = await eventRepository.find({
      order: { id: 'ASC' },
      skip: page * batchSize,
      take: batchSize
    });

    for (const event of eventsWithNullData) {
      // Parse extra info and check if data field is present
      const parsedExtraInfo = JSON.parse(event.extraInfo);

      // Derive data and topics
      if (parsedExtraInfo.data) {
        event.data = parsedExtraInfo.data;
        [event.topic0, event.topic1, event.topic2, event.topic3] = parsedExtraInfo.topics;

        // Update extraInfo
        delete parsedExtraInfo.data;
        delete parsedExtraInfo.topics;

        event.extraInfo = JSONbigNative.stringify(parsedExtraInfo);
      }
    }

    // Save updated events
    await eventRepository.save(eventsWithNullData);

    // Update the processed count and progress
    processedCount += eventsWithNullData.length;
    const progress = ((processedCount / totalEvents) * 100).toFixed(2);
    console.log(`Processed ${processedCount}/${totalEvents} events (${progress}% complete)`);

    // Move to the next batch
    eventsWithNullData = [];
    page++;
  }

  console.log('Done.');
  await database.close();
};

const getArgv = (): any => {
  return yargs(hideBin(process.argv))
    .option('f', {
      alias: 'config-file',
      describe: 'configuration file path (toml)',
      type: 'string',
      default: DEFAULT_CONFIG_PATH
    })
    .option('b', {
      alias: 'batch-size',
      describe: 'batch size to process events in',
      type: 'number',
      default: 1000
    })
    .argv;
};

main().catch(err => {
  console.log(err);
}).finally(() => {
  process.exit();
});
