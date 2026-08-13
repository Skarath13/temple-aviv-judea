import assert from 'node:assert/strict';
import test from 'node:test';
import { selectUpcomingEventRecords } from '../src/lib/upcoming-events.mjs';

const event = (overrides = {}) => ({
  published: true,
  title: 'Shabbat gathering',
  startsAt: '2026-08-15T18:00:00.000Z',
  endsAt: '2026-08-15T20:00:00.000Z',
  location: 'Temple Aviv Judea',
  summary: 'A community gathering.',
  image: '/images/og.png',
  imageAlt: 'Congregants gathering',
  ...overrides,
});

test('filters unpublished and ended events while keeping an event in progress', () => {
  const now = new Date('2026-08-15T19:00:00.000Z');
  const inProgress = event();
  const result = selectUpcomingEventRecords({
    events: [
      event({ published: false }),
      event({ endsAt: '2026-08-15T18:59:59.000Z' }),
      inProgress,
    ],
  }, now);

  assert.equal(result.length, 1);
  assert.equal(result[0].source, inProgress);
});

test('sorts chronologically and limits the homepage to three events', () => {
  const records = [5, 2, 4, 1, 3].map((hour) => event({
    title: `Event ${hour}`,
    startsAt: `2026-08-16T0${hour}:00:00.000Z`,
    endsAt: `2026-08-16T0${hour + 1}:00:00.000Z`,
  }));
  const result = selectUpcomingEventRecords(
    { events: records },
    new Date('2026-08-15T00:00:00.000Z'),
  );

  assert.deepEqual(result.map(({ title }) => title), ['Event 1', 'Event 2', 'Event 3']);
});

test('preserves image accessibility text and trims an optional details URL', () => {
  const result = selectUpcomingEventRecords({ events: [event({
    imageAlt: 'A meaningful description',
    detailsUrl: '  /visit/  ',
  })] }, new Date('2026-08-15T00:00:00.000Z'));

  assert.deepEqual(result[0].image, {
    src: '/images/og.png',
    alt: 'A meaningful description',
  });
  assert.equal(result[0].detailsUrl, '/visit/');
});

test('rejects invalid clocks, incomplete published events, and invalid lifecycles', () => {
  assert.throws(
    () => selectUpcomingEventRecords({ events: [] }, new Date('invalid')),
    /clock is invalid/,
  );
  assert.throws(
    () => selectUpcomingEventRecords({ events: [event({ imageAlt: '' })] }),
    /missing a required field/,
  );
  assert.throws(
    () => selectUpcomingEventRecords({ events: [event({ startsAt: 'invalid' })] }),
    /invalid date/,
  );
  assert.throws(
    () => selectUpcomingEventRecords({ events: [event({
      endsAt: '2026-08-15T17:00:00.000Z',
    })] }),
    /must end after it starts/,
  );
});
