export interface PosterProps {
  posterUrl?: string;
  title: string;
}

export default function Poster({ posterUrl, title }: PosterProps) {
  if (posterUrl === undefined) {
    return (
      <div
        data-testid="poster-placeholder"
        className="flex aspect-[2/3] w-44 items-center justify-center rounded-lg border border-line bg-gradient-to-br from-surface-raised to-surface-sunken p-md text-center"
      >
        <span className="font-script text-2xl text-ink-faint">
          Now showing
        </span>
      </div>
    );
  }
  return (
    <img
      data-testid="poster-image"
      src={posterUrl}
      alt={`${title} poster`}
      className="aspect-[2/3] w-44 rounded-lg object-cover shadow-pop transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-overlay motion-reduce:hover:scale-100 motion-reduce:transition-none"
    />
  );
}
