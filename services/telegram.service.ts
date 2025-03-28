import { load } from "@std/dotenv";

type TPayload = { buyRate: number; sellRate: number };

class TelegamService {
  smptKey: string | undefined;

  sendExchangeCourse = async ({ sellRate, buyRate }: TPayload) => {
    const env = await load();
    const { tgKey, tgChatId } = env;

    const text = `Продажа - ${sellRate} / Покупка ${buyRate}`;
    const response = await fetch(
      `https://api.telegram.org/bot${tgKey}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: tgChatId,
          text,
        }),
      },
    );
    await response.json();
  };
}

export default TelegamService;
