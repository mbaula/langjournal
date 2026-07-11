import { getRequestConfig } from "next-intl/server";

import { loadMessages } from "@/lib/i18n/load-messages";
import { resolveRequestLocale } from "@/lib/i18n/request-locale";

export default getRequestConfig(async () => {
  const locale = await resolveRequestLocale();

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
