-- Der Admin hat den Spielstand zurückgesetzt oder ersetzt. Ein Puffer im Browser, der älter ist als dieser Zeitpunkt,
-- gilt nicht mehr (spiel/js/online/sync.js) – sonst käme der alte Stand beim nächsten Start zurück.
create table if not exists spielstand_verworfen (
  user_id text primary key references "user"(id) on delete cascade,
  zeitpunkt timestamptz not null
);
