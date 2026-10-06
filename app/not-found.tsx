/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
export const metadata:Metadata={title:"Không tìm thấy trang",description:"Trang không tồn tại trên QSAC.",robots:{index:false,follow:false}};
export default function NotFound(){return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"24px",textAlign:"center"}}><div><p style={{color:"#d92525",fontWeight:800}}>LỖI 404</p><h1>Không tìm thấy trang</h1><p>Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi.</p><a href="/" className="btn primary">Về trang chủ</a></div></main>}
