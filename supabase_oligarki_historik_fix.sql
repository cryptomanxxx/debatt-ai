-- Lägg till INSERT och UPDATE-policies på oligarki_historik
-- Kör i Supabase SQL Editor

create policy "public insert oligarki_historik"
  on oligarki_historik for insert with check (true);

create policy "public update oligarki_historik"
  on oligarki_historik for update using (true);
