export function MediaCard({ title, artist, imgUrl }: { title: string, artist: string, imgUrl: string }) {
  return (
    <div className="group relative w-48 md:w-56 shrink-0 rounded-[1.5rem] p-3 bg-surface-variant/20 backdrop-blur-[20px] border-[1.5px] border-outline-variant/15 hover:border-primary/50 hover:shadow-[inset_0_0_20px_rgba(255,124,245,0.05),0_10px_40px_-10px_rgba(255,81,250,0.15)] transition-all duration-300 cursor-pointer overflow-hidden saturate-150">
      
      {/* Ghost Glow Background on Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity duration-500 bg-gradient-to-br from-primary to-secondary"></div>
      
      <div className="w-full aspect-square rounded-[1rem] overflow-hidden mb-4 relative z-10 shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
      </div>
      
      <div className="px-1 z-10 relative">
        <h3 className="font-heading text-sm md:text-base font-medium truncate text-foreground mb-1 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-[10px] md:text-xs text-foreground/50 tracking-[0.08em] truncate uppercase">{artist}</p>
      </div>
    </div>
  );
}
