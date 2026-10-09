import { CUSTOM_SPARK_EMOJI, GENERIC_SPARKS, SPARK_BY_TAG } from '../sparkPrompts';
import { vibeTagLabel } from './vibeTag';
import type { Spark, VibeOverlap, VibeTag } from '../types';

const forTag = (tag: VibeTag): Spark[] => {
  const curated = SPARK_BY_TAG[tag.toLowerCase()];
  if (curated) {
    return curated.prompts.map((text, i) => ({
      key: `${tag}-${i}`,
      emoji: curated.emoji,
      text,
    }));
  }
  // A vibe they typed themselves: no curated prompt, but still worth asking about.
  return [
    {
      key: `${tag}-custom`,
      emoji: CUSTOM_SPARK_EMOJI,
      text: `Ask about ${vibeTagLabel(tag)} — what got them into it?`,
    },
  ];
};

/**
 * The openers to offer, best first: things you BOTH picked, then what only they
 * picked, then generic ones. Within a group, each tag's first prompt comes before
 * any tag's second so a pair with several shared vibes sees variety up front.
 *
 * Always non-empty (the generic tail), and stable for a given overlap, so the
 * panel can page through it without the list shifting underneath the user.
 */
export const buildSparks = (overlap: VibeOverlap): Spark[] => {
  const interleave = (tags: VibeTag[]): Spark[] => {
    const perTag = tags.map(forTag);
    const rounds = Math.max(0, ...perTag.map((list) => list.length));
    return Array.from({ length: rounds }, (_, round) =>
      perTag.flatMap((list) => (list[round] ? [list[round]] : []))
    ).flat();
  };

  const generic: Spark[] = GENERIC_SPARKS.map((spark, i) => ({
    key: `generic-${i}`,
    emoji: spark.emoji,
    text: spark.text,
  }));

  const seen = new Set<string>();
  return [...interleave(overlap.shared), ...interleave(overlap.onlyTheirs), ...generic].filter(
    (spark) => {
      if (seen.has(spark.text)) return false;
      seen.add(spark.text);
      return true;
    }
  );
};
