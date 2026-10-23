"""Render supplied DOCX paragraphs verbatim; no paraphrasing or inferred data."""
from pathlib import Path
from zipfile import ZipFile
import html
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1] / 'public' / 'legal'
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}


def paragraphs(path):
    with ZipFile(path) as source:
        document = ET.fromstring(source.read('word/document.xml'))
    assert not document.findall('.//w:tbl', NS), 'Tables need an explicit renderer'
    assert not document.findall('.//w:numPr', NS), 'Automatic numbering needs an explicit renderer'
    return [''.join(node.text or '' if node.tag == f'{{{NS["w"]}}}t' else '\n' if node.tag == f'{{{NS["w"]}}}br' else '\t' if node.tag == f'{{{NS["w"]}}}tab' else '' for node in p.iter()) for p in document.findall('./w:body/w:p', NS)]


for slug, title in [('offer', 'Публичная оферта'), ('privacy', 'Политика конфиденциальности')]:
    source = paragraphs(ROOT / f'{slug}.docx')
    elements = []
    for index, text in enumerate(source):
        tag = 'h1' if index == 0 else 'h2' if re.match(r'^\d+\. ', text) else 'p'
        contents = html.escape(text).replace('\n', '<br>')
        contents = re.sub(r'Nadezhdasheyko@yandex\.ru', '<a href="mailto:Nadezhdasheyko@yandex.ru">Nadezhdasheyko@yandex.ru</a>', contents)
        elements.append(f'<{tag} class="doc-paragraph">{contents}</{tag}>')
    document = f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#4A1F24"><title>{title} — Бабки из блога</title><link rel="stylesheet" href="./legal.css"></head>
<body><header><a href="../">← Бабки из блога</a><nav aria-label="Юридические документы"><a href="./offer.html">Публичная оферта</a><a href="./privacy.html">Политика конфиденциальности</a></nav></header>
<main><article aria-label="{title}">{''.join(elements)}</article><p class="source"><a href="./{slug}.docx" download>Скачать исходный документ DOCX</a></p></main></body></html>
'''
    (ROOT / f'{slug}.html').write_text(document, encoding='utf-8')
    print(f'{slug}: {len(source)} original paragraphs preserved')
