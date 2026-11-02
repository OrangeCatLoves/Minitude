import type { JsonSchema } from '../llm/types'
import { TIER_GUIDE } from '../judge/prompt'

// ------------------------------------------------------------------ 1. propose questions
export const PROPOSE_SYSTEM =
  'You write prompts for a trivia game. The player types ANY valid answer to a prompt such as "Name a type of cheese." and scores more for ' +
  'answers that fewer players would think of. Write prompts that make this fun and fair:\n' +
  '- Every prompt is one sentence starting with "Name a" or "Name an".\n' +
  '- A typical player can think of at least one answer at once, while a knowledgeable player has many less obvious ones. At least 80 different valid answers must exist, from household names to real but obscure ones.\n' +
  '- The rules sentence draws clear boundaries (real vs fictional, brands vs kinds, species vs broad groups, historical vs current) so that a judge can decide any answer. For facts that change over time, say "as of 2025".\n' +
  '- Avoid disputed origins, vague or subjective groupings, and topics that are sensitive (real tragedies, hot political issues, slurs).\n' +
  '- Prompts in a category must differ from each other and from the ones already used.\n' +
  'Write the rules as plain sentences a judge can apply; they are never shown to players.'

export const PROPOSE_SCHEMA: JsonSchema = {
  type: 'OBJECT',
  properties: {
    questions: { type: 'ARRAY', items: { type: 'OBJECT', properties: { prompt: { type: 'STRING' }, rules: { type: 'STRING' } }, required: ['prompt', 'rules'] } },
  },
  required: ['questions'],
}

export function proposePrompt(category: string, scope: string, example: string, existing: string[], count: number): string {
  return [
    `Category: ${category} (${scope}).`,
    `Example of the style: "${example}"`,
    existing.length ? `Prompts already used or rejected in this category (do not repeat or closely copy):\n- ${existing.join('\n- ')}` : 'No prompts used yet in this category.',
    `Write ${count} new prompt${count === 1 ? '' : 's'} with rules.`,
  ].join('\n\n')
}

// ------------------------------------------------------------------ 2. draft the answers
export const ANSWERS_SYSTEM =
  'You write the answer list for a trivia question. Only real answers that satisfy the rules belong in it. Fewer is better than one wrong answer.\n' +
  'Spread the answers over six rarity tiers by how unfamiliar each is to a casual English-speaking player:\n' + TIER_GUIDE + '\n' +
  'Write at least 10 answers in every tier (at least 8 in tier 5), 70 to 110 in total. Use each answer\'s most common English name with correct spelling. ' +
  'aliases are other common names or spellings of the SAME answer (at most 3, may be empty). desc is one plain sentence of at most 90 characters saying what it is. ' +
  'Never put the same answer twice, and never put an answer that breaks the rules.'

export const ANSWERS_SCHEMA: JsonSchema = {
  type: 'OBJECT',
  properties: {
    answers: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { name: { type: 'STRING' }, tier: { type: 'INTEGER' }, desc: { type: 'STRING' }, aliases: { type: 'ARRAY', items: { type: 'STRING' } } },
        required: ['name', 'tier', 'desc', 'aliases'],
      },
    },
  },
  required: ['answers'],
}

export const answersPrompt = (prompt: string, rules: string) => `Question: ${prompt}\nRules: ${rules}\n\nWrite the answer list.`

// ------------------------------------------------------------------ 3. audit
export const AUDIT_SYSTEM =
  'You are a strict fact-checker for a trivia game. You are given a question, its rules and a draft answer list written by someone else. ' +
  'Report only PROBLEMS. issue is one of: not_valid (not real, or breaks the rules), duplicate (same answer as another line), misspelled (wrong spelling of the name), ' +
  'tier_too_high or tier_too_low (the rarity tier is clearly wrong by two or more steps), unsure (you cannot confirm it is real). ' +
  'Also judge the question itself: set question_ok to false if it is ambiguous, has too few real answers, is badly bounded, or is sensitive, and say why in question_note. ' +
  'Do not repeat lines that are fine. Rarity tiers:\n' + TIER_GUIDE

export const AUDIT_SCHEMA: JsonSchema = {
  type: 'OBJECT',
  properties: {
    question_ok: { type: 'BOOLEAN' },
    question_note: { type: 'STRING' },
    problems: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          issue: { type: 'STRING', enum: ['not_valid', 'duplicate', 'misspelled', 'tier_too_high', 'tier_too_low', 'unsure'] },
          note: { type: 'STRING' },
        },
        required: ['name', 'issue', 'note'],
      },
    },
  },
  required: ['question_ok', 'question_note', 'problems'],
}

export function auditPrompt(prompt: string, rules: string, answers: { name: string; tier: number; aliases: string[] }[]): string {
  const lines = answers.map((a) => `${a.name} | tier ${a.tier}${a.aliases.length ? ' | also: ' + a.aliases.join(', ') : ''}`).join('\n')
  return `Question: ${prompt}\nRules: ${rules}\n\nDraft answers (name | tier | aliases):\n${lines}`
}
