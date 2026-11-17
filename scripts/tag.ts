/**
 * 공고 AI 태깅 스크립트 (검색 정확도 개선)
 *
 * 실행: npm run tag                       태깅할 공고 수와 예상 비용만 보여준다 (API 호출 없음)
 *       npm run tag -- --yes              실제로 태깅해 DB에 저장한다
 *       npm run tag -- --yes --limit 30   앞에서 30건만
 *       npm run tag -- --resume <batchId> 끝나지 않은 배치 결과를 이어서 받아 저장한다
 *
 * 하는 일: 원문 내용이 바뀌었거나 아직 태깅하지 않은 공고만 골라 Claude로 분류하고 태그를 고친다
 * - 기간 있는 공고는 Opus, 상시 혜택은 Haiku (src/domain/collect/aiTags.ts)
 * - 100건이 넘으면 Batch API(요금 절반, 보통 1시간 안에 끝남), 그 이하는 바로 호출한다
 * - 운영자가 고정한(is_locked) 공고, 태깅하는 사이 원문이 바뀐 공고는 저장하지 않는다
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  AiTagsSchema,
  TAG_MODEL_ALWAYS,
  TAG_MODEL_DATED,
  TAG_SYSTEM_PROMPT,
  normalizeAiTags,
  tagInputOf,
  tagModelOf,
  type AiTags,
} from "../src/domain/collect/aiTags";

// 50건 시험에서 잰 1건당 비용 (일반 호출 기준, 달러). Batch는 이 절반
const COST_PER_NOTICE: Record<string, number> = { [TAG_MODEL_DATED]: 0.0037, [TAG_MODEL_ALWAYS]: 0.0003 };
const BATCH_MIN = 100;
const CONCURRENCY = 5;

interface Candidate {
  id: string;
  source: "kstartup" | "gov24";
  isAlways: boolean;
  contentHash: string;
  rawPayload: Record<string, unknown>;
}

function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const outputFormat = zodOutputFormat(AiTagsSchema);

function paramsOf(c: Candidate) {
  return {
    model: tagModelOf(c.isAlways),
    max_tokens: 4000,
    output_config: { effort: "low" as const, format: { type: outputFormat.type, schema: outputFormat.schema } },
    system: [{ type: "text" as const, text: TAG_SYSTEM_PROMPT, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user" as const, content: tagInputOf(c.source, c.rawPayload) }],
  };
}

function parseTags(text: string): AiTags | null {
  try {
    const parsed = AiTagsSchema.safeParse(JSON.parse(text));
    return parsed.success ? normalizeAiTags(parsed.data) : null;
  } catch {
    return null;
  }
}

async function main() {
  // GitHub Actions에 키를 아직 등록하지 않았으면 수집 전체를 실패로 만들지 않고 태깅만 건너뛴다
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("ANTHROPIC_API_KEY가 없어 AI 태깅을 건너뜁니다.");
    return;
  }

  const { db, client: pg } = await import("../src/db/client");
  const { notice } = await import("../src/db/schema");
  const { and, asc, eq, gte, inArray, isNull, ne, or, sql } = await import("drizzle-orm");

  const save = async (c: Candidate, tags: AiTags) => {
    await db
      .update(notice)
      .set({
        regionCodes: tags.regions,
        ageGroups: tags.ages,
        industries: tags.industries,
        topics: tags.topics,
        minorsOnly: tags.minors_only,
        tagHash: c.contentHash,
        tagModel: tagModelOf(c.isAlways),
        taggedAt: new Date(),
      })
      // 태깅하는 사이 원문이 바뀌었거나 운영자가 고정했으면 저장하지 않는다
      .where(and(eq(notice.id, c.id), eq(notice.isLocked, false), eq(notice.contentHash, c.contentHash)));
  };

  const columns = {
    id: notice.id,
    source: notice.source,
    isAlways: notice.isAlways,
    contentHash: notice.contentHash,
    rawPayload: notice.rawPayload,
  };
  const anthropic = new Anthropic();
  const stats = { saved: 0, failed: 0 };

  // 배치 결과를 받아 저장한다 (새로 만든 배치, 또는 --resume으로 이어 받는 배치)
  const collectBatch = async (batchId: string) => {
    for (;;) {
      const batch = await anthropic.messages.batches.retrieve(batchId);
      const n = batch.request_counts;
      console.log(`  배치 ${batch.processing_status}: 처리 중 ${n.processing} · 성공 ${n.succeeded} · 실패 ${n.errored}`);
      if (batch.processing_status === "ended") break;
      await new Promise((r) => setTimeout(r, 30_000));
    }
    const results = [];
    for await (const result of await anthropic.messages.batches.results(batchId)) results.push(result);
    const ids = results.map((r) => r.custom_id);
    const rows = (await db.select(columns).from(notice).where(inArray(notice.id, ids))) as Candidate[];
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const result of results) {
      const c = byId.get(result.custom_id);
      const text =
        result.result.type === "succeeded"
          ? result.result.message.content.find((b) => b.type === "text")?.text
          : undefined;
      const tags = text ? parseTags(text) : null;
      if (!c || !tags) {
        stats.failed += 1;
        continue;
      }
      await save(c, tags);
      stats.saved += 1;
    }
  };

  const resumeId = argValue("--resume");
  if (resumeId) {
    await collectBatch(resumeId);
    console.log(`✓ 저장 ${stats.saved} · 실패 ${stats.failed}`);
    await pg.end({ timeout: 5 });
    return;
  }

  // 보드에 나올 수 있는 공고 중 아직 태깅하지 않았거나 원문이 바뀐 것. 사람이 먼저 보는 기간 있는 공고부터
  const today = new Date().toISOString().slice(0, 10);
  const limit = Number(argValue("--limit") ?? 0);
  const query = db
    .select(columns)
    .from(notice)
    .where(
      and(
        eq(notice.isHidden, false),
        eq(notice.isLocked, false),
        ne(notice.parseStatus, "check"),
        or(isNull(notice.applyEnd), gte(notice.applyEnd, today)),
        sql`${notice.contentHash} is not null`,
        sql`${notice.tagHash} is distinct from ${notice.contentHash}`,
      ),
    )
    .orderBy(asc(notice.isAlways), asc(notice.id));
  const candidates = (limit > 0 ? await query.limit(limit) : await query) as Candidate[];

  const useBatch = candidates.length > BATCH_MIN;
  const byModel = new Map<string, number>();
  for (const c of candidates) byModel.set(tagModelOf(c.isAlways), (byModel.get(tagModelOf(c.isAlways)) ?? 0) + 1);
  let estimate = 0;
  for (const [model, count] of byModel) {
    const cost = count * COST_PER_NOTICE[model] * (useBatch ? 0.5 : 1);
    estimate += cost;
    console.log(`  ${model}: ${count}건 · 약 $${cost.toFixed(2)}`);
  }
  console.log(`태깅 대상 ${candidates.length}건 · ${useBatch ? "Batch API" : "바로 호출"} · 예상 약 $${estimate.toFixed(2)}`);

  if (!process.argv.includes("--yes") || candidates.length === 0) {
    if (candidates.length > 0) console.log("실제로 태깅하려면 --yes를 붙여 다시 실행하세요.");
    await pg.end({ timeout: 5 });
    return;
  }

  if (useBatch) {
    const batch = await anthropic.messages.batches.create({
      requests: candidates.map((c) => ({ custom_id: c.id, params: paramsOf(c) })),
    });
    // 기다리다 끊겨도 이 번호로 이어 받을 수 있다
    console.log(`배치 생성: ${batch.id}  (중간에 끊기면 npm run tag -- --resume ${batch.id})`);
    await collectBatch(batch.id);
  } else {
    for (let i = 0; i < candidates.length; i += CONCURRENCY) {
      await Promise.all(
        candidates.slice(i, i + CONCURRENCY).map(async (c) => {
          try {
            const res = await anthropic.messages.create(paramsOf(c));
            const text = res.content.find((b) => b.type === "text")?.text;
            const tags = text ? parseTags(text) : null;
            if (!tags) throw new Error(`분류 결과를 읽지 못함 (${res.stop_reason})`);
            await save(c, tags);
            stats.saved += 1;
          } catch (err) {
            stats.failed += 1;
            console.error(`  ✗ ${c.id}: ${(err as Error).message.slice(0, 200)}`);
          }
        }),
      );
    }
  }

  console.log(`✓ 저장 ${stats.saved} · 실패 ${stats.failed}`);
  await pg.end({ timeout: 5 });
  // 실패가 절반을 넘으면 GitHub Actions가 실패로 표시해 알린다
  process.exit(stats.failed > candidates.length / 2 ? 1 : 0);
}

main().catch((err) => {
  console.error((err as Error).message);
  process.exit(1);
});
