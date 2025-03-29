import { load } from "@std/dotenv";
import { ExchangeRate } from "./db.service.ts";

export type TPayload = { prev: ExchangeRate; current: ExchangeRate };

const formatCurrency = (value: number) => value.toFixed(2).replace(".", ",");

class TelegramService {
  private buildMessage(prev: ExchangeRate, current: ExchangeRate) {
    const sellChange = current.sell_rate - prev.sell_rate;
    const trend = sellChange > 0
      ? "📈 Растёт"
      : sellChange < 0
      ? "📉 Падает"
      : "➖ Стабильно";

    return `
🕒 ${
      new Date().toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })
    }

${trend}
Текущий курс: ${formatCurrency(current.sell_rate)} ₽
Изменение: ${formatCurrency(sellChange)} (${
      (Math.abs(sellChange) / prev.sell_rate * 100).toFixed(1)
    }%)

${this.getBuyRecommendation(sellChange)}
    `.trim();
  }

  private getBuyRecommendation(change: number) {
    if (change < -0.5) return "✅ Идеальный момент для покупки!";
    if (change < -0.2) return "👍 Хорошая возможность купить";
    if (change > 0.3) return "⏳ Лучше подождать снижения";
    return "🔄 Нейтральная ситуация";
  }

  // Исправленный метод отправки
  async sendExchangeCourse({ prev, current }: TPayload) {
    const env = await load();
    const { tgKey, tgChatId } = env;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${tgKey}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: tgChatId,
            text: this.buildMessage(prev, current),
          }),
        },
      );
      return await response.json();
    } catch (error) {
      console.error("Ошибка отправки:", error);
      return { ok: false };
    }
  }
}

export default TelegramService;
