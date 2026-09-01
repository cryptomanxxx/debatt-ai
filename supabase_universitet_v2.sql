-- AI-Universitetet v2: arXiv som forskningsinspiration
-- Kör i Supabase SQL Editor efter supabase_universitet.sql
--
-- forskning_test.py hämtar ibland en riktig, nyligen publicerad arXiv-artikel
-- ur nyhetsflode (samma data som visas på /nyhetskallor) och låter en
-- forskaragent utgå från den. arxiv_kalla sparar vilken artikel som användes,
-- så /universitet kan visa en källhänvisning — samma mönster som
-- nyhetskalla på artiklar (se supabase_utils.py).

ALTER TABLE vetenskapliga_upptagter
  ADD COLUMN IF NOT EXISTS arxiv_kalla jsonb;
