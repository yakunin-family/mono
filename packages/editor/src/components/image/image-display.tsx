interface ImageDisplayProps {
  url: string;
  alt: string | null;
  caption: string | null;
}

export function ImageDisplay({ url, alt, caption }: ImageDisplayProps) {
  return (
    <div className="relative w-full">
      <img
        src={url}
        alt={alt || caption || "Image"}
        className="w-full rounded-lg object-contain"
        loading="lazy"
      />
    </div>
  );
}
