import { MemeFeed } from '@/features/memes';

/**
 * Full-screen meme feed — the same view as Home's Memes tab. Thin entry.
 * `h-full` completes the height chain (outlet → main → feed) so the feed's
 * inner panel owns the scroll and the page itself never grows.
 */
const Memes = () => {
  return (
    <main className="h-full min-h-0">
      <MemeFeed />
    </main>
  );
};

export default Memes;
