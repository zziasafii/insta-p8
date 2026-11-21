"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Globe, Film, Check, RefreshCw, Search, X, Loader2,
  Sparkles, ExternalLink, Image as ImageIcon, AlertCircle
} from "lucide-react"

export interface InstagramMediaItem {
  id: string
  caption?: string
  media_type?: string
  media_url?: string
  thumbnail_url?: string
  image_url?: string
  permalink?: string
  timestamp?: string
}

interface PostSelectorProps {
  userId: string
  /** Selected post IDs. Empty = all posts. */
  selectedIds: string[]
  onChange: (ids: string[]) => void
  /** Told when the user switches between "All" and "Specific". */
  onModeChange?: (mode: "all" | "specific") => void
}

/** The DB stores several post IDs comma-separated in specific_media_id. */
export const parseMediaIds = (v?: string | null): string[] =>
  (v || "").split(",").map((s) => s.trim()).filter(Boolean)

export function PostSelector({
  userId,
  selectedIds,
  onChange,
  onModeChange,
}: PostSelectorProps) {
  const [mode, setMode] = useState<"all" | "specific">(selectedIds.length ? "specific" : "all")
  const [mediaList, setMediaList] = useState<InstagramMediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"ALL" | "POST" | "REEL">("ALL")
  const [notice, setNotice] = useState<string | null>(null)

  const [linkInput, setLinkInput] = useState("")
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkLoading, setLinkLoading] = useState(false)

  // Pull the shortcode out of links like instagram.com/reel/ABC123/?igsh=...
  const shortcodeFromLink = (link: string): string | null => {
    const m = link.trim().match(/instagram\.com\/(?:[^/?#]+\/)?(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i)
    return m ? m[1] : null
  }

  const handleUseLink = async () => {
    setLinkError(null)
    const code = shortcodeFromLink(linkInput)
    if (!code) {
      setLinkError("That doesn't look like an Instagram post or reel link.")
      return
    }
    setLinkLoading(true)
    try {
      // Always reload so a reel posted a minute ago is included.
      const items = await fetchMedia()
      const found = items.find((m) => (m.permalink || "").includes(`/${code}`))
      if (found) {
        if (selectedIds.includes(found.id)) {
          setNotice("That one is already selected.")
        } else {
          onChange([...selectedIds, found.id])
          setNotice(`Added: ${found.caption?.slice(0, 40) || "post"}`)
        }
        setLinkInput("")
      } else {
        setLinkError("Couldn't find that reel on this account. Check it's posted on the connected account, then try again.")
      }
    } finally {
      setLinkLoading(false)
    }
  }

  const fetchMedia = async (): Promise<InstagramMediaItem[]> => {
    if (!userId) return []
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/instagram/media?userId=${userId}`)
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Failed to load Instagram media")
      }
      const items: InstagramMediaItem[] = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : []
      setMediaList(items)
      return items
    } catch (err: any) {
      console.error("[PostSelector] Error fetching media:", err)
      setError(err?.message || "Could not fetch Instagram posts. Please retry.")
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mode === "specific" && mediaList.length === 0 && !loading && !error) {
      void fetchMedia()
    }
  }, [mode, userId])

  useEffect(() => {
    // Only follow the parent when posts are selected. Resetting to "all" here
    // whenever nothing is selected would close the picker as soon as the feed loads.
    if (selectedIds.length) setMode("specific")
  }, [selectedIds.join(",")])

  const handleSelectMode = (newMode: "all" | "specific") => {
    setMode(newMode)
    onModeChange?.(newMode)
    setNotice(null)
    if (newMode === "all") {
      onChange([])
    } else if (mediaList.length === 0) {
      void fetchMedia()
    }
  }

  const togglePost = (item: InstagramMediaItem) => {
    setNotice(null)
    onChange(selectedIds.includes(item.id) ? selectedIds.filter((id) => id !== item.id) : [...selectedIds, item.id])
  }

  const removeId = (id: string) => onChange(selectedIds.filter((x) => x !== id))
  const itemFor = (id: string) => mediaList.find((m) => m.id === id)

  const filteredList = useMemo(() => {
    return mediaList.filter((item) => {
      const matchesSearch = searchQuery
        ? (item.caption || "").toLowerCase().includes(searchQuery.toLowerCase().trim())
        : true
      const isReel = item.media_type === "VIDEO"
      const matchesType =
        filterType === "ALL"
          ? true
          : filterType === "REEL"
          ? isReel
          : !isReel
      return matchesSearch && matchesType
    })
  }, [mediaList, searchQuery, filterType])

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl border border-border">
        <button
          type="button"
          onClick={() => handleSelectMode("all")}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            mode === "all"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-accent-blue shrink-0" />
          <span>All Posts & Reels</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectMode("specific")}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            mode === "specific"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Film className="w-3.5 h-3.5 text-accent-yellow shrink-0" />
          <span>Specific Posts / Reels</span>
        </button>
      </div>

      {mode === "specific" && (
        <div className="rounded-xl border border-border bg-card/60 p-3.5 space-y-3 animate-in fade-in duration-200">
          {selectedIds.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-yellow-foreground">
                Runs on {selectedIds.length} {selectedIds.length === 1 ? "post" : "posts"}
              </p>
              {selectedIds.map((id) => {
                const item = itemFor(id)
                return (
                  <div key={id} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card shadow-xs">
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0 border border-border">
                      {item?.image_url ? (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Film className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground font-medium line-clamp-1">
                        {item ? (item.media_type === "VIDEO" ? "Reel · " : "Post · ") + (item.caption || "Untitled") : loading ? "Loading…" : "Post"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono-ui mt-0.5 flex items-center gap-1.5">
                        ID: {id}
                        {item?.permalink && (
                          <a href={item.permalink} target="_blank" rel="noopener noreferrer" title="View on Instagram" className="hover:text-foreground">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeId(id)}
                      title="Remove this post"
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

            <div className="space-y-3">
              <p className="text-xs font-medium text-foreground">
                {selectedIds.length ? "Add another post or reel:" : "Select the posts or reels for this automation:"}
              </p>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => {
                      setLinkInput(e.target.value)
                      setLinkError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        void handleUseLink()
                      }
                    }}
                    placeholder="Paste a reel or post link, e.g. instagram.com/reel/..."
                    className="flex-1 h-8 px-3 text-xs bg-muted/40 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => void handleUseLink()}
                    disabled={!linkInput.trim() || linkLoading}
                    className="h-8 px-3 rounded-lg border border-border bg-card hover:bg-accent text-xs font-medium text-foreground shrink-0 transition-colors disabled:opacity-40 inline-flex items-center gap-1.5"
                  >
                    {linkLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    Use link
                  </button>
                </div>
                {linkError && <p className="text-[11px] text-destructive">{linkError}</p>}
                {notice && !linkError && <p className="text-[11px] text-accent-yellow-foreground">{notice}</p>}
                <p className="text-[10px] text-muted-foreground">Or tap posts in your feed below (tap again to remove).</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search caption..."
                    className="w-full h-8 pl-8 pr-3 text-xs bg-muted/40 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-[10px] font-medium shrink-0">
                  <button
                    type="button"
                    onClick={() => setFilterType("ALL")}
                    className={`px-2 py-1 rounded ${filterType === "ALL" ? "bg-card text-foreground font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("REEL")}
                    className={`px-2 py-1 rounded ${filterType === "REEL" ? "bg-card text-foreground font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Reels
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("POST")}
                    className={`px-2 py-1 rounded ${filterType === "POST" ? "bg-card text-foreground font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Posts
                  </button>
                </div>

                <button
                  type="button"
                  onClick={fetchMedia}
                  disabled={loading}
                  title="Refresh Instagram feed"
                  className="h-8 w-8 rounded-lg border border-border bg-muted/30 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 transition-colors disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-accent-yellow" : ""}`} />
                </button>
              </div>

              {loading && mediaList.length === 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 py-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl bg-muted/60 animate-pulse border border-border flex items-center justify-center"
                    >
                      <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-center space-y-2">
                  <AlertCircle className="w-5 h-5 text-destructive mx-auto" />
                  <p className="text-xs text-destructive">{error}</p>
                  <button
                    type="button"
                    onClick={fetchMedia}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry Loading Feed
                  </button>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-dashed border-border bg-muted/20 space-y-2">
                  <Film className="w-6 h-6 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    {searchQuery ? "No posts match your search query." : "No posts found in your Instagram feed."}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="text-xs text-primary underline"
                      >
                        Clear search
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={fetchMedia}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1 pb-1">
                  {filteredList.map((item) => {
                    const isSelected = selectedIds.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => togglePost(item)}
                        className={`aspect-square rounded-xl border overflow-hidden relative group text-left transition-all duration-150 bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/40 scale-[0.98]"
                            : "border-border hover:border-foreground/40 hover:scale-[1.01]"
                        }`}
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                            <Film className="w-6 h-6 text-neutral-500" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[8px] font-mono-ui text-white uppercase tracking-wider border border-white/10">
                          {item.media_type === "VIDEO" ? "Reel" : "Post"}
                        </span>

                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/25 flex items-center justify-center backdrop-blur-[0.5px]">
                            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg ring-2 ring-background">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 px-1.5 py-1 pointer-events-none">
                          <p className="text-[9px] text-white/95 line-clamp-1 font-sans leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {item.caption || "Instagram post"}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
        </div>
      )}
    </div>
  )
}
