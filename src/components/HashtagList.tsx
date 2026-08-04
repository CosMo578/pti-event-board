export function HashtagList({ hashtags }: { hashtags: string[] }) {
  if (!hashtags.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {hashtags.map((tag) => (
        <span
          key={tag}
          className="max-w-full truncate rounded-full bg-pti-green/10 px-3 py-1 text-sm font-medium text-pti-green"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
