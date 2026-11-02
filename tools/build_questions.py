"""Builds packages/server/data/questions.seed.json from the tables in tools/questions/*.py.

THE SEED BANK IS PLACEHOLDER CONTENT. The answers, descriptions and rarity tiers were written from memory by the assistant that
built Phase 1. They have not been checked against sources and the tiers are rough guesses at how familiar an answer is. The real
pipeline (project notes, section 8) replaces this with generated, source-checked questions and stored answer decisions.

    python3 tools/build_questions.py
"""
import importlib, json, os, pkgutil, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, 'questions'))

CATEGORIES = ['Places', 'Food', 'Music', 'Miscellaneous', 'Animals & Nature', 'Movies & TV', 'Sports', 'Games',
              'Science & Technology', 'History & Mythology', 'Transport & Vehicles']

questions = []
for m in sorted(pkgutil.iter_modules([os.path.join(ROOT, 'questions')]), key=lambda x: x.name):
    mod = importlib.import_module(m.name)
    for q in mod.QUESTIONS:
        assert q['category'] in CATEGORIES, q['category']
        seen = set()
        for a in q['answers']:
            assert 0 <= a[1] <= 5, (q['id'], a)
            key = a[0].lower()
            assert key not in seen, ('duplicate answer', q['id'], a[0])
            seen.add(key)
        questions.append(dict(
            id=q['id'], category=q['category'], prompt=q['prompt'], rules=q['rules'],
            answers=[dict(name=a[0], tier=a[1], **({'desc': a[2]} if len(a) > 2 and a[2] else {}), **({'aliases': a[3]} if len(a) > 3 and a[3] else {})) for a in q['answers']],
            **({'rejects': q['rejects']} if q.get('rejects') else {}),
        ))

bank = dict(
    version='seed-1',
    note='Placeholder bank written from memory. Answers, descriptions and tiers are unverified guesses. See tools/build_questions.py.',
    categories=CATEGORIES, questions=questions,
)
out = os.path.join(ROOT, '..', 'packages', 'server', 'data', 'questions.seed.json')
json.dump(bank, open(out, 'w'), ensure_ascii=False, indent=1)
print('wrote', len(questions), 'questions,', sum(len(q['answers']) for q in questions), 'answers')
