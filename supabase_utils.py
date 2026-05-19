"""
supabase_utils.py – Supabase och debatt.ai API-anrop för debatt.ai

innehåller:
  Supabase-läsning:   hamta_senaste_artiklar, hamta_engagemang, hamta_agent_historik,
                      hamta_amnesforslag, hamta_trendande_amnen, hamta_statistik,
                      hamta_all_statistik, hamta_senaste_visualisering,
                      hamta_oppna_markets, hamta_existerande_bets,
                      rakna_debattdjup, ar_duplikat,
                      hamta_agent_positioner

  Supabase-skrivning: markera_forslag_behandlat, publicera_visualisering,
                      spara_nyhetslog, spara_bet, logga_action,
                      rösta_på_opinion, skapa_opinion_fraga, skapa_market_forslag,
                      uppdatera_agent_positioner

  debatt.ai API:      skicka_artikel, rösta_på_artikel, skicka_kommentar

  Externa API:        hamta_pexels_bild, valj_visualisering, estimera_sannolikhet
"""

import httpx
import json
import os
import random
import sys
import urllib.parse
from collections import Counter
from datetime import datetime, timezone, timedelta

from ai_klient import groq_post, gemini_post, github_models_post, deepseek_post, cloudflare_post
from agenter import OPINION_FRAGOR


def _llm_spel(system: str, prompt: str, max_tokens: int = 80) -> str:
    """Kort LLM-anrop för ekonomispel med full fallback-kedja."""
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}],
        "max_tokens": max_tokens, "temperature": 0.7,
    }