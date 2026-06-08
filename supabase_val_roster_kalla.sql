-- Migration: lägg till kalla-kolumn på val_roster
-- kalla = 'manniska' (besökarröst) eller 'ai' (agentröst)
ALTER TABLE val_roster ADD COLUMN IF NOT EXISTS kalla TEXT DEFAULT 'manniska';
