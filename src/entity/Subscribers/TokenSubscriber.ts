import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent } from 'typeorm';

import { Token } from '../Token';

@EventSubscriber()
export class TokenSubscriber implements EntitySubscriberInterface<Token> {
  listenTo (): any {
    return Token;
  }

  async beforeInsert (event: InsertEvent<Token>): Promise<void> {
    // use .update
    await event.manager.query(`
      UPDATE token
      SET "token_search" = to_tsvector(CONCAT(symbol, ' ', name))`
    );
  }

  async beforeUpdate (event: UpdateEvent<Token>): Promise<void> {
    // use .update
    await event.manager.query(`
      UPDATE token
      SET "token_search" = to_tsvector(CONCAT(symbol, ' ', name))`
    );
  }
}
