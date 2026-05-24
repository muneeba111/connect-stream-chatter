export function SiteFooter() {
  return (
    <footer className="border-t border-border py-12 bg-surface">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between gap-12">
        <div className="max-w-[30ch]">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-6 bg-primary rounded ring-1 ring-black/5" />
            <span className="font-display text-lg font-semibold">Loophole</span>
          </div>
          <p className="text-sm text-muted-foreground">
            The social home for thousands of digital communities worldwide.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-16">
          <div className="space-y-4">
            <h5 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Product</h5>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li><a href="/rooms" className="hover:text-primary">Explore</a></li>
              <li><a href="/premium" className="hover:text-primary">Premium</a></li>
              <li><a href="/auth" className="hover:text-primary">Sign up</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Safety</h5>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li><a href="#" className="hover:text-primary">Guidelines</a></li>
              <li><a href="#" className="hover:text-primary">Moderation</a></li>
              <li><a href="#" className="hover:text-primary">Privacy</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 mt-12 pt-8 border-t border-border flex justify-between items-center">
        <p className="text-xs text-muted-foreground">© 2026 Loophole Inc.</p>
        <p className="text-xs text-muted-foreground">Made with care.</p>
      </div>
    </footer>
  );
}
