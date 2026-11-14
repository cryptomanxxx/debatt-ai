-- Vilken AI-modell som skrev direktdebattens summering ("provider · modell").
-- Valfri kolumn: /chatt sparar debatten utan den om migreringen inte körts.
alter table chatt_debatter add column if not exists summering_modell text;
