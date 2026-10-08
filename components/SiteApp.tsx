/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element */
"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Bot, Building2, CalendarDays,
  Bell, Camera, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, CircleHelp, ClipboardList, Clock3, Database,
  Eye, EyeOff, FileCheck2, FileText, Headphones, ImageIcon, LayoutDashboard, Link2, LockKeyhole, LogOut, Menu,
  MessageCircle, Mic, MoreHorizontal, PanelLeft, Pencil, Phone, PlayCircle, Plus, Search,
  Send, Settings, ShieldCheck, Siren, Trash2, TrendingUp, Upload, Users,
} from "lucide-react";
import { articles, categories, categoryBySlug, formatDate, plainContent, type Article, type RiskLevel } from "@/lib/articles";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navIcons = [Siren, Phone, ShieldCheck, FileText, Bot, Building2, CalendarDays, PlayCircle, BookOpen, Database];
const pageSize = 6;
const adminPageSize = 20;
const publishedArticlesStorageKey = "qsac-published-articles-v1";
const siteMenuStorageKey = "qsac-site-menu-v1";

type SiteMenuItem = { id: string; label: string; href: string; visible: boolean };
const defaultSiteMenuItems: SiteMenuItem[] = categories.map(([slug, label]) => ({ id: slug, label, href: `/archive/${slug}`, visible: true }));

function readSiteMenuItems() {
  if (typeof window === "undefined") return defaultSiteMenuItems;
  try {
    const stored = JSON.parse(window.localStorage.getItem(siteMenuStorageKey) ?? "[]");
    return Array.isArray(stored) && stored.length ? stored.filter((item): item is SiteMenuItem => Boolean(item && typeof item.id === "string" && typeof item.label === "string" && typeof item.href === "string")) : defaultSiteMenuItems;
  } catch {
    return defaultSiteMenuItems;
  }
}

function useSiteMenuItems() {
  const [menuItems, setMenuItems] = useState<SiteMenuItem[]>(defaultSiteMenuItems);
  useEffect(() => {
    let active = true;
    const refresh = () => Promise.resolve().then(() => {
      if (active) setMenuItems(readSiteMenuItems());
    });
    void refresh();
    window.addEventListener("qsac:menu-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      active = false;
      window.removeEventListener("qsac:menu-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return menuItems;
}

async function readPublishedArticles() {
  if (typeof window === "undefined") return [] as Article[];
  let published: Article[] = [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(publishedArticlesStorageKey) ?? "[]");
    if (Array.isArray(stored)) published = stored.filter((item): item is Article => Boolean(item && typeof item.slug === "string"));
  } catch {
    published = [];
  }
  const adminStored = await readAdminContent();
  const recovered = adminStored.flatMap((item) => {
    if (!item || item.status !== "Đã xuất bản" || typeof item.slug !== "string" || articles.some((article) => article.slug === item.slug)) return [];
    try {
      return [adminRowToArticle(item)];
    } catch {
      return [];
    }
  });
  const publishedSlugs = new Set(published.map((item) => item.slug));
  return [...published, ...recovered.filter((item) => !publishedSlugs.has(item.slug))];
}

function usePublishedArticles() {
  const [items, setItems] = useState<Article[]>(articles);
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    let active = true;
    const refresh = async () => {
      const custom = await readPublishedArticles();
      if (!active) return;
      const customSlugs = new Set(custom.map((item) => item.slug));
      setItems([...custom, ...articles.filter((item) => !customSlugs.has(item.slug))]);
      setReady(true);
    };
    void refresh();
    window.addEventListener("qsac:articles-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      active = false;
      window.removeEventListener("qsac:articles-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return { items, ready };
}

export function Logo() {
  return <a className="brand" href="/" aria-label="QSAC - Trang chủ"><img src="/qsac-logo.png" alt="QSAC - Quality & Anti-Counterfeit" width="295" height="68" decoding="async" /></a>;
}

export function Masthead() {
  return <section className="masthead" aria-label="Biểu ngữ QSAC"><img className="mast-image" src="/home-banner.webp" alt="" width="1920" height="720" loading="eager" fetchPriority="high" decoding="async" /><div className="mast-grid" aria-hidden /><div className="mast-copy"><span className="mast-pill">QSAC.VN</span><div className="mast-title"><em>TRUNG TÂM GIÁM SÁT</em><br />VÀ PHÒNG CHỐNG<br />HÀNG GIẢ</div><p>Cổng cảnh báo • xác thực • tiếp nhận phản ánh</p><div className="mast-actions"><span><ShieldCheck /> Xác thực</span><span><AlertTriangle /> Cảnh báo rủi ro</span><span><Headphones /> Hỗ trợ 24/7</span></div></div></section>;
}

export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<"voice" | "image" | null>(null);
  return <>
    <form className={`global-search ${compact ? "compact" : ""}`} action="/search" role="search">
      <label className="sr-only" htmlFor="global-q">Tìm trong toàn bộ QSAC</label>
      <input id="global-q" name="q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tin tức, cảnh báo, hồ sơ vi phạm..." />
      <button className="search-submit" aria-label="Tìm kiếm"><Search aria-hidden /></button>
    </form>
    <div className="search-tools">
      <button className="icon-btn" onClick={() => setDialog("voice")} aria-label="Tìm bằng giọng nói"><Mic aria-hidden /></button>
      <button className="icon-btn" onClick={() => setDialog("image")} aria-label="Tìm bằng hình ảnh"><Camera aria-hidden /></button>
    </div>
    <AccessibleDialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)} title={dialog === "voice" ? "Tìm bằng giọng nói" : "Tìm bằng hình ảnh"} description={dialog === "voice" ? "Micro chỉ được kích hoạt khi bạn nhấn nút bắt đầu." : "Chọn ảnh sản phẩm để mô phỏng tìm kiếm tương đồng."}>
      <div className="dialog-placeholder">{dialog === "voice" ? <Mic aria-hidden /> : <ImageIcon aria-hidden />}<p>Tính năng đang ở chế độ minh họa, chưa gửi dữ liệu ra máy chủ.</p><button className="btn primary" type="button">{dialog === "voice" ? "Bắt đầu ghi âm" : "Chọn hình ảnh"}</button></div>
    </AccessibleDialog>
  </>;
}

export function PrimaryNavigation({ active }: { active?: string }) {
  const menuItems = useSiteMenuItems().filter((item) => item.visible);
  return <nav className="primary-nav" aria-label="Chuyên mục"><div className="nav-scroll">{menuItems.map((item, index) => { const Icon = navIcons[index % navIcons.length]; return <a key={item.id} className={item.href === `/archive/${active}` ? "active" : ""} href={item.href}><Icon aria-hidden />{item.label}</a>; })}</div></nav>;
}

export function MobileNavigation() {
  const menuItems = useSiteMenuItems().filter((item) => item.visible);
  return <Sheet><SheetTrigger asChild><button className="mobile-menu" aria-label="Mở menu" aria-controls="mobile-navigation"><Menu aria-hidden /></button></SheetTrigger><SheetContent id="mobile-navigation" side="right" className="mobile-drawer"><SheetHeader><SheetTitle>Danh mục QSAC</SheetTitle><SheetDescription>Đi tới chuyên mục hoặc tiện ích.</SheetDescription></SheetHeader><nav aria-label="Menu di động">{menuItems.map((item, index) => { const Icon = navIcons[index % navIcons.length]; return <a href={item.href} key={item.id}><Icon aria-hidden />{item.label}</a>; })}<a href="/tra-cuu-traceid"><FileCheck2 aria-hidden />Tra cứu TraceID</a><a href="/kiem-tra-link-tmdt"><Link2 aria-hidden />Kiểm tra link TMĐT</a><a href="/bao-cao-vi-pham"><AlertTriangle aria-hidden />Báo cáo vi phạm</a></nav></SheetContent></Sheet>;
}

export function SiteHeader({ active }: { active?: string }) {
  return <header className="site-header"><Masthead /><a className="skip-link" href="#main-content">Đi tới nội dung chính</a><div className="authority-bar"><div className="container"><a href="/" className="site-chip">QSAC.VN</a><b>TRUNG TÂM GIÁM SÁT CHẤT LƯỢNG &amp; PHÒNG CHỐNG HÀNG GIẢ</b><a href="/canh-bao-khan-cap"><AlertTriangle aria-hidden /> Cảnh báo khẩn cấp</a></div></div><div className="container header-main"><Logo /><div className="header-search"><GlobalSearch /></div><a className="btn report" href="/bao-cao-vi-pham"><AlertTriangle aria-hidden /> Báo cáo vi phạm</a><MobileNavigation /></div><PrimaryNavigation active={active} /></header>;
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return <nav className="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="/">Trang chủ</a></li>{items.map((item) => <li key={item.label}><ChevronRight aria-hidden />{item.href ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}</li>)}</ol></nav>;
}

export function RiskBadge({ level, type }: { level?: RiskLevel; type?: Article["contentType"] }) {
  if (!level) return <span className="risk neutral">{type === "video" ? "Video" : type === "document" ? "Tài liệu" : type === "report" ? "Báo cáo" : "Thông tin"}</span>;
  const labels = { high: "Rủi ro cao", medium: "Cần lưu ý", low: "Thông tin" };
  return <span className={`risk ${level}`}>{labels[level]}</span>;
}

export function ArticleCard({ article }: { article: Article }) {
  return <article className="article-card"><a className="card-link" href={`/posts/${article.slug}`} aria-label={article.title}><div className="article-image"><img src={article.image.src} alt={article.image.alt} width="1280" height="720" loading="lazy" decoding="async" /><span>{article.category}</span></div><div className="card-body"><div className="card-meta"><span>{article.category}</span><time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time></div><h2>{article.title}</h2><p>{article.excerpt}</p><RiskBadge level={article.riskLevel} type={article.contentType} /></div></a></article>;
}

export function ArticleGrid({ items }: { items: Article[] }) { return <div className="article-grid">{items.map((a) => <ArticleCard key={a.slug} article={a} />)}</div>; }

export function LatestNews({ items = articles }: { items?: Article[] }) {
  return <aside className="latest"><div className="section-heading"><h2>TIN MỚI NHẤT</h2><a href="/archive/tin-canh-bao">Xem tất cả</a></div>{items.slice(0, 4).map((a) => <a className="latest-item" href={`/posts/${a.slug}`} key={a.slug}><span className="mini-image"><img src={a.image.src} alt="" width="160" height="100" loading="lazy" decoding="async" /></span><span><b>{a.title}</b><time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time></span></a>)}<HotlineCard /></aside>;
}

export function HotlineCard() { return <a className="hotline" href="tel:389"><Phone aria-hidden /><span><small>ĐƯỜNG DÂY NÓNG</small><b>ALO 389</b><em>Tiếp nhận phản ánh 24/7</em></span></a>; }

export function Pagination({ current, total, base, query = "" }: { current: number; total: number; base: string; query?: string }) {
  if (total <= 1) return null;
  const href = (page: number) => `${base}?${query ? `${query}&` : ""}page=${page}`;
  return <nav className="pagination" aria-label="Phân trang"><a aria-disabled={current === 1} href={href(Math.max(1, current - 1))}><ArrowLeft aria-hidden /> Trước</a>{Array.from({ length: total }, (_, i) => i + 1).map((p) => <a key={p} className={p === current ? "active" : ""} aria-current={p === current ? "page" : undefined} href={href(p)}>{p}</a>)}<a aria-disabled={current === total} href={href(Math.min(total, current + 1))}>Sau <ArrowRight aria-hidden /></a></nav>;
}

export function ArchiveHero({ slug }: { slug: string }) {
  const category = categoryBySlug[slug] ?? categoryBySlug["tin-canh-bao"];
  return <section className="archive-hero"><span className="eyebrow">CHUYÊN MỤC</span><h1>{category.name}</h1><p>{category.description}</p><a className="btn light" href={`/search?category=${slug}`}><Search aria-hidden /> Tìm trong chuyên mục</a></section>;
}

export function SearchFilters({ query, category, risk }: { query: string; category: string; risk: string }) {
  return <form className="filters" action="/search"><div><label htmlFor="search-q">Từ khóa</label><input id="search-q" name="q" defaultValue={query} placeholder="Nhập nội dung cần tìm" /></div><div><label htmlFor="filter-category">Chuyên mục</label><select id="filter-category" name="category" defaultValue={category}><option value="">Tất cả</option>{categories.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}</select></div><div><label htmlFor="filter-risk">Mức rủi ro</label><select id="filter-risk" name="risk" defaultValue={risk}><option value="">Tất cả</option><option value="high">Cao</option><option value="medium">Cần lưu ý</option><option value="low">Thông tin</option></select></div><div><label htmlFor="filter-sort">Sắp xếp</label><select id="filter-sort" name="sort"><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option></select></div><button className="btn primary"><Search aria-hidden /> Lọc kết quả</button></form>;
}

export function EmptyState({ title = "Chưa có kết quả", text = "Hãy thử từ khóa hoặc bộ lọc khác." }: { title?: string; text?: string }) { return <div className="state-box"><CircleHelp aria-hidden /><h2>{title}</h2><p>{text}</p></div>; }
export function LoadingState() { return <div className="state-box" role="status"><div className="spinner" /><p>Đang xử lý dữ liệu…</p></div>; }
export function ErrorState({ message = "Có lỗi xảy ra. Vui lòng thử lại." }: { message?: string }) { return <div className="state-box error" role="alert"><AlertTriangle aria-hidden /><p>{message}</p></div>; }

export function AccessibleDialog({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children: React.ReactNode }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="accessible-dialog"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>{children}</DialogContent></Dialog>;
}

function HeroCarousel({ items = articles }: { items?: Article[] }) {
  const slides = items.slice(0, 5); const [index, setIndex] = useState(0); const touchStart = useRef(0);
  const move = (by: number) => setIndex((value) => (value + by + slides.length) % slides.length);
  return <section className="hero-carousel" aria-roledescription="carousel" aria-label="Tin nổi bật" tabIndex={0} onKeyDown={(e) => { if (e.key === "ArrowLeft") move(-1); if (e.key === "ArrowRight") move(1); }} onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }} onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touchStart.current; if (Math.abs(dx) > 45) move(dx > 0 ? -1 : 1); }}><div className="hero-art"><img src={slides[index].image.src} alt="" width="1280" height="720" loading="eager" decoding="async" /></div><div className="hero-copy"><RiskBadge level={slides[index].riskLevel} /><h1>{slides[index].title}</h1><p>{slides[index].excerpt}</p><a className="btn light" href={`/posts/${slides[index].slug}`}>Đọc cảnh báo <ChevronRight aria-hidden /></a></div><button className="carousel-btn prev" onClick={() => move(-1)} aria-label="Tin trước"><ArrowLeft aria-hidden /></button><button className="carousel-btn next" onClick={() => move(1)} aria-label="Tin sau"><ArrowRight aria-hidden /></button><div className="carousel-dots">{slides.map((slide, i) => <button key={slide.slug} onClick={() => setIndex(i)} className={i === index ? "active" : ""} aria-label={`Hiển thị tin ${i + 1}`} aria-current={i === index ? "true" : undefined} />)}</div></section>;
}

export function NewsletterForm() {
  const [state, setState] = useState<"idle" | "success">("idle");
  return <section className="newsletter"><div><span className="eyebrow">BẢN TIN QSAC</span><h2>ĐĂNG KÝ NHẬN CẢNH BÁO</h2><p>Nhận thông tin mới theo chủ đề hàng giả, lừa đảo TMĐT và an ninh số.</p></div>{state === "success" ? <p className="success-message" role="status"><CheckCircle2 /> Đã lưu đăng ký demo. Chưa gửi dữ liệu ra máy chủ.</p> : <form onSubmit={(e) => { e.preventDefault(); setState("success"); }}><label htmlFor="news-name">Họ và tên</label><input id="news-name" autoComplete="name" required /><label htmlFor="news-email">Email</label><input id="news-email" type="email" autoComplete="email" required /><label htmlFor="news-topic">Chủ đề</label><select id="news-topic"><option>Cảnh báo tổng hợp</option><option>TMĐT-AI</option><option>An ninh số</option></select><label className="check"><input type="checkbox" required /> Tôi đồng ý với <a href="/chinh-sach-bao-mat">chính sách bảo mật</a>.</label><button className="btn primary">Đăng ký</button></form>}</section>;
}

function Utilities() { const tools = [[FileCheck2, "Tra cứu TraceID / QMAC", "Xác minh sản phẩm, doanh nghiệp và trạng thái cảnh báo.", "/tra-cuu-traceid"], [Link2, "Kiểm tra link TMĐT", "Phân tích URL, tín hiệu rủi ro và khuyến nghị.", "/kiem-tra-link-tmdt"], [AlertTriangle, "Báo cáo vi phạm", "Gửi phản ánh kèm hình ảnh, URL và địa điểm liên quan.", "/bao-cao-vi-pham"]] as const; return <section className="utility-grid">{tools.map(([Icon, title, text, href]) => <a href={href} key={href}><span><Icon aria-hidden /></span><h3>{title}</h3><p>{text}</p><b>Mở tiện ích <ChevronRight aria-hidden /></b></a>)}</section>; }

export function HomePage({ items = articles }: { items?: Article[] }) { return <PageShell><section className="container home-lead"><HeroCarousel items={items} /><LatestNews items={items} /></section><section className="container section"><div className="section-heading"><h2>CHUYÊN MỤC NỔI BẬT</h2></div><div className="category-grid">{categories.slice(0, 8).map(([slug, name], index) => { const Icon = navIcons[index]; return <a href={`/archive/${slug}`} key={slug}><Icon aria-hidden /><b>{name}</b><ChevronRight aria-hidden /></a>; })}</div></section><section className="container section"><div className="section-heading"><h2>TIỆN ÍCH HỖ TRỢ</h2></div><Utilities /></section><section className="stats"><div className="container stats-grid"><div><b>12.480</b><span>phản ánh đã tiếp nhận</span></div><div><b>3.216</b><span>liên kết TMĐT rủi ro</span></div><div><b>842</b><span>hồ sơ đang theo dõi</span></div><div><b>98%</b><span>phản hồi trong 24 giờ</span></div></div><p>Dữ liệu minh họa • Cập nhật ngày 06/10/2026</p></section><div className="container section"><NewsletterForm /></div></PageShell>; }

export function ArchivePage({ slug, page = 1, items = articles }: { slug: string; page?: number; items?: Article[] }) { const category = categoryBySlug[slug] ?? categoryBySlug["tin-canh-bao"]; const own = items.filter((a) => a.categorySlug === slug).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)); const total = Math.max(1, Math.ceil(own.length / pageSize)); const current = Math.min(Math.max(1, page), total); const shown = own.slice((current - 1) * pageSize, current * pageSize); return <PageShell active={slug}><div className="container"><Breadcrumb items={[{ label: category.name }]} /><ArchiveHero slug={slug} /><div className="archive-layout"><div><form className="archive-toolbar" action={`/archive/${slug}`}><label htmlFor="archive-filter">Lọc bài viết</label><select id="archive-filter" name="type"><option>Mới nhất</option><option>Rủi ro cao</option><option>Tài liệu</option></select><label htmlFor="archive-sort">Sắp xếp</label><select id="archive-sort" name="sort"><option value="newest">Ngày mới nhất</option><option value="oldest">Ngày cũ nhất</option></select><button className="btn outline">Áp dụng</button></form>{own.length > 0 ? <><p className="result-count">Có <b>{own.length}</b> bài viết trong chuyên mục {category.name}.</p><ArticleGrid items={shown} /><Pagination current={current} total={total} base={`/archive/${slug}`} /></> : <EmptyState title={`Chưa có bài viết trong ${category.name}`} text="Bài viết mới sẽ xuất hiện tại đây sau khi được duyệt và xuất bản." />}</div><LatestNews items={items} /></div></div></PageShell>; }

export function RelatedArticles({ article, items = articles }: { article: Article; items?: Article[] }) { const related = article.relatedSlugs.map((slug) => items.find((a) => a.slug === slug)).filter(Boolean) as Article[]; return <section className="related"><h2>Tin liên quan</h2><ArticleGrid items={related} /></section>; }

export function ArticleDetail({ article }: { article: Article }) { return <article className="article-detail"><span className="eyebrow">{article.category}</span><h1>{article.title}</h1><div className="article-byline"><time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time><span>{article.author}</span><RiskBadge level={article.riskLevel} type={article.contentType} /></div><figure className="article-cover"><img src={article.image.src} alt={article.image.alt} width="1280" height="720" decoding="async" /><figcaption>{article.category}</figcaption></figure><p className="lead">{article.excerpt}</p>{article.content.map((section, i) => <section key={i}>{section.heading && <h2>{section.heading}</h2>}{section.paragraphs?.map((p) => <p key={p}>{p}</p>)}{section.bullets && <ul>{section.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}{section.quote && <blockquote>{section.quote}</blockquote>}</section>)}<div className="table-wrap" tabIndex={0}><table><caption>Bảng kiểm nhanh trước khi thực hiện giao dịch</caption><thead><tr><th scope="col">Hạng mục</th><th scope="col">Cần kiểm tra</th><th scope="col">Hành động</th></tr></thead><tbody><tr><th scope="row">Nguồn gửi</th><td>Tên miền, số điện thoại</td><td>Đối chiếu kênh chính thức</td></tr><tr><th scope="row">Yêu cầu</th><td>Mã OTP, chuyển tiền</td><td>Dừng giao dịch</td></tr><tr><th scope="row">Chứng cứ</th><td>Ảnh, URL, thời gian</td><td>Lưu và báo cáo</td></tr></tbody></table></div><div className="article-actions"><button className="btn outline" type="button" onClick={() => navigator.clipboard?.writeText(location.href)}><Send aria-hidden /> Sao chép liên kết</button><a className="btn primary" href="/bao-cao-vi-pham"><AlertTriangle aria-hidden /> Báo cáo vi phạm</a></div></article>; }

export function ArticlePage({ article, items = articles }: { article: Article; items?: Article[] }) { return <PageShell active={article.categorySlug}><div className="container"><Breadcrumb items={[{ label: article.category, href: `/archive/${article.categorySlug}` }, { label: article.title }]} /><div className="detail-layout"><div><ArticleDetail article={article} /><RelatedArticles article={article} items={items} /></div><LatestNews items={items} /></div></div></PageShell>; }

export function SearchPage({ params, items = articles }: { params: Record<string, string>; items?: Article[] }) { const query = params.q ?? ""; const category = params.category ?? ""; const risk = params.risk ?? ""; const page = Math.max(1, Number(params.page) || 1); const results = useMemo(() => { const needle = query.trim().toLocaleLowerCase("vi"); return items.filter((a) => (!needle || `${a.title} ${a.excerpt} ${plainContent(a)} ${a.tags.join(" ")} ${a.category}`.toLocaleLowerCase("vi").includes(needle)) && (!category || a.categorySlug === category) && (!risk || a.riskLevel === risk)).sort((a,b) => (params.sort === "oldest" ? 1 : -1) * a.publishedAt.localeCompare(b.publishedAt)); }, [query, category, risk, params.sort, items]); const total = Math.ceil(results.length / pageSize); const shown = results.slice((page - 1) * pageSize, page * pageSize); const queryString = new URLSearchParams(Object.entries(params).filter(([k]) => k !== "page")).toString(); return <PageShell><div className="container"><Breadcrumb items={[{ label: "Tìm kiếm" }]} /><div className="page-intro"><span className="eyebrow">TRA CỨU NỘI DUNG</span><h1>Tìm kiếm trên QSAC</h1><p>Phạm vi: tiêu đề, tóm tắt, nội dung, thẻ và chuyên mục.</p></div><SearchFilters query={query} category={category} risk={risk} />{!query && !category && !risk ? <EmptyState title="Nhập từ khóa để bắt đầu" text="Bạn cũng có thể lọc theo chuyên mục hoặc mức rủi ro." /> : results.length === 0 ? <EmptyState /> : <><p className="result-count">Tìm thấy <b>{results.length}</b> kết quả{query && <> cho “{query}”</>}</p><ArticleGrid items={shown} /><Pagination current={page} total={total} base="/search" query={queryString} /></>}</div></PageShell>; }

export function TraceIdForm() { const [state, setState] = useState<"idle" | "loading" | "result" | "error">("idle"); const [value, setValue] = useState(""); const submit = (e: React.FormEvent) => { e.preventDefault(); if (!/^[A-Z0-9-]{8,32}$/i.test(value)) return setState("error"); setState("loading"); setTimeout(() => setState("result"), 650); }; return <form className="tool-form" onSubmit={submit} noValidate><label htmlFor="trace-id">TraceID <span aria-hidden>*</span></label><input id="trace-id" value={value} onChange={(e) => setValue(e.target.value)} aria-describedby="trace-help trace-error" placeholder="Ví dụ: QSAC-2026-001" required /><small id="trace-help">Từ 8–32 ký tự, gồm chữ, số và dấu gạch ngang.</small>{state === "error" && <p className="field-error" id="trace-error">TraceID chưa đúng định dạng.</p>}<label htmlFor="gtin">GTIN (không bắt buộc)</label><input id="gtin" inputMode="numeric" pattern="[0-9]{8,14}" placeholder="Mã 8–14 chữ số" /><button className="btn primary" disabled={state === "loading"}>{state === "loading" ? "Đang tra cứu…" : "Tra cứu ngay"}</button>{state === "result" && <div className="tool-result" role="status"><CheckCircle2 /><div><b>Trạng thái minh họa: đã ghi nhận</b><p>Dữ liệu demo, chưa kết nối hệ thống xác thực thực tế.</p></div></div>}</form>; }

export function CommerceLinkChecker() { const [result, setResult] = useState<{ score: number; host: string } | null>(null); const [error, setError] = useState(""); const submit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const data = new FormData(e.currentTarget); let raw = String(data.get("url") || "").trim(); if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`; try { const url = new URL(raw); const score = Math.min(92, 20 + (url.hostname.split(".").length - 2) * 12 + (url.search.length > 40 ? 18 : 0) + (/sale|deal|free|gift/i.test(raw) ? 24 : 0)); setResult({ score, host: url.hostname }); setError(""); } catch { setError("URL chưa hợp lệ. Ví dụ: https://example.vn/san-pham"); setResult(null); } }; return <form className="tool-form" onSubmit={submit} noValidate><label htmlFor="commerce-url">Đường dẫn sản phẩm hoặc gian hàng</label><input id="commerce-url" name="url" type="text" inputMode="url" aria-describedby="url-help url-error" placeholder="https://..." required /><small id="url-help">Kết quả là mô phỏng dựa trên quy tắc, không phải kết luận của AI.</small>{error && <p id="url-error" className="field-error" role="alert">{error}</p>}<button className="btn primary"><ShieldCheck aria-hidden /> Kiểm tra link</button>{result && <div className="risk-result" role="status"><div className="score"><b>{result.score}</b><span>/100 điểm rủi ro</span></div><div><h2>{result.host}</h2><ul><li>Tên miền đã được chuẩn hóa.</li><li>Kiểm tra độ dài tham số và từ khóa quảng cáo.</li><li>Không chuyển tiền nếu chưa xác minh người bán.</li></ul></div></div>}</form>; }

export function ReportForm() { const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle"); const [fileError, setFileError] = useState(""); const submit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const form = e.currentTarget; if (!form.checkValidity()) { form.reportValidity(); setStatus("error"); return; } setStatus("submitting"); setTimeout(() => setStatus("success"), 700); }; if (status === "success") return <div className="state-box success" role="status"><CheckCircle2 /><h2>Đã ghi nhận bản nháp phản ánh</h2><p>Đây là mô phỏng giao diện; dữ liệu chưa được gửi ra máy chủ.</p><button className="btn outline" onClick={() => setStatus("idle")}>Tạo phản ánh khác</button></div>; return <form className="report-form" method="post" onSubmit={submit} noValidate><div className="form-grid"><Field id="full-name" label="Họ và tên" required autoComplete="name" /><Field id="phone" label="Số điện thoại" type="tel" required autoComplete="tel" pattern="[0-9+ ]{9,15}" hint="9–15 chữ số, có thể bắt đầu bằng +84." /><Field id="email" label="Email" type="email" required autoComplete="email" /><Field id="subject" label="Đối tượng / sản phẩm" required /><div><label htmlFor="violation">Loại vi phạm <span>*</span></label><select id="violation" required defaultValue=""><option value="" disabled>Chọn loại vi phạm</option><option>Hàng giả / hàng nhái</option><option>Gian lận thương mại</option><option>Lừa đảo trực tuyến</option><option>Khác</option></select></div><Field id="related-url" label="URL liên quan" type="url" placeholder="https://" /><Field id="location" label="Địa điểm" autoComplete="street-address" /></div><div><label htmlFor="evidence">Bằng chứng</label><div className="upload"><Upload aria-hidden /><input id="evidence" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" aria-describedby="evidence-help evidence-error" onChange={(e) => { const files = Array.from(e.target.files ?? []); setFileError(files.length > 5 || files.some((f) => f.size > 5 * 1024 * 1024) ? "Tối đa 5 tệp, mỗi tệp không quá 5 MB." : ""); }} /><small id="evidence-help">JPG, PNG, WebP hoặc PDF. Tối đa 5 tệp, mỗi tệp 5 MB.</small>{fileError && <p id="evidence-error" className="field-error">{fileError}</p>}</div></div><div><label htmlFor="details">Nội dung phản ánh <span>*</span></label><textarea id="details" required minLength={30} rows={6} aria-describedby="details-help" /><small id="details-help">Mô tả thời gian, diễn biến và thông tin bạn đã xác minh (ít nhất 30 ký tự).</small></div><label className="check"><input type="checkbox" required /> Tôi xác nhận thông tin là đúng và đồng ý với <a href="/dieu-khoan-su-dung">điều khoản sử dụng</a>.</label>{status === "error" && <p className="field-error" role="alert">Vui lòng kiểm tra các trường bắt buộc.</p>}<button className="btn primary" disabled={status === "submitting" || Boolean(fileError)}>{status === "submitting" ? "Đang xử lý…" : "Gửi báo cáo demo"}</button><p className="form-note">Biểu mẫu đang ở chế độ demo, chưa gửi thông tin đến máy chủ.</p></form>; }

function Field({ id, label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; hint?: string }) { return <div><label htmlFor={id}>{label} {props.required && <span>*</span>}</label><input id={id} name={id} aria-describedby={hint ? `${id}-help` : undefined} {...props} />{hint && <small id={`${id}-help`}>{hint}</small>}</div>; }

export function ToolPage({ type }: { type: "trace" | "link" | "report" }) { const info = type === "trace" ? ["Tra cứu TraceID / QMAC", "Nhập mã để kiểm tra trạng thái sản phẩm trong dữ liệu minh họa."] : type === "link" ? ["Kiểm tra link thương mại điện tử", "Đánh giá nhanh các tín hiệu kỹ thuật cơ bản của một URL."] : ["Báo cáo vi phạm", "Cung cấp thông tin và bằng chứng để hỗ trợ phân loại phản ánh."]; return <PageShell><div className="container narrow-page"><Breadcrumb items={[{ label: info[0] }]} /><div className="page-intro"><span className="eyebrow">TIỆN ÍCH QSAC</span><h1>{info[0]}</h1><p>{info[1]}</p></div><div className="tool-panel">{type === "trace" ? <TraceIdForm /> : type === "link" ? <CommerceLinkChecker /> : <ReportForm />}</div></div></PageShell>; }

const staticContent: Record<string, [string, string, string[]]> = {
  "canh-bao-khan-cap": ["Cảnh báo khẩn cấp", "Tổng hợp tình huống có nguy cơ gây thiệt hại nhanh hoặc trên diện rộng.", ["Không chuyển tiền theo yêu cầu từ cuộc gọi lạ.", "Không cung cấp OTP hoặc cài ứng dụng từ liên kết không xác minh.", "Gọi 389 hoặc gửi phản ánh khi phát hiện dấu hiệu hàng giả."]],
  "gioi-thieu": ["Giới thiệu QSAC", "QSAC là giao diện cổng thông tin minh họa cho hoạt động cảnh báo, tra cứu và tiếp nhận phản ánh.", ["Kết nối thông tin cảnh báo.", "Hỗ trợ người tiêu dùng tự kiểm tra.", "Chuẩn hóa dữ liệu phản ánh."]],
  "quy-che-bien-tap": ["Quy chế biên tập", "Nguyên tắc xuất bản nội dung trên cổng thông tin QSAC.", ["Xác minh nguồn trước khi đăng.", "Phân biệt rõ dữ liệu thật và dữ liệu minh họa.", "Cập nhật, đính chính minh bạch."]],
  "dinh-chinh": ["Đính chính", "Khu vực công bố nội dung được cập nhật hoặc sửa lỗi.", ["Hiện chưa có thông báo đính chính mới."]],
  "bao-mat-du-lieu": ["Bảo mật dữ liệu", "Các nguyên tắc kỹ thuật nhằm bảo vệ dữ liệu người dùng.", ["Thu thập tối thiểu.", "Mã hóa khi truyền.", "Giới hạn quyền truy cập."]],
  "chinh-sach-bao-mat": ["Chính sách bảo mật", "Cách QSAC xử lý dữ liệu trong bản triển khai minh họa.", ["Biểu mẫu demo không gửi dữ liệu ra máy chủ.", "Không sử dụng dữ liệu cho quảng cáo.", "Người dùng có quyền yêu cầu chỉnh sửa hoặc xóa."]],
  "dieu-khoan-su-dung": ["Điều khoản sử dụng", "Điều kiện sử dụng thông tin và tiện ích trên website.", ["Kết quả kiểm tra chỉ mang tính tham khảo.", "Không dùng website cho mục đích trái pháp luật.", "Nội dung có thể được cập nhật để tăng độ chính xác."]],
};

export function StaticPage({ slug }: { slug: string }) { const page = staticContent[slug] ?? ["Không tìm thấy trang", "Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi.", []]; const missing = !staticContent[slug]; return <PageShell><div className="container narrow-page"><Breadcrumb items={[{ label: page[0] }]} /><div className="content-page"><span className="eyebrow">QSAC.VN</span><h1>{page[0]}</h1><p className="lead">{page[1]}</p>{missing ? <a className="btn primary" href="/">Về trang chủ</a> : <><h2>Thông tin chính</h2><ul>{page[2].map((x) => <li key={x}>{x}</li>)}</ul><p>Nội dung này là dữ liệu mẫu cho bản trình diễn website và sẽ được thay thế khi kết nối hệ thống quản trị nội dung.</p></>}</div></div></PageShell>; }

type AdminReport = { id: string; title: string; source: string; time: string; status: "Mới" | "Đang xử lý" | "Đã xác minh"; priority: "Cao" | "Trung bình" };

const adminReports: AdminReport[] = [
  { id: "RP-1042", title: "Mỹ phẩm không rõ nguồn gốc", source: "TP. Hồ Chí Minh", time: "12 phút trước", status: "Mới", priority: "Cao" },
  { id: "RP-1041", title: "Website giả mạo hoàn tiền đơn hàng", source: "Hà Nội", time: "28 phút trước", status: "Đang xử lý", priority: "Cao" },
  { id: "RP-1039", title: "Sản phẩm thiếu thông tin truy xuất", source: "Đà Nẵng", time: "1 giờ trước", status: "Mới", priority: "Trung bình" },
  { id: "RP-1037", title: "Gian hàng sử dụng nhãn hiệu trái phép", source: "Hải Phòng", time: "2 giờ trước", status: "Đã xác minh", priority: "Trung bình" },
];

type AdminSection = "overview" | "reports" | "content" | "data" | "users" | "settings";

function AdminNavigation({ active, onNavigate }: { active: AdminSection; onNavigate: (id: AdminSection) => void }) {
  const items = [[LayoutDashboard, "Tổng quan", "overview"], [ClipboardList, "Phản ánh", "reports"], [FileText, "Nội dung", "content"], [Database, "Dữ liệu", "data"], [Users, "Tài khoản", "users"], [Settings, "Cấu hình", "settings"]] as const;
  return <nav className="admin-nav" aria-label="Điều hướng quản trị">{items.map(([Icon, label, id]) => <a key={id} className={active === id ? "active" : ""} href={`/admin#${id}`} onClick={() => onNavigate(id)}><Icon aria-hidden /><span>{label}</span>{id === "reports" && <b>4</b>}</a>)}</nav>;
}

export function AdminPage() {
  const [filter, setFilter] = useState<"all" | "new" | "processing">("all");
  const [query, setQuery] = useState("");
  const [reports, setReports] = useState(() => adminReports.map((item) => ({ ...item })));
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [toast, setToast] = useState("");
  const [drafts, setDrafts] = useState([
    { title: "Cảnh báo gian hàng giả mạo dịp cuối năm", category: "Tin & Cảnh báo", updated: "15 phút trước" },
    { title: "Hướng dẫn kiểm tra tem truy xuất nguồn gốc", category: "Giải mã hồ sơ", updated: "1 giờ trước" },
  ]);
  const shownReports = reports.filter((item) => (filter === "all" || (filter === "new" ? item.status === "Mới" : item.status === "Đang xử lý")) && `${item.id} ${item.title} ${item.source}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")));
  const selectedReport = reports.find((item) => item.id === selectedReportId);
  const kpis = [[ClipboardList, "Phản ánh chờ xử lý", String(reports.filter((item) => item.status !== "Đã xác minh").length).padStart(2, "0"), "+3 hôm nay", "urgent"], [ShieldCheck, "Đã xác minh", "248", "+18 tuần này", "positive"], [FileText, "Bài đang soạn", String(drafts.length).padStart(2, "0"), "Đang chờ duyệt", "neutral"], [Database, "Bản ghi theo dõi", "842", "+26 tháng này", "positive"]] as const;
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  const navigate = (id: AdminSection) => { setActiveSection(id); setMenuOpen(false); };
  const updateReport = (status: "Đang xử lý" | "Đã xác minh") => {
    if (!selectedReportId) return;
    setReports((items) => items.map((item) => item.id === selectedReportId ? { ...item, status } : item));
    showToast(`Đã cập nhật ${selectedReportId}: ${status}.`);
    setSelectedReportId(null);
  };
  const createDraft = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const category = String(form.get("category") || "Tin & Cảnh báo");
    if (!title) return;
    setDrafts((items) => [{ title, category, updated: "Vừa xong" }, ...items]);
    setCreateOpen(false);
    showToast("Đã lưu bài viết vào danh sách bản nháp.");
  };
  return <div className="admin-shell">
    <aside className="admin-sidebar"><a className="admin-brand" href="/" aria-label="Về trang QSAC"><img src="/qsac-logo.png" alt="QSAC" width="295" height="68" /></a><div className="admin-context"><span>HỆ THỐNG QUẢN TRỊ</span><b>Trung tâm điều hành</b></div><AdminNavigation active={activeSection} onNavigate={navigate} /><div className="admin-sidebar-foot"><a href="/"><Eye aria-hidden /> Xem website</a><a href="/" aria-label="Đăng xuất và về trang chủ"><LogOut aria-hidden /> Đăng xuất</a></div></aside>
    <section className="admin-workspace">
      <header className="admin-topbar"><div className="admin-mobile-nav"><Sheet open={menuOpen} onOpenChange={setMenuOpen}><SheetTrigger asChild><button className="admin-menu-button" aria-label="Mở điều hướng quản trị"><PanelLeft aria-hidden /></button></SheetTrigger><SheetContent side="left" className="admin-mobile-sheet"><SheetHeader><SheetTitle>Quản trị QSAC</SheetTitle><SheetDescription>Điều hướng hệ thống quản trị.</SheetDescription></SheetHeader><AdminNavigation active={activeSection} onNavigate={navigate} /></SheetContent></Sheet></div><div className="admin-top-title"><span>QSAC.VN</span><b>Bảng điều khiển quản trị</b></div><div className="admin-top-actions"><div className="admin-notifications"><button className="admin-icon-button" aria-label="Thông báo" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Bell aria-hidden /><span>3</span></button>{notificationsOpen && <div className="admin-notification-panel"><b>Thông báo mới</b><a href="#reports" onClick={() => { navigate("reports"); setNotificationsOpen(false); }}>3 phản ánh cần phân loại</a><a href="#content" onClick={() => { navigate("content"); setNotificationsOpen(false); }}>2 bài viết đang chờ duyệt</a><button type="button" onClick={() => setNotificationsOpen(false)}>Đóng</button></div>}</div><div className="admin-profile"><span>QT</span><div><b>Quản trị viên</b><small>Ban biên tập QSAC</small></div></div></div></header>
      <main className="admin-main" id="overview"><section className="admin-heading"><div><span className="admin-eyebrow">TỔNG QUAN HỆ THỐNG</span><h1>Xin chào, Quản trị viên</h1><p>Theo dõi phản ánh, nội dung và dữ liệu vận hành trong ngày.</p></div><button className="admin-primary" type="button" onClick={() => setCreateOpen(true)}><Plus aria-hidden /> Tạo bài viết</button></section>
        <section className="admin-kpis" aria-label="Chỉ số tổng quan">{kpis.map(([Icon, label, value, note, tone]) => <article key={label} className={`admin-kpi ${tone}`}><div className="admin-kpi-icon"><Icon aria-hidden /></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>)}</section>
        <div className="admin-dashboard-grid"><section className="admin-panel admin-queue" id="reports"><div className="admin-panel-head"><div><h2>Phản ánh cần xử lý</h2><p>Ưu tiên theo mức độ rủi ro và thời gian tiếp nhận.</p></div><a href="#reports" onClick={() => navigate("reports")}>Xem tất cả</a></div><div className="admin-toolbar"><div className="admin-tabs" role="group" aria-label="Lọc phản ánh"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Tất cả</button><button className={filter === "new" ? "active" : ""} onClick={() => setFilter("new")}>Mới</button><button className={filter === "processing" ? "active" : ""} onClick={() => setFilter("processing")}>Đang xử lý</button></div><label className="admin-search"><Search aria-hidden /><span className="sr-only">Tìm phản ánh</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mã, nội dung..." /></label></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Mã hồ sơ</th><th>Nội dung</th><th>Nguồn</th><th>Ưu tiên</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{shownReports.map((item) => <tr key={item.id}><td><b>{item.id}</b><small>{item.time}</small></td><td>{item.title}</td><td>{item.source}</td><td><span className={`admin-priority ${item.priority === "Cao" ? "high" : "medium"}`}>{item.priority}</span></td><td><span className={`admin-status ${item.status === "Mới" ? "new" : item.status === "Đang xử lý" ? "processing" : "verified"}`}>{item.status}</span></td><td><button className="admin-row-action" aria-label={`Mở ${item.id}`} onClick={() => setSelectedReportId(item.id)}><MoreHorizontal aria-hidden /></button></td></tr>)}{shownReports.length === 0 && <tr><td colSpan={6}><div className="admin-empty"><Search aria-hidden /><b>Không tìm thấy phản ánh</b><span>Thử từ khóa hoặc bộ lọc khác.</span></div></td></tr>}</tbody></table></div></section>
          <aside className="admin-side-stack"><section className="admin-panel"><div className="admin-panel-head"><div><h2>Hiệu suất 7 ngày</h2><p>Số hồ sơ đã xử lý.</p></div><TrendingUp aria-hidden /></div><div className="admin-chart" aria-label="Biểu đồ hồ sơ xử lý 7 ngày">{[42,58,46,72,66,88,76].map((height, index) => <div key={index}><span style={{height:`${height}%`}} /><small>{["T2","T3","T4","T5","T6","T7","CN"][index]}</small></div>)}</div><div className="admin-chart-summary"><strong>126</strong><span>hồ sơ hoàn tất</span><b>+14,2%</b></div></section><section className="admin-panel admin-activity"><div className="admin-panel-head"><div><h2>Hoạt động gần đây</h2><p>Cập nhật từ đội vận hành.</p></div><Clock3 aria-hidden /></div><ul><li><span className="done"><CheckCircle2 /></span><div><b>Đã duyệt cảnh báo mới</b><small>Nguyễn An • 8 phút trước</small></div></li><li><span className="review"><Eye /></span><div><b>Đang xác minh hồ sơ RP-1041</b><small>Trần Minh • 24 phút trước</small></div></li><li><span className="alert"><AlertTriangle /></span><div><b>Gắn cờ liên kết rủi ro cao</b><small>Hệ thống • 41 phút trước</small></div></li></ul></section></aside></div>
        <section className="admin-modules" aria-label="Các khu vực quản trị">
          <article className="admin-panel admin-module" id="content"><div className="admin-panel-head"><div><h2>Quản lý nội dung</h2><p>Bản nháp và bài viết chờ biên tập.</p></div><button type="button" className="admin-text-button" onClick={() => setCreateOpen(true)}><Plus aria-hidden /> Thêm bài</button></div><div className="admin-content-list">{drafts.map((draft) => <div key={`${draft.title}-${draft.updated}`}><FileText aria-hidden /><span><b>{draft.title}</b><small>{draft.category} • {draft.updated}</small></span><em>Bản nháp</em></div>)}</div></article>
          <article className="admin-panel admin-module" id="data"><div className="admin-panel-head"><div><h2>Dữ liệu hệ thống</h2><p>Tình trạng đồng bộ các nguồn theo dõi.</p></div><Database aria-hidden /></div><div className="admin-metrics"><div><span>Danh mục sản phẩm</span><b>98%</b></div><div><span>Nguồn cảnh báo</span><b>92%</b></div><div><span>Hồ sơ doanh nghiệp</span><b>87%</b></div></div><button type="button" className="admin-secondary" onClick={() => showToast("Đã kiểm tra: các nguồn dữ liệu đang hoạt động ổn định.")}>Kiểm tra đồng bộ</button></article>
          <article className="admin-panel admin-module" id="users"><div className="admin-panel-head"><div><h2>Tài khoản quản trị</h2><p>Người dùng đang có quyền truy cập.</p></div><Users aria-hidden /></div><div className="admin-user-list"><div><span>NA</span><b>Nguyễn An<small>Biên tập viên</small></b><em>Hoạt động</em></div><div><span>TM</span><b>Trần Minh<small>Kiểm duyệt viên</small></b><em>Hoạt động</em></div></div></article>
          <article className="admin-panel admin-module" id="settings"><div className="admin-panel-head"><div><h2>Cấu hình nhanh</h2><p>Tùy chọn vận hành trên thiết bị này.</p></div><Settings aria-hidden /></div><div className="admin-settings"><label><input type="checkbox" defaultChecked /> Nhận cảnh báo ưu tiên cao</label><label><input type="checkbox" defaultChecked /> Hiển thị thông báo nội bộ</label><label><input type="checkbox" /> Bật chế độ bảo trì</label></div><button type="button" className="admin-secondary" onClick={() => showToast("Đã lưu cấu hình trên phiên làm việc hiện tại.")}>Lưu cấu hình</button></article>
        </section>
      </main>
    </section>
    <AccessibleDialog open={createOpen} onOpenChange={setCreateOpen} title="Tạo bài viết mới" description="Thông tin sẽ được lưu thành bản nháp trong phiên làm việc này."><form className="admin-dialog-form" onSubmit={createDraft}><label htmlFor="admin-title">Tiêu đề bài viết</label><input id="admin-title" name="title" required placeholder="Nhập tiêu đề..." /><label htmlFor="admin-category">Chuyên mục</label><select id="admin-category" name="category" defaultValue="Tin & Cảnh báo"><option>Tin & Cảnh báo</option><option>Giải mã hồ sơ</option><option>An ninh số</option><option>Doanh nghiệp số</option></select><label htmlFor="admin-summary">Tóm tắt</label><textarea id="admin-summary" name="summary" rows={4} placeholder="Nhập nội dung tóm tắt..." /><div className="admin-dialog-actions"><button type="button" className="admin-secondary" onClick={() => setCreateOpen(false)}>Hủy</button><button type="submit" className="admin-primary">Lưu bản nháp</button></div></form></AccessibleDialog>
    <AccessibleDialog open={Boolean(selectedReport)} onOpenChange={(open) => !open && setSelectedReportId(null)} title={selectedReport ? `Hồ sơ ${selectedReport.id}` : "Chi tiết phản ánh"} description="Kiểm tra thông tin và cập nhật trạng thái xử lý.">{selectedReport && <div className="admin-report-detail"><dl><div><dt>Nội dung</dt><dd>{selectedReport.title}</dd></div><div><dt>Nguồn</dt><dd>{selectedReport.source}</dd></div><div><dt>Ưu tiên</dt><dd>{selectedReport.priority}</dd></div><div><dt>Trạng thái</dt><dd>{selectedReport.status}</dd></div></dl><div className="admin-dialog-actions"><button type="button" className="admin-secondary" onClick={() => updateReport("Đang xử lý")}>Đang xử lý</button><button type="button" className="admin-primary" onClick={() => updateReport("Đã xác minh")}>Xác minh hồ sơ</button></div></div>}</AccessibleDialog>
    {toast && <div className="admin-toast" role="status"><CheckCircle2 aria-hidden />{toast}</div>}
  </div>;
}

type AdminPortalSection = "overview" | "reports" | "content" | "menus" | "data" | "users" | "settings";

const adminPortalNav: readonly [AdminPortalSection, string, string, typeof LayoutDashboard][] = [
  ["overview", "Tổng quan", "/admin", LayoutDashboard],
  ["reports", "Phản ánh", "/admin/phan-anh", ClipboardList],
  ["content", "Nội dung", "/admin/noi-dung", FileText],
  ["menus", "Quản lý menu", "/admin/menu", Menu],
  ["data", "Dữ liệu", "/admin/du-lieu", Database],
  ["users", "Tài khoản", "/admin/tai-khoan", Users],
  ["settings", "Cấu hình", "/admin/cau-hinh", Settings],
];

const adminPortalSections: Record<string, AdminPortalSection> = {
  "phan-anh": "reports", "noi-dung": "content", "menu": "menus", "du-lieu": "data", "tai-khoan": "users", "cau-hinh": "settings",
};

const adminPageCopy: Record<AdminPortalSection, [string, string, string]> = {
  overview: ["Tổng quan", "Trung tâm điều hành", "Theo dõi tình hình xử lý và hoạt động của hệ thống."],
  reports: ["Phản ánh", "Quản lý phản ánh", "Phân loại, xác minh và theo dõi tiến độ xử lý hồ sơ."],
  content: ["Nội dung", "Quản lý nội dung", "Soạn thảo, kiểm duyệt và xuất bản thông tin cảnh báo."],
  menus: ["Menu", "Quản lý menu website", "Sắp xếp và kiểm soát các mục hiển thị trên thanh điều hướng công khai."],
  data: ["Dữ liệu", "Nguồn dữ liệu", "Giám sát trạng thái đồng bộ và chất lượng dữ liệu."],
  users: ["Tài khoản", "Tài khoản và phân quyền", "Quản lý người dùng nội bộ cùng phạm vi truy cập."],
  settings: ["Cấu hình", "Cấu hình hệ thống", "Thiết lập cảnh báo, quy trình duyệt và vận hành cổng."],
};

const adminContentRows = articles.map((article, index) => ({
  slug: article.slug,
  title: article.title,
  category: article.category,
  owner: article.author,
  updated: formatDate(article.updatedAt ?? article.publishedAt),
  status: "Đã xuất bản",
  image: article.image.src,
  views: new Intl.NumberFormat("vi-VN").format(1240 + index * 863),
  summary: article.excerpt,
  content: article.content.map((section) => [
    section.heading,
    ...(section.paragraphs ?? []),
    ...(section.bullets ?? []).map((item) => `• ${item}`),
    section.quote ? `“${section.quote}”` : undefined,
  ].filter(Boolean).join("\n")).join("\n\n"),
}));

type AdminContentRow = (typeof adminContentRows)[number];
const adminContentStorageKey = "qsac-admin-content-v1";
const adminContentDatabaseName = "qsac-content-v1";
const adminContentStoreName = "articles";
type IndexedAdminContentRow = AdminContentRow & { _order: number };

function openAdminContentDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(adminContentDatabaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(adminContentStoreName)) {
        request.result.createObjectStore(adminContentStoreName, { keyPath: "slug" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Không thể mở kho nội dung."));
  });
}

async function readIndexedAdminContent() {
  const database = await openAdminContentDatabase();
  try {
    return await new Promise<AdminContentRow[]>((resolve, reject) => {
      const request = database.transaction(adminContentStoreName, "readonly").objectStore(adminContentStoreName).getAll();
      request.onsuccess = () => resolve((request.result as IndexedAdminContentRow[])
        .sort((a, b) => a._order - b._order)
        .map((storedItem) => {
          const item = { ...storedItem } as Partial<IndexedAdminContentRow>;
          delete item._order;
          return item as AdminContentRow;
        }));
      request.onerror = () => reject(request.error ?? new Error("Không thể đọc kho nội dung."));
    });
  } finally {
    database.close();
  }
}

async function writeAdminContent(items: AdminContentRow[]) {
  const database = await openAdminContentDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(adminContentStoreName, "readwrite");
      const store = transaction.objectStore(adminContentStoreName);
      store.clear();
      items.forEach((item, index) => store.put({ ...item, _order: index } satisfies IndexedAdminContentRow));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Không thể lưu kho nội dung."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Lưu kho nội dung đã bị hủy."));
    });
    window.localStorage.removeItem(adminContentStorageKey);
    window.localStorage.removeItem(publishedArticlesStorageKey);
  } finally {
    database.close();
  }
}

async function readAdminContent() {
  if (typeof window === "undefined") return adminContentRows;
  try {
    const indexedRows = await readIndexedAdminContent();
    if (indexedRows.length) return indexedRows;
    const stored = JSON.parse(window.localStorage.getItem(adminContentStorageKey) ?? "[]");
    const initialRows = Array.isArray(stored) && stored.length ? stored as AdminContentRow[] : adminContentRows;
    await writeAdminContent(initialRows);
    window.localStorage.removeItem(adminContentStorageKey);
    return initialRows;
  } catch {
    try {
      const stored = JSON.parse(window.localStorage.getItem(adminContentStorageKey) ?? "[]");
      return Array.isArray(stored) && stored.length ? stored as AdminContentRow[] : adminContentRows;
    } catch {
      return adminContentRows;
    }
  }
}

function adminRowToArticle(item: AdminContentRow): Article {
  const categorySlug = categories.find(([, name]) => name === item.category)?.[0] ?? "tin-canh-bao";
  const paragraphs = item.content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const publishedAt = new Date().toISOString().slice(0, 10);
  return {
    slug: item.slug,
    title: item.title,
    excerpt: item.summary,
    content: paragraphs.map((paragraph) => ({ paragraphs: [paragraph] })),
    category: item.category,
    categorySlug,
    publishedAt,
    updatedAt: publishedAt,
    author: item.owner,
    riskLevel: "low",
    contentType: "article",
    image: { src: item.image, alt: `Ảnh bìa bài viết ${item.title}` },
    tags: [item.category, "QSAC"],
    relatedSlugs: articles.slice(0, 2).map((article) => article.slug),
    seo: { title: `${item.title} | QSAC`, description: item.summary },
  };
}

const adminSourceRows = [
  { name: "Cơ sở dữ liệu sản phẩm", records: "18.420", updated: "5 phút trước", quality: 98, status: "Ổn định" },
  { name: "Nguồn cảnh báo địa phương", records: "3.284", updated: "18 phút trước", quality: 92, status: "Ổn định" },
  { name: "Hồ sơ doanh nghiệp", records: "7.156", updated: "1 giờ trước", quality: 87, status: "Cần rà soát" },
  { name: "Danh sách tên miền rủi ro", records: "1.904", updated: "2 giờ trước", quality: 95, status: "Ổn định" },
];

const adminUserRows = [
  { initials: "NA", name: "Nguyễn An", email: "nguyenan@qsac.vn", role: "Biên tập viên", lastSeen: "8 phút trước", status: "Hoạt động" },
  { initials: "TM", name: "Trần Minh", email: "tranminh@qsac.vn", role: "Kiểm duyệt viên", lastSeen: "24 phút trước", status: "Hoạt động" },
  { initials: "LM", name: "Lê Mai", email: "lemai@qsac.vn", role: "Quản trị dữ liệu", lastSeen: "Hôm qua", status: "Hoạt động" },
  { initials: "HP", name: "Hoàng Phúc", email: "hoangphuc@qsac.vn", role: "Cộng tác viên", lastSeen: "5 ngày trước", status: "Tạm khóa" },
];

function AdminPortalNavigation({ active, onNavigate }: { active: AdminPortalSection; onNavigate?: () => void }) {
  return <nav className="adm-nav" aria-label="Điều hướng quản trị">{adminPortalNav.map(([id, label, href, Icon]) => <a key={id} className={active === id ? "active" : ""} href={href} onClick={onNavigate} aria-current={active === id ? "page" : undefined}><Icon aria-hidden /><span>{label}</span>{id === "reports" && <b>4</b>}</a>)}</nav>;
}

function formatImageSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`;
}

function dataUrlSize(dataUrl: string) {
  const payload = dataUrl.split(",")[1] || "";
  return Math.floor(payload.length * 0.75);
}

async function compressArticleCover(file: File) {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Không thể đọc ảnh."));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Ảnh không hợp lệ hoặc đã bị hỏng."));
    element.src = source;
  });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Trình duyệt không hỗ trợ nén ảnh.");
  const initialScale = Math.min(1, 1600 / image.naturalWidth, 900 / image.naturalHeight);
  let width = Math.max(1, Math.round(image.naturalWidth * initialScale));
  let height = Math.max(1, Math.round(image.naturalHeight * initialScale));
  let compressed = source;
  const targetBytes = 220 * 1024;
  for (let pass = 0; pass < 4; pass += 1) {
    canvas.width = width;
    canvas.height = height;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    for (const quality of [0.8, 0.68, 0.56, 0.46]) {
      compressed = canvas.toDataURL("image/webp", quality);
      if (dataUrlSize(compressed) <= targetBytes) break;
    }
    if (dataUrlSize(compressed) <= targetBytes || width <= 960) break;
    width = Math.max(960, Math.round(width * 0.82));
    height = Math.max(1, Math.round(height * 0.82));
  }
  const compressedBytes = dataUrlSize(compressed);
  const useOriginal = file.size <= compressedBytes;
  const finalBytes = useOriginal ? file.size : compressedBytes;
  const reduction = Math.max(0, Math.round((1 - finalBytes / file.size) * 100));
  return {
    dataUrl: useOriginal ? source : compressed,
    fileName: useOriginal ? file.name : `${file.name.replace(/\.[^.]+$/, "")}.webp`,
    meta: useOriginal ? `${formatImageSize(file.size)} • ảnh gốc đã là phiên bản nhẹ nhất` : `${formatImageSize(file.size)} → ${formatImageSize(finalBytes)} • giảm ${reduction}% • ${width} × ${height}px`,
  };
}

const adminAccessStorageKey = "qsac-admin-authenticated-v1";

function AdminLogin({ onAuthenticated }: { onAuthenticated: (remember: boolean) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const submitLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (username !== "admin" || password !== "QSAC@2026") {
      setError("Tên đăng nhập hoặc mật khẩu không chính xác.");
      return;
    }
    setError("");
    onAuthenticated(form.get("remember") === "on");
  };

  return <main className="admin-login-shell">
    <section className="admin-login-brand" aria-label="Giới thiệu hệ thống quản trị QSAC">
      <a href="/" className="admin-login-logo" aria-label="Về trang QSAC"><img src="/qsac-logo.png" alt="QSAC - Quality & Anti-Counterfeit" width="295" height="68" /></a>
      <div className="admin-login-brand-copy"><span>CỔNG ĐIỀU HÀNH NỘI BỘ</span><h1>Hệ thống quản trị nội dung QSAC</h1><p>Quản lý tin cảnh báo, hồ sơ phản ánh và dữ liệu giám sát trên một nền tảng thống nhất.</p></div>
      <div className="admin-login-assurances"><span><ShieldCheck aria-hidden /><b>Truy cập được kiểm soát</b></span><span><FileCheck2 aria-hidden /><b>Quy trình duyệt rõ ràng</b></span><span><Database aria-hidden /><b>Dữ liệu lưu trên thiết bị</b></span></div>
      <small>QSAC.VN • Trung tâm giám sát và phòng chống hàng giả</small>
    </section>
    <section className="admin-login-panel">
      <div className="admin-login-card">
        <div className="admin-login-heading"><span><LockKeyhole aria-hidden /></span><div><p>KHU VỰC QUẢN TRỊ</p><h2>Đăng nhập hệ thống</h2></div></div>
        <p className="admin-login-intro">Vui lòng sử dụng tài khoản quản trị được cấp để tiếp tục.</p>
        <form onSubmit={submitLogin} className="admin-login-form">
          <label htmlFor="admin-username">Tên đăng nhập</label>
          <div className="admin-login-input"><Users aria-hidden /><input id="admin-username" name="username" autoComplete="username" placeholder="Nhập tên đăng nhập" required autoFocus onChange={() => setError("")} /></div>
          <label htmlFor="admin-password">Mật khẩu</label>
          <div className="admin-login-input"><LockKeyhole aria-hidden /><input id="admin-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Nhập mật khẩu" required onChange={() => setError("")} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}</button></div>
          <div className="admin-login-options"><label><input type="checkbox" name="remember" /> Ghi nhớ đăng nhập</label><a href="/">Về trang công khai</a></div>
          {error && <p className="admin-login-error" role="alert"><AlertTriangle aria-hidden />{error}</p>}
          <button type="submit" className="admin-login-submit">Đăng nhập</button>
        </form>
        <p className="admin-login-help">Cần hỗ trợ truy cập? Liên hệ bộ phận quản trị hệ thống QSAC.</p>
      </div>
    </section>
  </main>;
}

function AdminAccess({ sectionSlug }: { sectionSlug?: string }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAuthenticated(window.sessionStorage.getItem(adminAccessStorageKey) === "authenticated" || window.localStorage.getItem(adminAccessStorageKey) === "authenticated");
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const authenticate = (remember: boolean) => {
    window.sessionStorage.setItem(adminAccessStorageKey, "authenticated");
    if (remember) window.localStorage.setItem(adminAccessStorageKey, "authenticated");
    setAuthenticated(true);
  };
  const signOut = () => {
    window.sessionStorage.removeItem(adminAccessStorageKey);
    window.localStorage.removeItem(adminAccessStorageKey);
    setAuthenticated(false);
  };
  if (!ready) return <main className="admin-login-loading"><img src="/qsac-logo.png" alt="QSAC" width="220" height="51" /><span>Đang kiểm tra phiên đăng nhập...</span></main>;
  return authenticated ? <AdminPortal sectionSlug={sectionSlug} onLogout={signOut} /> : <AdminLogin onAuthenticated={authenticate} />;
}

export function AdminPortal({ sectionSlug, onLogout }: { sectionSlug?: string; onLogout: () => void }) {
  const section = adminPortalSections[sectionSlug ?? ""] ?? "overview";
  const [filter, setFilter] = useState<"all" | "new" | "processing">("all");
  const [query, setQuery] = useState("");
  const [contentCategory, setContentCategory] = useState("all");
  const [contentQuery, setContentQuery] = useState("");
  const [contentPage, setContentPage] = useState(1);
  const [reports, setReports] = useState(() => adminReports.map((item) => ({ ...item })));
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [siteMenuItems, setSiteMenuItems] = useState<SiteMenuItem[]>(defaultSiteMenuItems);
  const [siteMenuLoaded, setSiteMenuLoaded] = useState(false);
  const [menuEditingId, setMenuEditingId] = useState<string | null>(null);
  const [menuDeletingId, setMenuDeletingId] = useState<string | null>(null);
  const [menuFormError, setMenuFormError] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [coverName, setCoverName] = useState("");
  const [coverMeta, setCoverMeta] = useState("");
  const [coverError, setCoverError] = useState("");
  const [coverCompressing, setCoverCompressing] = useState(false);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<AdminContentRow[]>(adminContentRows);
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  const selectedReport = reports.find((item) => item.id === selectedReportId);
  const visibleReports = reports.filter((item) => (filter === "all" || (filter === "new" ? item.status === "Mới" : item.status === "Đang xử lý")) && `${item.id} ${item.title} ${item.source}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")));
  const normalizedContentQuery = contentQuery.trim().toLocaleLowerCase("vi");
  const visibleDrafts = drafts
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => (contentCategory === "all" || item.category === contentCategory)
      && `${item.title} ${item.category} ${item.owner}`.toLocaleLowerCase("vi").includes(normalizedContentQuery));
  const totalContentPages = Math.max(1, Math.ceil(visibleDrafts.length / adminPageSize));
  const currentContentPage = Math.min(contentPage, totalContentPages);
  const pagedDrafts = visibleDrafts.slice((currentContentPage - 1) * adminPageSize, currentContentPage * adminPageSize);
  const contentRangeStart = visibleDrafts.length === 0 ? 0 : (currentContentPage - 1) * adminPageSize + 1;
  const contentRangeEnd = Math.min(currentContentPage * adminPageSize, visibleDrafts.length);
  const featuredDraft = drafts.find((item) => item.status !== "Đã xuất bản") ?? drafts[0];
  const editingMenuItem = menuEditingId && menuEditingId !== "new" ? siteMenuItems.find((item) => item.id === menuEditingId) : undefined;
  const deletingMenuItem = siteMenuItems.find((item) => item.id === menuDeletingId);
  const [, pageTitle, pageDescription] = adminPageCopy[section];
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  useEffect(() => {
    let active = true;
    void readAdminContent().then((storedDrafts) => {
      if (!active) return;
      setDrafts(storedDrafts);
      setDraftsLoaded(true);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!draftsLoaded) return;
    let active = true;
    void writeAdminContent(drafts).then(() => {
      if (active) window.dispatchEvent(new Event("qsac:articles-updated"));
    }).catch(() => {
      if (active) setToast("Không thể lưu dữ liệu bài viết trên trình duyệt này.");
    });
    return () => { active = false; };
  }, [drafts, draftsLoaded]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSiteMenuItems(readSiteMenuItems());
      setSiteMenuLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!siteMenuLoaded) return;
    try {
      window.localStorage.setItem(siteMenuStorageKey, JSON.stringify(siteMenuItems));
      window.dispatchEvent(new Event("qsac:menu-updated"));
    } catch {
      const timer = window.setTimeout(() => setToast("Không thể lưu cấu hình menu trên trình duyệt này."), 0);
      return () => window.clearTimeout(timer);
    }
  }, [siteMenuItems, siteMenuLoaded]);
  const saveMenuItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const label = String(form.get("label") ?? "").trim();
    const href = String(form.get("href") ?? "").trim();
    const visible = form.get("visible") === "on";
    if (!label || !href) return;
    if (!href.startsWith("/") || href.startsWith("//")) {
      setMenuFormError("Đường dẫn nội bộ phải bắt đầu bằng một dấu /.");
      return;
    }
    if (menuEditingId === "new") {
      setSiteMenuItems((items) => [...items, { id: `menu-${Date.now()}`, label, href, visible }]);
      showToast(`Đã thêm mục menu “${label}”.`);
    } else {
      setSiteMenuItems((items) => items.map((item) => item.id === menuEditingId ? { ...item, label, href, visible } : item));
      showToast(`Đã cập nhật mục menu “${label}”.`);
    }
    setMenuEditingId(null);
    setMenuFormError("");
  };
  const moveMenuItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= siteMenuItems.length) return;
    setSiteMenuItems((items) => {
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };
  const toggleMenuItem = (id: string) => {
    setSiteMenuItems((items) => items.map((item) => item.id === id ? { ...item, visible: !item.visible } : item));
  };
  const deleteMenuItem = () => {
    if (!menuDeletingId) return;
    const label = deletingMenuItem?.label;
    setSiteMenuItems((items) => items.filter((item) => item.id !== menuDeletingId));
    setMenuDeletingId(null);
    showToast(`Đã xóa mục menu “${label}”.`);
  };
  const updateReport = (status: "Đang xử lý" | "Đã xác minh") => {
    if (!selectedReportId) return;
    setReports((items) => items.map((item) => item.id === selectedReportId ? { ...item, status } : item));
    showToast(`Đã cập nhật ${selectedReportId}: ${status}.`);
    setSelectedReportId(null);
  };
  const resetCover = () => {
    setCoverPreview("");
    setCoverName("");
    setCoverMeta("");
    setCoverError("");
    setCoverCompressing(false);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };
  const closeCreateDialog = () => {
    setCreateOpen(false);
    resetCover();
  };
  const chooseCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setCoverError("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.");
      input.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setCoverError("Ảnh gốc phải có dung lượng không quá 10 MB.");
      input.value = "";
      return;
    }
    setCoverCompressing(true);
    setCoverError("");
    try {
      const result = await compressArticleCover(file);
      setCoverPreview(result.dataUrl);
      setCoverName(result.fileName);
      setCoverMeta(result.meta);
      setCoverError("");
    } catch (error) {
      setCoverError(error instanceof Error ? error.message : "Không thể nén ảnh. Vui lòng chọn ảnh khác.");
      input.value = "";
    } finally {
      setCoverCompressing(false);
    }
  };
  const createDraft = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const summary = String(form.get("summary") || "").trim();
    const content = String(form.get("content") || "").trim();
    if (!title) return;
    if (coverCompressing) {
      setCoverError("Vui lòng đợi hệ thống nén ảnh xong.");
      return;
    }
    if (!coverPreview) {
      setCoverError("Vui lòng chọn ảnh đại diện cho bài viết.");
      return;
    }
    setDrafts((items) => [{ slug: `ban-nhap-${Date.now()}`, title, category: String(form.get("category") || "Tin & Cảnh báo"), owner: "Quản trị viên", updated: "Vừa xong", status: "Bản nháp", image: coverPreview, views: "—", summary, content }, ...items]);
    event.currentTarget.reset();
    closeCreateDialog();
    showToast("Đã lưu bài viết vào danh sách bản nháp.");
  };
  const editDraft = editingIndex === null ? null : drafts[editingIndex];
  const viewingDraft = viewingIndex === null ? null : drafts[viewingIndex];
  const deletingDraft = deletingIndex === null ? null : drafts[deletingIndex];
  const saveDraftChanges = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingIndex === null) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const category = String(form.get("category") || "Tin & Cảnh báo");
    const summary = String(form.get("summary") || "").trim();
    const content = String(form.get("content") || "").trim();
    if (!title) return;
    setDrafts((items) => items.map((item, index) => index === editingIndex ? { ...item, title, category, summary, content, status: "Bản nháp", updated: "Vừa xong" } : item));
    setEditingIndex(null);
    showToast("Đã lưu thay đổi dưới dạng bản nháp. Hãy duyệt để xuất bản.");
  };
  const deleteDraft = () => {
    if (deletingIndex === null) return;
    const removed = drafts[deletingIndex];
    const title = removed?.title;
    setDrafts((items) => items.filter((_, index) => index !== deletingIndex));
    setDeletingIndex(null);
    showToast(`Đã xóa bài viết: ${title}.`);
  };
  const approveDraft = (index: number) => {
    const draft = drafts[index];
    if (!draft || draft.status === "Đã xuất bản") return;
    setDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, status: "Đã xuất bản", updated: "Vừa xong" } : item));
    showToast(`Đã duyệt và xuất bản bài “${draft.title}”.`);
  };

  const reportTable = <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Mã hồ sơ</th><th>Nội dung phản ánh</th><th>Nguồn</th><th>Mức độ</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{visibleReports.map((item) => <tr key={item.id}><td><b>{item.id}</b><small>{item.time}</small></td><td>{item.title}</td><td>{item.source}</td><td><span className={`adm-badge ${item.priority === "Cao" ? "danger" : "warning"}`}>{item.priority}</span></td><td><span className={`adm-badge ${item.status === "Mới" ? "info" : item.status === "Đang xử lý" ? "warning" : "success"}`}>{item.status}</span></td><td><button className="adm-icon-action" aria-label={`Mở ${item.id}`} onClick={() => setSelectedReportId(item.id)}><MoreHorizontal aria-hidden /></button></td></tr>)}{visibleReports.length === 0 && <tr><td colSpan={6}><div className="adm-empty"><Search aria-hidden /><b>Không tìm thấy hồ sơ</b><span>Thử từ khóa hoặc bộ lọc khác.</span></div></td></tr>}</tbody></table></div>;

  return <div className="adm-shell">
    <aside className="adm-sidebar"><a className="adm-logo" href="/" aria-label="Về trang QSAC"><img src="/qsac-logo.png" alt="QSAC" width="295" height="68" /></a><div className="adm-office"><span>HỆ THỐNG ĐIỀU HÀNH</span><b>Trung tâm giám sát QSAC</b></div><AdminPortalNavigation active={section} /><div className="adm-sidebar-status"><span><i aria-hidden /> Hệ thống hoạt động</span><small>Dữ liệu được giám sát liên tục</small></div><div className="adm-sidebar-foot"><a href="/"><Eye aria-hidden /> Xem trang công khai</a><button type="button" onClick={onLogout}><LogOut aria-hidden /> Đăng xuất</button><small>QSAC Admin • v1.0</small></div></aside>
    <section className="adm-workspace">
      <header className="adm-topbar"><div className="adm-mobile-menu"><Sheet open={menuOpen} onOpenChange={setMenuOpen}><SheetTrigger asChild><button className="adm-round-button" aria-label="Mở điều hướng quản trị"><PanelLeft aria-hidden /></button></SheetTrigger><SheetContent side="left" className="admin-mobile-sheet"><SheetHeader><SheetTitle>Quản trị QSAC</SheetTitle><SheetDescription>Chọn khu vực làm việc.</SheetDescription></SheetHeader><AdminPortalNavigation active={section} onNavigate={() => setMenuOpen(false)} /></SheetContent></Sheet></div><div className="adm-top-context"><span>QSAC.VN</span><b>{adminPageCopy[section][0]}</b></div><div className="adm-user-actions"><div className="adm-notifications"><button className="adm-round-button" aria-label="Thông báo" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Bell aria-hidden /><span>3</span></button>{notificationsOpen && <div className="adm-notification-panel"><b>Thông báo mới</b><a href="/admin/phan-anh">3 phản ánh cần phân loại</a><a href="/admin/noi-dung">2 bài viết đang chờ duyệt</a><button type="button" onClick={() => setNotificationsOpen(false)}>Đóng</button></div>}</div><div className="adm-avatar">QT</div><div className="adm-user-name"><b>Quản trị viên</b><small>Ban biên tập QSAC</small></div></div></header>
      <main className="adm-main"><div className="adm-page-head"><div><span>QUẢN TRỊ / {adminPageCopy[section][0].toUpperCase()}</span><h1>{pageTitle}</h1><p>{pageDescription}</p></div>{section === "content" && <button className="adm-primary" onClick={() => setCreateOpen(true)}><Plus aria-hidden /> Tạo bài viết</button>}{section === "menus" && <button className="adm-primary" onClick={() => { setMenuEditingId("new"); setMenuFormError(""); }}><Plus aria-hidden /> Thêm mục menu</button>}</div>
        {section === "content" && featuredDraft && <section className="adm-editorial-overview"><article className="adm-featured-content"><img src={featuredDraft.image} alt="" width="1280" height="720" /><div><span>{featuredDraft.status === "Đã xuất bản" ? "NỘI DUNG MỚI NHẤT" : "NỘI DUNG CẦN DUYỆT"}</span><h2>{featuredDraft.title}</h2><p>{featuredDraft.status === "Đã xuất bản" ? "Theo dõi nội dung mới nhất đang hiển thị trên trang công khai." : "Kiểm tra ảnh bìa, nguồn trích dẫn và thông tin khuyến cáo trước khi xuất bản."}</p><button type="button" onClick={() => { const index = drafts.findIndex((item) => item.slug === featuredDraft.slug); if (index >= 0) setEditingIndex(index); }}>Mở trình biên tập</button></div></article><aside className="adm-publish-queue"><div><span>LỊCH XUẤT BẢN</span><b>Hôm nay, 07/10/2026</b></div><ol><li><time>09:30</time><span><b>Bản tin cảnh báo buổi sáng</b><small>Đã xuất bản</small></span></li><li><time>14:00</time><span><b>Cảnh báo gian hàng giả mạo</b><small>Chờ duyệt</small></span></li><li><time>16:30</time><span><b>Cập nhật dữ liệu thu hồi</b><small>Đang biên tập</small></span></li></ol></aside></section>}
        {section === "overview" && <>
          <section className="adm-kpis" aria-label="Chỉ số vận hành"><article><span className="danger"><ClipboardList /></span><div><small>Chờ xử lý</small><strong>12</strong><em>+3 trong hôm nay</em></div></article><article><span><Clock3 /></span><div><small>Thời gian xử lý TB</small><strong>2,4h</strong><em>Giảm 18 phút</em></div></article><article><span><FileCheck2 /></span><div><small>Đã xác minh</small><strong>248</strong><em>+18 trong tuần</em></div></article><article><span><FileText /></span><div><small>Chờ duyệt nội dung</small><strong>02</strong><em>Cần hoàn tất hôm nay</em></div></article></section>
          <section className="adm-overview-grid"><article className="adm-card"><div className="adm-card-head"><div><h2>Hàng đợi ưu tiên</h2><p>Hồ sơ mới và đang xử lý.</p></div><a href="/admin/phan-anh">Mở trang phản ánh</a></div>{reportTable}</article><aside className="adm-card"><div className="adm-card-head"><div><h2>Hiệu suất 7 ngày</h2><p>Hồ sơ hoàn tất theo ngày.</p></div><TrendingUp /></div><div className="adm-bars">{[42,58,46,72,66,88,76].map((height, index) => <div key={index}><span style={{height:`${height}%`}} /><small>{["T2","T3","T4","T5","T6","T7","CN"][index]}</small></div>)}</div><div className="adm-summary"><b>126</b><span>hồ sơ hoàn tất</span><em>+14,2%</em></div><div className="adm-activity"><h3>Hoạt động mới nhất</h3><p><CheckCircle2 /> Duyệt cảnh báo mới <small>8 phút trước</small></p><p><Eye /> Mở xác minh RP-1041 <small>24 phút trước</small></p><p><AlertTriangle /> Gắn cờ liên kết rủi ro <small>41 phút trước</small></p></div></aside></section>
        </>}
        {section === "reports" && <><section className="adm-stat-strip"><div><span>Tất cả hồ sơ</span><b>1.248</b></div><div><span>Mới tiếp nhận</span><b>12</b></div><div><span>Đang xử lý</span><b>37</b></div><div><span>Đã xác minh</span><b>1.199</b></div></section><section className="adm-card"><div className="adm-list-toolbar"><div className="adm-tabs" role="group" aria-label="Lọc phản ánh"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Tất cả</button><button className={filter === "new" ? "active" : ""} onClick={() => setFilter("new")}>Mới</button><button className={filter === "processing" ? "active" : ""} onClick={() => setFilter("processing")}>Đang xử lý</button></div><label><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mã hồ sơ, nội dung..." /></label></div>{reportTable}</section></>}
        {section === "content" && <>
          <section className="adm-stat-strip">
            <div><span>Tổng nội dung</span><b>{drafts.length}</b></div>
            <div><span>Bản nháp</span><b>{drafts.filter((item) => item.status === "Bản nháp").length}</b></div>
            <div><span>Chờ duyệt</span><b>{drafts.filter((item) => item.status === "Chờ duyệt").length}</b></div>
            <div><span>Đã xuất bản</span><b>{drafts.filter((item) => item.status === "Đã xuất bản").length}</b></div>
          </section>
          <section className="adm-card">
            <div className="adm-list-toolbar">
              <div><h2>Toàn bộ bài viết trên website</h2><p>{visibleDrafts.length} bài viết {contentCategory === "all" ? "từ tất cả chuyên mục" : `thuộc ${contentCategory}`} — không giới hạn ở 12 bài.</p></div>
              <div className="adm-content-filters">
                <label className="adm-category-select"><span>Chuyên mục</span><select value={contentCategory} onChange={(event) => { setContentCategory(event.target.value); setContentPage(1); }} aria-label="Lọc bài viết theo chuyên mục"><option value="all">Tất cả chuyên mục ({drafts.length})</option>{categories.map(([, name]) => { const count = drafts.filter((item) => item.category === name).length; return <option key={name} value={name}>{name} ({count})</option>; })}</select></label>
                <label className="adm-content-search"><Search /><input value={contentQuery} onChange={(event) => { setContentQuery(event.target.value); setContentPage(1); }} placeholder="Tìm tiêu đề bài viết..." /></label>
              </div>
            </div>
            <div className="adm-table-wrap"><table className="adm-table adm-content-table"><thead><tr><th>Tiêu đề</th><th>Chuyên mục</th><th>Người phụ trách</th><th>Cập nhật</th><th>Hoạt động</th></tr></thead><tbody>{pagedDrafts.map(({ item, index }) => <tr key={`${item.slug}-${item.updated}`}><td><div className="adm-content-title"><img src={item.image} alt="" width="108" height="62" /><span className="adm-content-copy"><b>{item.title}</b><small className={item.status === "Đã xuất bản" ? "published" : "draft"}>{item.status}</small></span></div></td><td>{item.category}</td><td>{item.owner}</td><td>{item.updated}</td><td><div className="adm-row-actions"><button type="button" className="view" onClick={() => setViewingIndex(index)} aria-label={`Xem bài ${item.title}`}><Eye aria-hidden /><span>Xem</span></button><button type="button" className="edit" onClick={() => setEditingIndex(index)} aria-label={`Sửa bài ${item.title}`}><Pencil aria-hidden /><span>Sửa</span></button>{item.status !== "Đã xuất bản" && <button type="button" className="approve" onClick={() => approveDraft(index)} aria-label={`Duyệt và đăng bài ${item.title}`}><CheckCircle2 aria-hidden /><span>Duyệt</span></button>}<button type="button" className="delete" onClick={() => setDeletingIndex(index)} aria-label={`Xóa bài ${item.title}`}><Trash2 aria-hidden /><span>Xóa</span></button></div></td></tr>)}{visibleDrafts.length === 0 && <tr><td colSpan={5}><div className="adm-empty"><Search aria-hidden /><b>Không tìm thấy bài viết</b><span>Thử chọn chuyên mục khác hoặc thay đổi từ khóa tìm kiếm.</span></div></td></tr>}</tbody></table></div>
            {visibleDrafts.length > 0 && <div className="adm-pagination"><span>Hiển thị {contentRangeStart}–{contentRangeEnd} trên {visibleDrafts.length} bài viết</span>{totalContentPages > 1 && <div>{currentContentPage > 1 && <button type="button" onClick={() => setContentPage((value) => Math.max(1, value - 1))}>Trang trước</button>}<b>Trang {currentContentPage}/{totalContentPages}</b>{currentContentPage < totalContentPages && <button type="button" onClick={() => setContentPage((value) => Math.min(totalContentPages, value + 1))}>Trang sau</button>}</div>}</div>}
          </section>
        </>}
        {section === "menus" && <>
          <section className="adm-stat-strip">
            <div><span>Tổng mục menu</span><b>{siteMenuItems.length}</b></div>
            <div><span>Đang hiển thị</span><b>{siteMenuItems.filter((item) => item.visible).length}</b></div>
            <div><span>Đang ẩn</span><b>{siteMenuItems.filter((item) => !item.visible).length}</b></div>
            <div><span>Vị trí hiển thị</span><b>Đầu trang</b></div>
          </section>
          <section className="adm-card adm-menu-card">
            <div className="adm-card-head"><div><h2>Cấu trúc menu chính</h2><p>Thứ tự trong danh sách cũng là thứ tự hiển thị trên website công khai.</p></div><a href="/" target="_blank" rel="noreferrer">Xem trên website</a></div>
            <div className="adm-table-wrap"><table className="adm-table adm-menu-table"><thead><tr><th>Thứ tự</th><th>Tên mục menu</th><th>Đường dẫn</th><th>Trạng thái</th><th>Hoạt động</th></tr></thead><tbody>{siteMenuItems.map((item, index) => <tr key={item.id}><td><div className="adm-menu-order"><b>{String(index + 1).padStart(2, "0")}</b><span>{index > 0 && <button type="button" onClick={() => moveMenuItem(index, -1)} aria-label={`Đưa ${item.label} lên`}><ChevronUp aria-hidden /></button>}{index < siteMenuItems.length - 1 && <button type="button" onClick={() => moveMenuItem(index, 1)} aria-label={`Đưa ${item.label} xuống`}><ChevronDown aria-hidden /></button>}</span></div></td><td><div className="adm-menu-name"><span><Menu aria-hidden /></span><b>{item.label}<small>{item.id.startsWith("menu-") ? "Mục tùy chỉnh" : "Chuyên mục hệ thống"}</small></b></div></td><td><code>{item.href}</code></td><td><button type="button" className={`adm-menu-visibility ${item.visible ? "active" : "hidden"}`} aria-pressed={item.visible} onClick={() => toggleMenuItem(item.id)}><i aria-hidden />{item.visible ? "Đang hiển thị" : "Đang ẩn"}</button></td><td><div className="adm-row-actions"><button type="button" className="edit" onClick={() => { setMenuEditingId(item.id); setMenuFormError(""); }}><Pencil aria-hidden /><span>Sửa</span></button><button type="button" className="delete" onClick={() => setMenuDeletingId(item.id)}><Trash2 aria-hidden /><span>Xóa</span></button></div></td></tr>)}{siteMenuItems.length === 0 && <tr><td colSpan={5}><div className="adm-empty"><Menu aria-hidden /><b>Chưa có mục menu</b><span>Thêm mục đầu tiên để hiển thị trên website.</span></div></td></tr>}</tbody></table></div>
            <div className="adm-menu-note"><ShieldCheck aria-hidden /><span><b>Thay đổi được áp dụng tự động</b><small>Thanh menu công khai sẽ cập nhật ngay sau khi thêm, sửa, ẩn hoặc đổi thứ tự.</small></span></div>
          </section>
        </>}
        {section === "data" && <><section className="adm-data-summary"><article><Database /><span><small>Tổng bản ghi</small><b>30.764</b></span></article><article><ShieldCheck /><span><small>Chất lượng trung bình</small><b>93%</b></span></article><article><Clock3 /><span><small>Lần đồng bộ gần nhất</small><b>5 phút trước</b></span></article></section><section className="adm-card"><div className="adm-card-head"><div><h2>Nguồn dữ liệu kết nối</h2><p>Theo dõi chất lượng và thời điểm cập nhật.</p></div></div><div className="adm-source-list">{adminSourceRows.map((source) => <div key={source.name}><Database /><span><b>{source.name}</b><small>{source.records} bản ghi • {source.updated}</small></span><div className="adm-quality"><i><em style={{width:`${source.quality}%`}} /></i><b>{source.quality}%</b></div><span className={`adm-badge ${source.status === "Ổn định" ? "success" : "warning"}`}>{source.status}</span></div>)}</div></section></>}
        {section === "users" && <><section className="adm-stat-strip"><div><span>Tổng tài khoản</span><b>18</b></div><div><span>Đang hoạt động</span><b>15</b></div><div><span>Tạm khóa</span><b>02</b></div><div><span>Chờ kích hoạt</span><b>01</b></div></section><section className="adm-card"><div className="adm-list-toolbar"><div><h2>Danh sách tài khoản</h2><p>Vai trò và trạng thái truy cập hệ thống.</p></div></div><div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Người dùng</th><th>Vai trò</th><th>Hoạt động gần nhất</th><th>Trạng thái</th></tr></thead><tbody>{adminUserRows.map((user) => <tr key={user.email}><td><div className="adm-user-cell"><span>{user.initials}</span><b>{user.name}<small>{user.email}</small></b></div></td><td>{user.role}</td><td>{user.lastSeen}</td><td><span className={`adm-badge ${user.status === "Hoạt động" ? "success" : "neutral"}`}>{user.status}</span></td></tr>)}</tbody></table></div></section></>}
        {section === "settings" && <section className="adm-settings-grid"><article className="adm-card adm-settings-form"><div className="adm-card-head"><div><h2>Thông báo và cảnh báo</h2><p>Trạng thái cấu hình hiện tại của hệ thống.</p></div><Bell /></div><div className="adm-setting-row"><span><b>Phản ánh ưu tiên cao</b><small>Thông báo ngay khi tiếp nhận hồ sơ mức cao.</small></span><em className="active">Đang bật</em></div><div className="adm-setting-row"><span><b>Nội dung chờ duyệt</b><small>Nhắc biên tập viên khi bài viết chờ quá 4 giờ.</small></span><em className="active">Đang bật</em></div><div className="adm-setting-row"><span><b>Lỗi đồng bộ dữ liệu</b><small>Cảnh báo khi nguồn dữ liệu gián đoạn.</small></span><em className="active">Đang bật</em></div></article><article className="adm-card adm-settings-form"><div className="adm-card-head"><div><h2>Quy trình kiểm duyệt</h2><p>Trạng thái quy trình xuất bản hiện tại.</p></div><ShieldCheck /></div><div className="adm-setting-row"><span><b>Duyệt hai bước</b><small>Yêu cầu một kiểm duyệt viên trước khi xuất bản.</small></span><em className="active">Đang bật</em></div><div className="adm-setting-row"><span><b>Tự động lưu bản nháp</b><small>Lưu nội dung trong quá trình biên tập.</small></span><em className="active">Đang bật</em></div><div className="adm-setting-row"><span><b>Chế độ bảo trì</b><small>Tạm dừng xuất bản nội dung mới.</small></span><em>Đang tắt</em></div></article></section>}
      </main>
    </section>
    <AccessibleDialog open={Boolean(menuEditingId)} onOpenChange={(open) => { if (!open) { setMenuEditingId(null); setMenuFormError(""); } }} title={menuEditingId === "new" ? "Thêm mục menu" : "Chỉnh sửa mục menu"} description="Thiết lập tên, đường dẫn và trạng thái hiển thị trên website công khai.">{menuEditingId && <form key={menuEditingId} className="admin-dialog-form adm-menu-form" onSubmit={saveMenuItem}><label htmlFor="menu-label">Tên mục menu</label><input id="menu-label" name="label" required defaultValue={editingMenuItem?.label ?? ""} placeholder="Ví dụ: Tin & Cảnh báo" onChange={() => setMenuFormError("")} /><label htmlFor="menu-href">Đường dẫn nội bộ</label><input id="menu-href" name="href" required defaultValue={editingMenuItem?.href ?? "/"} placeholder="/archive/tin-canh-bao" onChange={() => setMenuFormError("")} /><small className="adm-menu-form-help">Dùng đường dẫn bắt đầu bằng dấu /, ví dụ: /archive/tin-canh-bao</small><label className="adm-menu-visible"><input type="checkbox" name="visible" defaultChecked={editingMenuItem?.visible ?? true} /><span><b>Hiển thị trên website</b><small>Tắt tùy chọn này để tạm ẩn mục menu mà không cần xóa.</small></span></label>{menuFormError && <p className="adm-field-error" role="alert">{menuFormError}</p>}<div className="admin-dialog-actions"><button type="button" className="adm-secondary" onClick={() => setMenuEditingId(null)}>Hủy</button><button type="submit" className="adm-primary">{menuEditingId === "new" ? "Thêm vào menu" : "Lưu thay đổi"}</button></div></form>}</AccessibleDialog>
    <AlertDialog open={Boolean(deletingMenuItem)} onOpenChange={(open) => !open && setMenuDeletingId(null)}><AlertDialogContent className="adm-delete-dialog"><AlertDialogHeader><AlertDialogTitle>Xóa mục menu?</AlertDialogTitle><AlertDialogDescription>Mục “{deletingMenuItem?.label}” sẽ bị xóa khỏi thanh điều hướng công khai. Các bài viết và chuyên mục liên quan không bị xóa.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={deleteMenuItem}>Xóa mục menu</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AccessibleDialog open={createOpen} onOpenChange={(open) => open ? setCreateOpen(true) : closeCreateDialog()} title="Tạo bài viết mới" description="Bài viết được lưu dưới dạng bản nháp để tiếp tục biên tập."><form className="admin-dialog-form adm-create-article-form" onSubmit={createDraft}><label htmlFor="portal-title">Tiêu đề bài viết</label><input id="portal-title" name="title" required placeholder="Nhập tiêu đề..." /><label htmlFor="portal-category">Chuyên mục</label><select id="portal-category" name="category" defaultValue="Tin & Cảnh báo">{categories.map(([, name]) => <option key={name}>{name}</option>)}</select><label htmlFor="portal-summary">Tóm tắt</label><textarea id="portal-summary" name="summary" rows={2} required placeholder="Nhập đoạn giới thiệu ngắn..." /><label htmlFor="portal-content">Nội dung bài viết</label><textarea id="portal-content" name="content" rows={8} required placeholder="Nhập đầy đủ nội dung bài viết..." /><div className="adm-cover-field"><label htmlFor="portal-cover">Ảnh đại diện <span aria-hidden>*</span></label>{coverPreview ? <div className="adm-cover-preview"><img src={coverPreview} alt="Ảnh đại diện đã chọn" width="320" height="180" /><div><b>{coverName}</b><small>{coverMeta}</small><em>Tối ưu WebP</em></div><button type="button" onClick={resetCover}>Xóa ảnh</button></div> : coverCompressing ? <div className="adm-cover-processing" role="status"><span className="spinner" /><div><b>Đang nén ảnh...</b><small>Hệ thống đang giảm kích thước và chuyển sang WebP.</small></div></div> : <label className="adm-cover-drop" htmlFor="portal-cover"><Upload aria-hidden /><span><b>Chọn ảnh từ máy</b><small>JPG, PNG hoặc WebP • tối đa 10 MB • tự động nén khi tải lên</small></span></label>}<input ref={coverInputRef} className="sr-only" id="portal-cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseCover} aria-describedby={coverError ? "portal-cover-error" : undefined} />{coverError && <p className="adm-field-error" id="portal-cover-error" role="alert">{coverError}</p>}</div><div className="admin-dialog-actions"><button type="button" className="adm-secondary" onClick={closeCreateDialog}>Hủy</button><button type="submit" className="adm-primary" disabled={coverCompressing}>Lưu bản nháp</button></div></form></AccessibleDialog>
    <AccessibleDialog open={Boolean(viewingDraft)} onOpenChange={(open) => !open && setViewingIndex(null)} title="Xem toàn bộ bài viết" description="Kiểm tra đầy đủ nội dung trước khi chỉnh sửa hoặc xuất bản.">{viewingDraft && <article className="adm-article-preview"><img src={viewingDraft.image} alt="" width="640" height="360" /><span className={`adm-badge ${viewingDraft.status === "Đã xuất bản" ? "success" : viewingDraft.status === "Chờ duyệt" ? "warning" : "neutral"}`}>{viewingDraft.status}</span><h3>{viewingDraft.title}</h3><dl><div><dt>Chuyên mục</dt><dd>{viewingDraft.category}</dd></div><div><dt>Người phụ trách</dt><dd>{viewingDraft.owner}</dd></div><div><dt>Cập nhật</dt><dd>{viewingDraft.updated}</dd></div></dl><section className="adm-preview-summary"><h4>Tóm tắt</h4><p>{viewingDraft.summary}</p></section><section className="adm-preview-body"><h4>Nội dung đầy đủ</h4>{viewingDraft.content.split(/\n\s*\n/).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>)}</section><div className="admin-dialog-actions"><button type="button" className="adm-secondary" onClick={() => setViewingIndex(null)}>Đóng</button><button type="button" className="adm-primary" onClick={() => { const index = viewingIndex; setViewingIndex(null); setEditingIndex(index); }}>Chỉnh sửa bài</button></div></article>}</AccessibleDialog>
    <AccessibleDialog open={Boolean(editDraft)} onOpenChange={(open) => !open && setEditingIndex(null)} title="Sửa toàn bộ bài viết" description="Cập nhật tiêu đề, chuyên mục, tóm tắt và nội dung bài viết.">{editDraft && <form key={`${editingIndex}-${editDraft.title}`} className="admin-dialog-form adm-full-editor" onSubmit={saveDraftChanges}><div className="adm-edit-cover"><img src={editDraft.image} alt="" width="160" height="90" /><span><b>Ảnh đại diện hiện tại</b><small>{editDraft.status} • {editDraft.updated}</small></span></div><label htmlFor="edit-title">Tiêu đề bài viết</label><input id="edit-title" name="title" required defaultValue={editDraft.title} /><label htmlFor="edit-category">Chuyên mục</label><select id="edit-category" name="category" defaultValue={editDraft.category}>{categories.map(([, name]) => <option key={name}>{name}</option>)}</select><label htmlFor="edit-summary">Tóm tắt</label><textarea id="edit-summary" name="summary" rows={3} required defaultValue={editDraft.summary} /><label htmlFor="edit-content">Nội dung bài viết</label><textarea id="edit-content" name="content" rows={12} required defaultValue={editDraft.content} /><div className="admin-dialog-actions"><button type="button" className="adm-secondary" onClick={() => setEditingIndex(null)}>Hủy</button><button type="submit" className="adm-primary">Lưu thay đổi</button></div></form>}</AccessibleDialog>
    <AlertDialog open={Boolean(deletingDraft)} onOpenChange={(open) => !open && setDeletingIndex(null)}><AlertDialogContent className="adm-delete-dialog"><AlertDialogHeader><AlertDialogTitle>Xóa bài viết?</AlertDialogTitle><AlertDialogDescription>Bài “{deletingDraft?.title}” sẽ bị xóa khỏi danh sách nội dung. Thao tác này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={deleteDraft}>Xóa bài viết</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AccessibleDialog open={Boolean(selectedReport)} onOpenChange={(open) => !open && setSelectedReportId(null)} title={selectedReport ? `Hồ sơ ${selectedReport.id}` : "Chi tiết phản ánh"} description="Kiểm tra thông tin và cập nhật trạng thái xử lý.">{selectedReport && <div className="admin-report-detail"><dl><div><dt>Nội dung</dt><dd>{selectedReport.title}</dd></div><div><dt>Nguồn</dt><dd>{selectedReport.source}</dd></div><div><dt>Ưu tiên</dt><dd>{selectedReport.priority}</dd></div><div><dt>Trạng thái</dt><dd>{selectedReport.status}</dd></div></dl><div className="admin-dialog-actions"><button type="button" className="adm-secondary" onClick={() => updateReport("Đang xử lý")}>Đang xử lý</button><button type="button" className="adm-primary" onClick={() => updateReport("Đã xác minh")}>Xác minh hồ sơ</button></div></div>}</AccessibleDialog>
    {toast && <div className="admin-toast" role="status"><CheckCircle2 aria-hidden />{toast}</div>}
  </div>;
}

export function ChatWidget() { const [open, setOpen] = useState(false); return <><button className="chat-fab" onClick={() => setOpen(true)} aria-label="Chat với tư vấn viên"><MessageCircle aria-hidden /><span>Hỗ trợ</span></button><AccessibleDialog open={open} onOpenChange={setOpen} title="Tư vấn viên QSAC" description="Kênh hỗ trợ demo, không gửi nội dung ra ngoài."><div className="chat-body"><div className="chat-message">Xin chào! Bạn cần hỗ trợ tra cứu hay báo cáo vi phạm?</div><label htmlFor="chat-message">Nội dung</label><textarea id="chat-message" rows={3} placeholder="Nhập câu hỏi..." /><button className="btn primary" onClick={() => setOpen(false)}>Gửi tin nhắn demo</button></div></AccessibleDialog></>; }

export function SiteFooter() { return <footer className="site-footer"><div className="container footer-grid"><div><Logo /><p>Cổng giám sát, cảnh báo và tiếp nhận phản ánh về hàng giả, gian lận thương mại và rủi ro số.</p><a className="footer-hotline" href="tel:389"><Phone aria-hidden /> ALO 389 • 24/7</a></div><div><h2>Về chúng tôi</h2>{[["Giới thiệu","gioi-thieu"],["Quy chế biên tập","quy-che-bien-tap"],["Đính chính","dinh-chinh"],["Bảo mật dữ liệu","bao-mat-du-lieu"]].map(([n,s]) => <a href={`/${s}`} key={s}>{n}</a>)}</div><div><h2>Chuyên mục</h2>{categories.slice(0, 5).map(([s,n]) => <a href={`/archive/${s}`} key={s}>{n}</a>)}</div><div><h2>Tiện ích</h2><a href="/tra-cuu-traceid">Tra cứu TraceID</a><a href="/kiem-tra-link-tmdt">Kiểm tra link TMĐT</a><a href="/bao-cao-vi-pham">Báo cáo vi phạm</a></div></div><div className="container footer-bottom"><span>© 2026 QSAC.VN • Website minh họa</span><a href="/chinh-sach-bao-mat">Chính sách bảo mật</a><a href="/dieu-khoan-su-dung">Điều khoản sử dụng</a></div></footer>; }

function PageShell({ children, active }: { children: React.ReactNode; active?: string }) { return <><SiteHeader active={active} /><main id="main-content">{children}</main><SiteFooter /><ChatWidget /></>; }

export default function SiteApp({ segments, searchParams }: { segments: string[]; searchParams: Record<string, string> }) {
  const { items: siteArticles, ready: articlesReady } = usePublishedArticles();
  const [first, second] = segments;
  if (!first) return <HomePage items={siteArticles} />;
  if (first === "admin") return <AdminAccess sectionSlug={second} />;
  if (first === "archive" && second) return <ArchivePage slug={second} page={Number(searchParams.page) || 1} items={siteArticles} />;
  if (first === "posts" && second) {
    const article = siteArticles.find((item) => item.slug === second);
    if (article) return <ArticlePage article={article} items={siteArticles} />;
    if (!articlesReady) return <PageShell><div className="container narrow-page"><LoadingState /></div></PageShell>;
    return <StaticPage slug="not-found" />;
  }
  if (first === "search") return <SearchPage params={searchParams} items={siteArticles} />;
  if (first === "tra-cuu-traceid") return <ToolPage type="trace" />;
  if (first === "kiem-tra-link-tmdt") return <ToolPage type="link" />;
  if (first === "bao-cao-vi-pham") return <ToolPage type="report" />;
  return <StaticPage slug={first} />;
}
