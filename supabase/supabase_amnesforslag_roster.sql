-- Lägg till röstkolumn på ämnesförslagstabellen
ALTER TABLE amnesforslag ADD COLUMN IF NOT EXISTS roster int DEFAULT 0;
