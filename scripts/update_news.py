#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Robot autonome de mise à jour du site News Informatique.

Exécuté par GitHub Actions (voir .github/workflows/update-news.yml) :
lit les flux RSS des sources hardware, filtre les news pertinentes des
derniers jours, régénère la section « flux automatique » d'index.html,
met à jour data/latest.json (signal d'alerte PWA) et la version du
service worker. Aucune dépendance hors bibliothèque standard.
"""

import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

FEEDS = [
    ("VideoCardz",     "https://videocardz.com/feed"),
    ("Cowcotland",     "https://feeds.feedburner.com/cowcotland"),
    ("Hardware & Co",  "https://hardwareand.co/actualites?format=feed&type=rss"),
    ("Tom's Hardware", "https://www.tomshardware.com/feeds/all"),
    ("TechPowerUp",    "https://www.techpowerup.com/rss/news"),
    ("Phoronix",       "https://www.phoronix.com/rss.php"),
    ("The Verge",      "https://www.theverge.com/rss/index.xml"),
]

# Ne retenir que les news à impact hardware/informatique réel
KEYWORDS = [
    "gpu", "geforce", "radeon", "rtx", "rdna", "carte graphique", "graphics card",
    "cpu", "ryzen", "core ultra", "processeur", "processor", "zen 6", "zen6",
    "nova lake", "threadripper", "epyc", "xeon",
    "ddr4", "ddr5", "ddr6", "ram", "mémoire", "memory", "dram",
    "ssd", "nvme", "nand", "stockage", "storage",
    "écran", "ecran", "moniteur", "monitor", "oled", "qd-oled", "display",
    "driver", "pilote", "adrenalin", "game ready", "dlss", "fsr",
    "sécurité", "securite", "security", "faille", "vulnerab", "exploit",
    "benchmark", "nvidia", "amd", "intel", "prix", "price", "pricing",
    "windows 11", "windows 12", "linux", "carte mère", "motherboard",
]

MAX_ITEMS = 12
MAX_AGE_DAYS = 4
MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
           "août", "septembre", "octobre", "novembre", "décembre"]


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA,
                                               "Accept": "application/rss+xml, application/xml, text/xml, */*"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def strip_tags(text):
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def parse_date(value):
    if not value:
        return None
    value = value.strip()
    try:
        return parsedate_to_datetime(value)  # RFC 822 (RSS)
    except (TypeError, ValueError):
        pass
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))  # ISO (Atom)
    except ValueError:
        return None


def parse_feed(source, raw):
    """Retourne [(titre, lien, date, description)] pour RSS 2.0 ou Atom."""
    out = []
    root = ET.fromstring(raw)
    ns = {"atom": "http://www.w3.org/2005/Atom"}

    for item in root.iter("item"):  # RSS 2.0
        title = strip_tags(item.findtext("title"))
        link = (item.findtext("link") or "").strip()
        date = parse_date(item.findtext("pubDate"))
        desc = strip_tags(item.findtext("description"))
        if title and link:
            out.append((title, link, date, desc))

    for entry in root.iter("{http://www.w3.org/2005/Atom}entry"):  # Atom
        title = strip_tags(entry.findtext("atom:title", namespaces=ns))
        link_el = entry.find("atom:link[@rel='alternate']", ns)
        if link_el is None:
            link_el = entry.find("atom:link", ns)
        link = link_el.get("href").strip() if link_el is not None else ""
        date = parse_date(entry.findtext("atom:published", namespaces=ns) or
                          entry.findtext("atom:updated", namespaces=ns))
        desc = strip_tags(entry.findtext("atom:summary", namespaces=ns) or
                          entry.findtext("atom:content", namespaces=ns))
        if title and link:
            out.append((title, link, date, desc))

    return [(source, t, l, d, s) for (t, l, d, s) in out]


def collect():
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=MAX_AGE_DAYS)
    items, seen = [], set()

    for source, url in FEEDS:
        try:
            entries = parse_feed(source, fetch(url))
            print(f"[ok] {source}: {len(entries)} entrées")
        except Exception as e:  # un flux en panne ne doit pas tuer le robot
            print(f"[!!] {source}: {e}", file=sys.stderr)
            continue

        for src, title, link, date, desc in entries:
            if date is None or date < cutoff:
                continue
            text = (title + " " + desc).lower()
            if not any(k in text for k in KEYWORDS):
                continue
            key = re.sub(r"\W+", "", title.lower())[:80]
            if key in seen:
                continue
            seen.add(key)
            items.append((src, title, link, date, desc[:230] + ("…" if len(desc) > 230 else "")))

    items.sort(key=lambda x: x[3], reverse=True)
    return items[:MAX_ITEMS]


def date_fr(dt):
    local = dt.astimezone(timezone(timedelta(hours=2)))  # Europe/Paris (été)
    return f"{local.day} {MOIS_FR[local.month - 1]} {local.year}"


def render(items):
    lis = []
    for src, title, link, date, desc in items:
        lis.append(
            '    <li>\n'
            f'      <b><a href="{html.escape(link, quote=True)}" target="_blank" rel="noopener">{html.escape(title)}</a></b>\n'
            + (f'      <p>{html.escape(desc)}</p>\n' if desc else '')
            + f'      <span class="src">{html.escape(src)} — {date_fr(date)}</span>\n'
            '    </li>'
        )
    return "\n".join(lis)


def main():
    items = collect()
    if not items:
        print("Aucune news pertinente trouvée : pas de mise à jour (pas de fausse alerte).")
        return 0

    now = datetime.now(timezone.utc)
    today_fr = date_fr(now)
    iso = now.isocalendar()
    edition = f"{iso.year}-S{iso.week:02d}"
    stamp = now.strftime("%Y%m%dT%H%M")

    # 1. index.html — remplace le bloc entre les marqueurs AUTO-NEWS
    index = ROOT / "index.html"
    content = index.read_text(encoding="utf-8")
    new_block = f"<!-- AUTO-NEWS-START -->\n{render(items)}\n<!-- AUTO-NEWS-END -->"
    content, n = re.subn(r"<!-- AUTO-NEWS-START -->.*?<!-- AUTO-NEWS-END -->",
                         new_block, content, flags=re.S)
    if n != 1:
        print("ERREUR : marqueurs AUTO-NEWS introuvables dans index.html", file=sys.stderr)
        return 1
    content = re.sub(r"Dernière mise à jour : [^·<]+",
                     f"Dernière mise à jour : {today_fr} ", content, count=1)
    index.write_text(content, encoding="utf-8", newline="\n")

    # 2. data/latest.json — signal d'alerte pour l'application (PWA)
    latest = {
        "edition": edition,
        "updated": now.strftime("%Y-%m-%d"),
        "titre": f"Flux du {today_fr} : " + items[0][1][:110],
    }
    (ROOT / "data" / "latest.json").write_text(
        json.dumps(latest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8", newline="\n")

    # 3. sw.js — nouvelle version de cache pour rafraîchir le hors-ligne
    sw = ROOT / "sw.js"
    sw_txt, n = re.subn(r"const VERSION = '[^']+';",
                        f"const VERSION = '{edition}-auto{stamp}';",
                        sw.read_text(encoding="utf-8"), count=1)
    if n != 1:
        print("ERREUR : constante VERSION introuvable dans sw.js", file=sys.stderr)
        return 1
    sw.write_text(sw_txt, encoding="utf-8", newline="\n")

    print(f"MAJ effectuée : {len(items)} news, édition {edition}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
