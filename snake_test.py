#!/usr/bin/env python3
"""
snake_test.py — AI-agenter spelar Snake
Körs dagligen via GitHub Actions. Varje körning väljer 2–4 slumpmässiga agenter
som spelar Snake med en BFS-algoritm och sparar resultaten i snake_poang-tabellen.
Dessutom simuleras en agent-vs-agent-utmaning med ~50% sannolikhet.
"""

import os
import random
import sys
from collections import deque

import requests

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

COLS, ROWS = 20, 20

AGENTER = [
    {"namn": "Pensionären",          "hastighet": 140, "mål": 5},
    {"namn": "Mamman",               "hastighet": 130, "mål": 7},
    {"namn": "Den lugna",            "hastighet": 125, "mål": 8},
    {"namn": "Den trötta",           "hastighet": 125, "mål": 6},
    {"namn": "Optimisten",           "hastighet": 100, "mål": 12},
    {"namn": "Den nostalgiske",      "hastighet": 95,  "mål": 13},
    {"namn": "Hypokondrikern",       "hastighet": 95,  "mål": 14},
    {"namn": "Den sura",             "hastighet": 90,  "mål": 15},
    {"namn": "Den stressade",        "hastighet": 85,  "mål": 16},
    {"namn": "Journalist",           "hastighet": 72,  "mål": 22},
    {"namn": "Läkare",               "hastighet": 68,  "mål": 24},
    {"namn": "Psykolog",             "hastighet": 68,  "mål": 25},
    {"namn": "Sociolog",             "hastighet": 65,  "mål": 26},
    {"namn": "Historiker",           "hastighet": 65,  "mål": 28},
    {"namn": "Miljöaktivist",        "hastighet": 52,  "mål": 32},
    {"namn": "Filosof",              "hastighet": 50,  "mål": 35},
    {"namn": "Nationalekonom",       "hastighet": 48,  "mål": 38},
    {"namn": "Jurist",               "hastighet": 45,  "mål": 40},
    {"namn": "Konservativ debattör", "hastighet": 43,  "mål": 42},
    {"namn": "Den rike",             "hastighet": 40,  "mål": 45},
    {"namn": "Teknikoptimist",       "hastighet": 38,  "mål": 50},
    {"namn": "Den hungriga",         "hastighet": 36,  "mål": 52},
    {"namn": "Kryptoanalytiker",     "hastighet": 33,  "mål": 60},
    {"namn": "Tonåringen",           "hastighet": 28,  "mål": 70},
]


# ──────────────────────────────────────────────
# Spellogik
# ──────────────────────────────────────────────

def bfs_next(snake, food):
    """BFS till maten. Returnerar (dx, dy) för nästa drag, eller en säker fallback."""
    occupied = {(s["x"], s["y"]) for s in snake}
    sx, sy = snake[0]["x"], snake[0]["y"]
    fx, fy = food["x"], food["y"]

    queue = deque([((sx, sy), None)])
    visited = {(sx, sy)}

    while queue:
        (x, y), first = queue.popleft()
        for dx, dy in [(0, -1), (1, 0), (0, 1), (-1, 0)]:
            nx, ny = x + dx, y + dy
            step = first if first is not None else (dx, dy)
            if (nx, ny) == (fx, fy):
                return step
            if 0 <= nx < COLS and 0 <= ny < ROWS and (nx, ny) not in visited and (nx, ny) not in occupied:
                visited.add((nx, ny))
                queue.append(((nx, ny), step))

    # Ingen väg — välj ett säkert drag
    for dx, dy in [(0, -1), (1, 0), (0, 1), (-1, 0)]:
        nx, ny = sx + dx, sy + dy
        if 0 <= nx < COLS and 0 <= ny < ROWS and (nx, ny) not in occupied:
            return (dx, dy)
    return None


def simulate_game(target_mal, error_rate):
    """
    Simulerar ett Snake-spel med BFS + slumpfaktor.
    Returnerar (poäng, vann).
    error_rate: sannolikhet att göra ett icke-optimalt drag (simulerar mänskliga misstag).
    """
    snake = [
        {"x": COLS // 2,     "y": ROWS // 2},
        {"x": COLS // 2 - 1, "y": ROWS // 2},
        {"x": COLS // 2 - 2, "y": ROWS // 2},
    ]

    def rand_food():
        occupied = {(s["x"], s["y"]) for s in snake}
        while True:
            p = (random.randint(0, COLS - 1), random.randint(0, ROWS - 1))
            if p not in occupied:
                return {"x": p[0], "y": p[1]}

    food = rand_food()
    score = 0

    for _ in range(30000):
        move = bfs_next(snake, food)
        if move is None:
            break

        # Med viss sannolikhet, välj ett slumpmässigt säkert drag istället för BFS
        if random.random() < error_rate:
            hx, hy = snake[0]["x"], snake[0]["y"]
            occupied = {(s["x"], s["y"]) for s in snake}
            safe = [
                (dx, dy)
                for dx, dy in [(0, -1), (1, 0), (0, 1), (-1, 0)]
                if 0 <= hx + dx < COLS and 0 <= hy + dy < ROWS
                and (hx + dx, hy + dy) not in occupied
            ]
            if safe:
                move = random.choice(safe)

        dx, dy = move
        new_head = {"x": snake[0]["x"] + dx, "y": snake[0]["y"] + dy}

        if not (0 <= new_head["x"] < COLS and 0 <= new_head["y"] < ROWS):
            break
        if any(s["x"] == new_head["x"] and s["y"] == new_head["y"] for s in snake):
            break

        snake.insert(0, new_head)

        if new_head["x"] == food["x"] and new_head["y"] == food["y"]:
            score += 1
            if score >= target_mal:
                return score, True
            food = rand_food()
        else:
            snake.pop()

    return score, False


def error_for_agent(agent):
    """
    Felfrekvens skalad efter agentens svårighet.
    Lättare agenter (hög hastighet) = lägre felmarginal (agenten spelar bättre).
    Svårare agenter (låg hastighet) = något högre felmarginal (mer utmanande mål).
    Intervall: 0.04–0.12
    """
    lo, hi = 28, 140
    ratio = (agent["hastighet"] - lo) / (hi - lo)
    return round(0.04 + ratio * 0.08, 3)


# ──────────────────────────────────────────────
# Supabase
# ──────────────────────────────────────────────

def spara_poang(spelnamn, agent_namn, poang, vann):
    """Sparar ett spelresultat i snake_poang-tabellen."""
    headers = {
        "Content-Type": "application/json",
        "apikey": SB_KEY,
        "Authorization": f"Bearer {SB_KEY}",
    }
    data = {
        "spelnamn": spelnamn,
        "agent_namn": agent_namn,
        "poang": poang,
        "vann": vann,
    }
    try:
        r = requests.post(
            f"{SB_URL}/rest/v1/snake_poang",
            json=data,
            headers=headers,
            timeout=10,
        )
        if r.status_code not in (200, 201):
            print(f"    HTTP {r.status_code}: {r.text[:200]}", file=sys.stderr)
            return False
        return True
    except Exception as e:
        print(f"    Nätverksfel: {e}", file=sys.stderr)
        return False


# ──────────────────────────────────────────────
# Huvudflöde
# ──────────────────────────────────────────────

def main():
    if not SB_KEY:
        print("FEL: SUPABASE_ANON_KEY saknas", file=sys.stderr)
        sys.exit(1)

    n_spel = random.randint(2, 4)
    spelare = random.sample(AGENTER, n_spel)

    print(f"🐍 Snake-körning — {n_spel} spel")

    resultat = []

    for agent in spelare:
        err = error_for_agent(agent)
        score, vann = simulate_game(agent["mål"], err)

        spelnamn = agent["namn"]  # agenten spelar som sig själv
        ok = spara_poang(spelnamn, agent["namn"], score, vann)

        emoji = "🏆" if vann else "💀"
        print(f"  {emoji} {agent['namn']}: {score}/{agent['mål']} (err={err}) {'✓' if ok else '✗'}")

        resultat.append({"agent": agent, "score": score, "vann": vann})

    # ── Utmaning: en agent utmanar en annan ──
    if len(resultat) >= 2 and random.random() < 0.6:
        par = random.sample(resultat, 2)
        utmanare = par[0]["agent"]
        utmanad = par[1]["agent"]

        # Utmanaren spelar mot den utmanadens svårighetsnivå
        err = error_for_agent(utmanare)
        c_score, c_vann = simulate_game(utmanad["mål"], err)

        # spelnamn visar vem som utmanar vem
        c_spelnamn = utmanare["namn"][:16] + " >" if len(utmanare["namn"]) > 16 else utmanare["namn"]
        ok = spara_poang(c_spelnamn, utmanad["namn"], c_score, c_vann)

        emoji = "🏆" if c_vann else "💀"
        print(
            f"  {emoji} UTMANING: {utmanare['namn']} utmanar {utmanad['namn']}: "
            f"{c_score}/{utmanad['mål']} {'✓' if ok else '✗'}"
        )

    print("Klar.")


if __name__ == "__main__":
    main()
