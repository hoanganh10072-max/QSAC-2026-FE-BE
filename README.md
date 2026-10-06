# QSAC — Cổng giám sát và phòng chống hàng giả

Website Next.js/TypeScript mô phỏng cổng thông tin QSAC với nhận diện xanh–đỏ–trắng, đầy đủ responsive, nội dung mẫu và các luồng tương tác chính.

## Chạy dự án

```bash
npm install
npm run dev
```

Mở địa chỉ được in trong terminal (mặc định `http://127.0.0.1:5173`).

## Kiểm tra và build

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Cấu trúc chính

- `app/[[...slug]]/page.tsx`: route động, metadata, canonical và JSON-LD.
- `components/SiteApp.tsx`: component dùng lại, trang chủ, archive, bài viết, tìm kiếm, tiện ích, form và dialog.
- `lib/articles.ts`: 12 bài mẫu, chuyên mục và kiểu dữ liệu.
- `app/globals.css`: design tokens, layout và responsive.
- `public/og.png`: ảnh chia sẻ mạng xã hội.
- `app/sitemap.ts`, `app/robots.ts`: sitemap và robots.

## Route

- `/`
- `/canh-bao-khan-cap`
- `/archive/{tin-canh-bao|alo-389|an-ninh-so|giai-ma-ho-so|tmdt-ai|doanh-nghiep-so|su-kien|video|thu-vien|du-lieu}`
- `/posts/[slug]`
- `/search?q=...`
- `/tra-cuu-traceid`
- `/kiem-tra-link-tmdt`
- `/bao-cao-vi-pham`
- `/gioi-thieu`, `/quy-che-bien-tap`, `/dinh-chinh`, `/bao-mat-du-lieu`, `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung`

## Thay nội dung và nhận diện

- Sửa bài viết/chuyên mục trong `lib/articles.ts`. Dữ liệu đã tách khỏi giao diện để có thể thay bằng CMS/API.
- Thay logo tại component `Logo` trong `components/SiteApp.tsx`.
- Thay favicon ở `public/favicon.svg`.
- Thay ảnh chia sẻ ở `public/og.png`.
- Banner trang chủ nằm trong component `Masthead`; màu và kích thước ở `app/globals.css`.

## Lưu ý bản demo

- TraceID, kiểm tra link, chat, đăng ký bản tin và gửi báo cáo đang mô phỏng ở phía trình duyệt; không truyền dữ liệu tới máy chủ.
- Hình ảnh nội dung là placeholder đồ họa theo màu từng chuyên mục.
- Các số liệu trang chủ là dữ liệu minh họa có ghi ngày cập nhật.
