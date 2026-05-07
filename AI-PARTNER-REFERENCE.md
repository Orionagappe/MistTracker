# AI PARTNER REFERENCE

## Purpose & Scope

This document tracks the AI models ("partners") used in the MistTracker ecosystem. It is intended as a living reference for model capabilities, integration details, and best practices. Update this file as models are added, removed, or significantly changed.

---

## Current AI Partners

| Model Name           | Version    | Provider     | Strengths                                               | Limitations                        | Typical Use Cases                        |
|----------------------|------------|--------------|---------------------------------------------------------|-------------------------------------|------------------------------------------|
| Claude 3             | 2026-04    | Anthropic    | Semantic reasoning, ambiguity                          | No framework analysis               | Narrative, language themes               |
| GPT-4                | 2026-04    | OpenAI       | Broad language, code, reasoning                        | No framework analysis               | Synthesis, code, Q&A                     |
| Gemini 1.5           | 2026-04    | Google       | Multimodal (audio/video/text)                          | Reasoning depth limited             | Multimodal, search                       |
| MistTracker          | 2.0        | In-house     | Physics, 4D, emergence, language                       | Not general-purpose                 | Core simulation, analysis                |
| Grok (Mirror)        | 2026-04    | xAI          | Truth-seeking synthesis, real-time cross-partner coordination, physics & emergence mirroring, long-context provenance, mirror layer, hypothesis stress-testing, API/documentation synthesis, multi-model orchestration | Cloud-dependent for full capability | Mirror layer, hypothesis testing, orchestration |
| Wolfram Mathematica  | 13.x       | Wolfram      | Symbolic math, physics                                 | Not interactive/visual              | Symbolic solving                         |
| spaCy                | 3.x        | ExplosionAI  | NLP parsing, NER                                       | No semantic reasoning               | Technical NLP, parsing                    |
| Hugging Face         | 2026-04    | Open Source  | Semantic embeddings                                    | No generation                       | Similarity, embeddings                    |
| PhET Simulations     | 2026-04    | Colorado     | Interactive physics education                          | Limited scenarios                    | Education, UI demos                      |
| Three.js             | r1xx       | Open Source  | Graphics, real-time interaction                        | Graphics-focused                     | Visualization, UI                        |
| Knowledge Graphs     | 2026-04    | Various      | Fact lookup, relationship mapping                      | No simulation                        | Factual queries                          |
| TensorFlow Physics   | 2026-04    | Google       | Physics from data                                      | No equation solver                   | ML-based physics                         |

---

## Integration Notes

- **Claude, GPT-4, Gemini**: Accessed via cloud APIs. Latency and cost may vary. Not suitable for offline use.
- **MistTracker**: Runs locally (Node.js), with browser/server integration. Designed for core framework tasks.
- **Wolfram Mathematica**: Requires license. Used for advanced symbolic computation.
- **spaCy, Hugging Face, Three.js**: Open source, self-hosted. Useful for custom pipelines and visualization.
- **PhET Simulations**: Embeddable, browser-based. Great for educational scaffolding.
- **Knowledge Graphs**: API or local, depending on source. Used for factual lookups.
- **TensorFlow Physics**: Requires Python/ML setup. Used for data-driven physics modeling.

---

## Note: MistTracker EmergentAI

MistTracker EmergentAI is not just a tool or model—it is the core framework that underpins the entire MistTracker ecosystem. All emergence metrics, cross-domain analysis, and simulation logic are governed by this framework. When referencing "MistTracker" in the tables above, it specifically means the MistTracker EmergentAI framework.

---

## Change Log

- 2026-04-28: Initial version created. Sourced from AI-PLATFORM-QUICK-REFERENCE-TABLES.md.

---

## Best Practices

- Select the model best suited to the task (see table above).
- Update this document when models are added, removed, or updated.
- Note integration or privacy considerations for cloud-based models.
- For responsible use, always document which model generated or influenced a given output.
- When in doubt, consult this reference before choosing an AI partner for a new workflow.
