import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteApp from "@/components/SiteApp";
import { articles, categoryBySlug } from "@/lib/articles";

type Props = { params: Promise<{ slug?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const segments = (await params).slug ?? [];
  const [first, second] = segments;
  const origin = "https://qsac-canh-bao.tracisextonuqazo.chatgpt.site";
  let title = "QSAC - Giám sát chất lượng & phòng chống hàng giả";
  let description = "Cổng cảnh báo, tra cứu và tiếp nhận phản ánh về hàng giả, gian lận thương mại và rủi ro số.";
  let robots: Metadata["robots"] = { index: true, follow: true };
  if (first === "archive" && second && categoryBySlug[second]) {
    title = categoryBySlug[second].name; description = categoryBySlug[second].description;
  } else if (first === "posts" && second) {
    const article = articles.find((item) => item.slug === second);
    if (article) { title = article.seo.title; description = article.seo.description; }
  } else if (first === "search") {
    title = "Tìm kiếm"; description = "Tìm kiếm nội dung trên cổng thông tin QSAC."; robots = { index: false, follow: true };
  } else if (first) {
    const labels: Record<string, string> = {
      "canh-bao-khan-cap":"Cảnh báo khẩn cấp", "tra-cuu-traceid":"Tra cứu TraceID",
      "kiem-tra-link-tmdt":"Kiểm tra link TMĐT", "bao-cao-vi-pham":"Báo cáo vi phạm",
      "gioi-thieu":"Giới thiệu", "quy-che-bien-tap":"Quy chế biên tập", "dinh-chinh":"Đính chính",
      "bao-mat-du-lieu":"Bảo mật dữ liệu", "chinh-sach-bao-mat":"Chính sách bảo mật", "dieu-khoan-su-dung":"Điều khoản sử dụng",
    };
    title = labels[first] ?? "Không tìm thấy trang"; description = `${title} - QSAC.VN`;
    if (!labels[first]) robots = { index: false, follow: false };
  }
  const path = "/" + segments.join("/");
  return { title, description, robots, alternates:{ canonical:path },
    openGraph:{ title, description, url:new URL(path,origin), images:[{url:"/og.png",width:1536,height:1024,alt:"QSAC - Cổng cảnh báo và xác thực"}] },
    twitter:{card:"summary_large_image",title,description,images:["/og.png"]} };
}

export default async function CatchAllPage({ params, searchParams }: Props) {
  const segments = (await params).slug ?? [];
  const [first, second] = segments;
  const knownStatic = ["canh-bao-khan-cap","tra-cuu-traceid","kiem-tra-link-tmdt","bao-cao-vi-pham","gioi-thieu","quy-che-bien-tap","dinh-chinh","bao-mat-du-lieu","chinh-sach-bao-mat","dieu-khoan-su-dung","search"];
  const knownRoute = !first || (first === "archive" && Boolean(second && categoryBySlug[second])) || (first === "posts" && Boolean(articles.find((item) => item.slug === second))) || knownStatic.includes(first);
  if (!knownRoute) notFound();
  const raw = await searchParams;
  const normalized = Object.fromEntries(Object.entries(raw).map(([key,value]) => [key,Array.isArray(value)?value[0]??"":value??""]));
  const article = segments[0] === "posts" ? articles.find((item) => item.slug === segments[1]) : undefined;
  const entity = article ? {
    "@type":"NewsArticle",headline:article.title,datePublished:article.publishedAt,
    dateModified:article.updatedAt??article.publishedAt,author:{"@type":"Organization",name:article.author},
    publisher:{"@type":"Organization",name:"QSAC"},description:article.excerpt,
    mainEntityOfPage:`https://qsac-canh-bao.tracisextonuqazo.chatgpt.site/posts/${article.slug}`,
  } : {"@type":"Organization",name:"QSAC",url:"https://qsac-canh-bao.tracisextonuqazo.chatgpt.site"};
  const jsonLd = {"@context":"https://schema.org","@graph":[entity,{"@type":"BreadcrumbList","itemListElement":segments.map((segment,index)=>({"@type":"ListItem",position:index+1,name:segment,item:`https://qsac-canh-bao.tracisextonuqazo.chatgpt.site/${segments.slice(0,index+1).join("/")}`}))}]};
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/><SiteApp segments={segments} searchParams={normalized}/></>;
}
