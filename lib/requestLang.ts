import { headers } from "next/headers";
import { resolveLang, type Lang } from "./i18n";

/** 서버 컴포넌트에서 ?lang= 과 Accept-Language 로 언어를 정한다. */
export async function requestLang(param?: string | null): Promise<Lang> {
  const h = await headers();
  return resolveLang(param, h.get("accept-language"));
}
