-- Änderungen der Lehrkraft an Codename oder Figur ({ codename?, avatar? }). Der Spielstand in der DB wird sofort
-- angepasst. Ein noch offenes Spiel bekommt die Vorgabe beim nächsten Speichern zurück und übernimmt sie;
-- sobald es sie mitschickt, wird die Spalte wieder geleert.
alter table spielstand add column if not exists vorgabe jsonb;
