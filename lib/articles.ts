export type RiskLevel = "high" | "medium" | "low";
export type ContentType = "article" | "video" | "document" | "report";

export type ArticleSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  quote?: string;
};

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  content: ArticleSection[];
  category: string;
  categorySlug: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  riskLevel?: RiskLevel;
  contentType?: ContentType;
  image: { src: string; alt: string };
  tags: string[];
  relatedSlugs: string[];
  seo: { title: string; description: string };
};

const art = (
  slug: string,
  title: string,
  excerpt: string,
  category: string,
  categorySlug: string,
  publishedAt: string,
  riskLevel: RiskLevel | undefined,
  tags: string[],
  contentType: ContentType = "article",
): Article => ({
  slug,
  title,
  excerpt,
  category,
  categorySlug,
  publishedAt,
  updatedAt: publishedAt,
  author: "Ban biên tập QSAC",
  riskLevel,
  contentType,
  image: { src: `/images/${categorySlug}.svg`, alt: `Minh họa chủ đề ${title.toLowerCase()}` },
  tags,
  relatedSlugs: [],
  seo: { title: `${title} | QSAC`, description: excerpt },
  content: [
    {
      heading: "Dấu hiệu cần lưu ý",
      paragraphs: [excerpt, "Các tình huống đáng ngờ thường kết hợp thông tin có vẻ chính xác với yêu cầu xử lý gấp. Người dùng nên dừng lại, kiểm tra nguồn và đối chiếu qua kênh chính thức."],
      bullets: ["Không cung cấp mã xác thực, mật khẩu hoặc thông tin thanh toán.", "Đối chiếu tên miền, số điện thoại và đơn vị phát hành.", "Lưu ảnh chụp, đường dẫn và thời điểm phát hiện để phục vụ xác minh."],
    },
    {
      heading: "Khuyến nghị từ QSAC",
      paragraphs: ["Ưu tiên xác minh độc lập trước khi chuyển tiền hoặc chia sẻ dữ liệu. Nếu đã phát sinh thiệt hại, hãy liên hệ ngân hàng, lưu lại chứng cứ và gửi phản ánh qua cơ quan có thẩm quyền."],
      quote: "Một phút kiểm tra có thể ngăn ngừa nhiều giờ xử lý hậu quả.",
    },
  ],
});

export const articles: Article[] = [
  art("canh-giac-gia-mao-hoan-tien-don-hang", "Cảnh giác chiêu trò giả mạo hoàn tiền và đơn hàng", "Đối tượng giả danh sàn thương mại điện tử, gửi liên kết nhận hoàn tiền để thu thập thông tin ngân hàng.", "Tin & Cảnh báo", "tin-canh-bao", "2026-10-05", "high", ["hoàn tiền", "lừa đảo", "đơn hàng"]),
  art("nhan-dien-hang-gia-tren-san-so", "07 dấu hiệu nhận biết hàng giả, hàng nhái trên sàn số", "Giá bán bất thường, thông tin người bán mập mờ và hình ảnh thiếu nhất quán là những tín hiệu cần thận trọng.", "Tin & Cảnh báo", "tin-canh-bao", "2026-10-03", "medium", ["hàng giả", "sàn số", "người tiêu dùng"]),
  art("alo-389-tiep-nhan-phan-anh-my-pham", "ALO 389 tiếp nhận phản ánh mỹ phẩm không rõ nguồn gốc", "Thông tin ban đầu được chuyển tới lực lượng chức năng địa phương để kiểm tra lô hàng và chứng từ.", "ALO 389", "alo-389", "2026-10-02", "high", ["389", "mỹ phẩm", "phản ánh"]),
  art("alo-389-huong-dan-gui-chung-cu", "Hướng dẫn gửi chứng cứ qua đường dây ALO 389", "Một bộ chứng cứ rõ ràng giúp việc phân loại, xác minh và chuyển xử lý phản ánh diễn ra nhanh hơn.", "ALO 389", "alo-389", "2026-09-29", "low", ["389", "chứng cứ", "hướng dẫn"]),
  art("bao-ve-tai-khoan-truoc-ma-doc", "Bảo vệ tài khoản trước chiến dịch mã độc giả mạo hóa đơn", "Tệp đính kèm mang tên hóa đơn có thể cài mã độc và đánh cắp phiên đăng nhập trên thiết bị.", "An ninh số", "an-ninh-so", "2026-09-28", "high", ["mã độc", "tài khoản", "hóa đơn"]),
  art("giai-ma-duong-day-tem-truy-xuat-gia", "Giải mã đường dây tem truy xuất giả: từ mã in đến kho hàng", "Hồ sơ mô phỏng quy trình điều tra, đối chiếu mã và xác định mắt xích phân phối có dấu hiệu vi phạm.", "Giải mã hồ sơ", "giai-ma-ho-so", "2026-09-25", "medium", ["tem giả", "truy xuất", "hồ sơ"]),
  art("ai-ho-tro-phat-hien-gian-hang-rui-ro", "AI hỗ trợ phát hiện gian hàng có tín hiệu rủi ro như thế nào?", "Mô hình chấm điểm có thể hỗ trợ sàng lọc, nhưng kết luận cuối cùng vẫn cần dữ liệu và chuyên gia xác minh.", "TMĐT-AI", "tmdt-ai", "2026-09-22", "low", ["AI", "TMĐT", "chấm điểm"]),
  art("doanh-nghiep-chuan-hoa-du-lieu-san-pham", "Doanh nghiệp chuẩn hóa dữ liệu sản phẩm để chống giả", "Mã định danh, nhật ký thay đổi và phân quyền là ba nền tảng của hệ thống truy xuất đáng tin cậy.", "Doanh nghiệp số", "doanh-nghiep-so", "2026-09-19", "low", ["doanh nghiệp", "dữ liệu", "truy xuất"]),
  art("dien-dan-ket-noi-chong-hang-gia-2026", "Diễn đàn kết nối chống hàng giả và bảo vệ người tiêu dùng 2026", "Sự kiện chia sẻ kinh nghiệm phối hợp giữa doanh nghiệp, nền tảng số và cơ quan thực thi.", "Sự kiện", "su-kien", "2026-09-15", undefined, ["sự kiện", "kết nối", "2026"]),
  art("video-kiem-tra-tem-va-ma-truy-xuat", "Video: 3 bước kiểm tra tem và mã truy xuất", "Video ngắn hướng dẫn quan sát tem, quét mã đúng cách và đối chiếu thông tin nhà sản xuất.", "Video", "video", "2026-09-12", "low", ["video", "tem", "truy xuất"], "video"),
  art("so-tay-nhan-dien-rui-ro-tmdt", "Sổ tay nhận diện rủi ro thương mại điện tử", "Tài liệu tham khảo dành cho người mua hàng và bộ phận chăm sóc khách hàng của doanh nghiệp.", "Thư viện", "thu-vien", "2026-09-08", "low", ["tài liệu", "TMĐT", "sổ tay"], "document"),
  art("bao-cao-du-lieu-canh-bao-quy-iii", "Báo cáo dữ liệu cảnh báo quý III/2026", "Tổng hợp xu hướng phản ánh, nhóm sản phẩm và kênh phát hiện từ bộ dữ liệu minh họa của QSAC.", "Dữ liệu", "du-lieu", "2026-09-01", "medium", ["báo cáo", "dữ liệu", "quý III"], "report"),
];

articles.forEach((article, index) => {
  article.relatedSlugs = [articles[(index + 1) % articles.length].slug, articles[(index + 2) % articles.length].slug];
});

export const categories = [
  ["tin-canh-bao", "Tin & Cảnh báo", "Cập nhật cảnh báo mới, thủ đoạn gian lận và khuyến nghị bảo vệ người tiêu dùng."],
  ["alo-389", "ALO 389", "Thông tin tiếp nhận, phân loại và hướng dẫn phản ánh qua đường dây nóng 389."],
  ["an-ninh-so", "An ninh số", "Cảnh báo lừa đảo trực tuyến, mã độc và giải pháp bảo vệ tài khoản."],
  ["giai-ma-ho-so", "Giải mã hồ sơ", "Phân tích các vụ việc, chuỗi cung ứng và dấu hiệu vi phạm điển hình."],
  ["tmdt-ai", "TMĐT-AI", "Ứng dụng công nghệ và dữ liệu trong giám sát thương mại điện tử."],
  ["doanh-nghiep-so", "Doanh nghiệp số", "Giải pháp số hóa truy xuất, quản trị chất lượng và bảo vệ thương hiệu."],
  ["su-kien", "Sự kiện", "Hội thảo, diễn đàn và hoạt động cộng đồng về phòng chống hàng giả."],
  ["video", "Video", "Hướng dẫn trực quan và bản tin video từ QSAC."],
  ["thu-vien", "Thư viện", "Tài liệu, sổ tay và bộ hướng dẫn thực hành."],
  ["du-lieu", "Dữ liệu", "Báo cáo tổng hợp và dữ liệu minh họa phục vụ theo dõi xu hướng."],
] as const;

export const categoryBySlug = Object.fromEntries(categories.map(([slug, name, description]) => [slug, { slug, name, description }]));

export function plainContent(article: Article) {
  return article.content.flatMap((section) => [section.heading, ...(section.paragraphs ?? []), ...(section.bullets ?? []), section.quote]).filter(Boolean).join(" ");
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}
